# データ削除設計書

## 概要

Flequitアプリケーションにおけるデータ削除機能の設計仕様書。Automergeの分散同期特性を考慮し、SQLiteとAutomergeで異なる削除戦略を採用する。また、データ変更・削除操作の追跡と復元機能を提供する設計を定義する。

## 背景

現在の実装では、SQLiteとAutomergeの両方で物理削除を行っている。しかし、Automergeは分散同期システムであるため、物理削除は同期時のデータ損失や履歴の欠損を引き起こす可能性がある。

本設計では、SQLiteとAutomergeで異なる削除戦略を採用し、以下の要件を満たす：

1. SQLite：高速なクエリ性能を維持するため、物理削除を継続
2. Automerge：データの履歴保持と同期整合性のため、論理削除を採用
3. 操作者追跡：データの変更・削除を実行したユーザーと日時を記録
4. 復元機能：権限を持つユーザーによるデータ復元を可能にする
5. カスケード削除：親データ削除時に子データも適切に処理

## 設計方針

### 基本原則

- **SQLite**: 物理削除を継続（パフォーマンス優先）
- **Automerge**: 論理削除を採用（履歴保持・同期整合性優先）
- **Service層**: 削除処理・カスケード制御を一元管理
- **Infrastructure層**: Service層からの個別データ操作要求のみを処理（カスケード制御はService層の責務）
- **操作者追跡**: 削除・更新操作時に`updated_by`と`updated_at`で操作者と日時を記録（削除専用フィールドは持たない）

### 削除フローの分離

```
Service層
  ├─ SQLite削除処理（物理削除）
  └─ Automerge削除処理（論理削除：deleted=true）
```

## データ構造の変更

### 追加フィールド

すべてのエンティティテーブルに以下のフィールドを追加する：

| フィールド名 | 型 | 説明 | フロントエンド | バックエンド（lequit-model） | SQLite（flequit-infrastructure-sqlite） | Automerge（flequit-infrastructure-automerge） |
|------------|-----|------|--------|--------|-----------|
| `deleted` | `bool` | 削除フラグ（論理削除用） | 追加 | 追加 | 追加 | 追加 |
| `updated_by` | `Option<UserId>` | 最終更新を実行したユーザーID<br>（作成・更新・削除・復元すべての操作で記録） | 追加 | 追加 | 追加 | 追加 |
| `updated_at` | `Option<DateTime<Utc>>` | 最終更新実行日時<br>（作成・更新・削除・復元すべての操作で記録） | 追加 | 追加 | 追加 | 追加 |

### フィールドの用途

- **SQLite**: `updated_by`, `updated_at`は最新の操作情報を保持。`deleted`は物理削除前に記録されるが、削除後はデータが存在しないため使用されない。
- **Automerge**: すべてのフィールドが有効。`deleted=true`のレコードは論理削除状態として保持され続け、履歴として残る。`updated_by`と`updated_at`で削除操作者・日時も追跡可能。

### 操作者追跡の設計

削除専用の`deleted_by`や`deleted_at`フィールドは設けず、`updated_by`と`updated_at`で統一的に操作者を記録する：

- **作成時**: `updated_by`に作成者、`updated_at`に作成日時を記録
- **更新時**: `updated_by`に更新者、`updated_at`に更新日時を記録
- **削除時**: `deleted=true`に設定し、`updated_by`に削除者、`updated_at`に削除日時を記録
- **復元時**: `deleted=false`に設定し、`updated_by`に復元者、`updated_at`に復元日時を記録

これにより、最終操作者が誰で、その操作が削除なのか復元なのかは`deleted`フラグとの組み合わせで判断できる。

#### Trackableトレイトによる共通化

操作者情報の設定を共通化するため、`Trackable`トレイトを定義する：

```rust
// flequit-model/src/traits/trackable.rs
pub trait Trackable {
    /// ユーザーIDと更新日時をセットする
    fn set_tracking_info(&mut self, user_id: UserId, updated_at: DateTime<Utc>);
}

// 各エンティティで実装
impl Trackable for Project {
    fn set_tracking_info(&mut self, user_id: UserId, updated_at: DateTime<Utc>) {
        self.updated_by = Some(user_id);
        self.updated_at = Some(updated_at);
    }
}
```

このトレイトを検索することで、更新時に日時とユーザーを正しく更新しているか確認できる。

#### タイムスタンプの取得

- **取得場所**: Tauriコマンド層で`Utc::now()`を取得
- **理由**: クライアントからの日時は信頼できないため
- **使用方法**: コマンド受信時点の日時を取得し、そのコマンド内のすべてのデータ変更で同一の日時を使用

```rust
#[tauri::command]
pub async fn delete_project(
    state: State<'_, AppState>,
    project_id: String,
    user_id: String,
) -> Result<bool, String> {
    let timestamp = Utc::now(); // コマンド受信時点の日時
    // この timestamp をFacade → Service → Infrastructureに渡す
}
```

## 実装詳細

### SQLite側の実装

#### 削除処理

SQLiteでは従来通り物理削除を実行する。ただし、Service層がカスケード削除を制御するため、Infrastructure層は単一データの削除のみを担当する。

```rust
// Infrastructure層での削除処理（物理削除）
// Service層から個別データごとに呼び出される
async fn delete(&self, id: &TId) -> Result<(), RepositoryError> {
    // 単一データの物理削除のみを実行
    // カスケード削除の制御はService層の責務
    sqlx::query("DELETE FROM table_name WHERE id = ?")
        .bind(id)
        .execute(&self.pool)
        .await?;
    Ok(())
}
```

#### 更新処理

更新時は`updated_by`と`updated_at`を記録する：

```rust
// Infrastructure層での更新処理
async fn update(&self, entity: &T, user_id: &UserId) -> Result<(), RepositoryError> {
    // updated_by, updated_atを含めた更新
    sqlx::query("UPDATE table_name SET ..., updated_by = ?, updated_at = ? WHERE id = ?")
        .bind(user_id)
        .bind(Utc::now())
        .bind(&entity.id)
        .execute(&self.pool)
        .await?;
    Ok(())
}
```

#### 注意事項

- SQLiteでは物理削除のため、`deleted`フィールドは実質的に使用されない
- ただし、スキーマには残しておく（Automergeとの互換性のため）
- Infrastructure層は単一データ操作のみを担当（カスケード削除はService層の責務）

### Automerge側の実装

#### 削除処理（論理削除）

Automergeでは論理削除を実行する。Infrastructure層は単一データの論理削除のみを担当し、カスケード削除はService層が制御する。

1. `deleted`フィールドを`true`に設定
2. `updated_by`に削除者のユーザーIDを設定
3. `updated_at`に削除日時を設定

```rust
// Infrastructure層での削除処理（論理削除）
// Service層から個別データごとに呼び出される
async fn delete(&self, id: &TId, user_id: &UserId) -> Result<(), RepositoryError> {
    // Automergeドキュメントを更新
    let mut doc = self.get_doc_mut()?;

    // 対象データを取得
    let entity = doc.get_entity(id)?;

    // 論理削除フラグと操作者情報を設定
    entity.set("deleted", true)?;
    entity.set("updated_by", user_id)?;
    entity.set("updated_at", Utc::now())?;

    Ok(())
}
```

#### 更新処理

更新時も`updated_by`と`updated_at`を記録する：

```rust
// Infrastructure層での更新処理
async fn update(&self, entity: &T, user_id: &UserId) -> Result<(), RepositoryError> {
    let mut doc = self.get_doc_mut()?;
    let target = doc.get_entity(&entity.id)?;

    // エンティティのフィールドを更新
    // ...

    // 操作者情報を記録
    target.set("updated_by", user_id)?;
    target.set("updated_at", Utc::now())?;

    Ok(())
}
```

#### スナップショット機能

Automerge更新失敗時のロールバックのため、更新前の状態をスナップショットとして保存する：

```rust
// Infrastructure-automerge層でのスナップショット実装
pub struct AutomergeSnapshot {
    entity_id: String,
    entity_type: String,
    data: serde_json::Value,
    timestamp: DateTime<Utc>,
}

impl ProjectLocalAutomergeRepository {
    /// 更新前のスナップショットを作成
    async fn create_snapshot(&self, project_id: &ProjectId) -> Result<PathBuf, RepositoryError> {
        // 現在の状態を取得
        let document = self.get_project_document(project_id).await?;

        // スナップショットファイルを作成（一時ファイル）
        let snapshot_dir = self.base_path.join("snapshots");
        std::fs::create_dir_all(&snapshot_dir)?;

        let snapshot_file = snapshot_dir.join(format!("{}_{}.json",
            project_id,
            Utc::now().timestamp()
        ));

        let snapshot = AutomergeSnapshot {
            entity_id: project_id.to_string(),
            entity_type: "Project".to_string(),
            data: serde_json::to_value(&document)?,
            timestamp: Utc::now(),
        };

        std::fs::write(&snapshot_file, serde_json::to_string_pretty(&snapshot)?)?;

        Ok(snapshot_file)
    }

    /// スナップショットから復元
    async fn restore_from_snapshot(&self, snapshot_path: &Path) -> Result<(), RepositoryError> {
        let snapshot_data = std::fs::read_to_string(snapshot_path)?;
        let snapshot: AutomergeSnapshot = serde_json::from_str(&snapshot_data)?;

        let project_id = ProjectId::from(snapshot.entity_id);
        let document: ProjectDocument = serde_json::from_value(snapshot.data)?;

        self.save_project_document(&project_id, &document).await?;

        // 復元後、スナップショットファイルを削除
        std::fs::remove_file(snapshot_path)?;

        Ok(())
    }
}
```

**スナップショットの用途**:
- SQLite更新成功 → Automerge更新失敗時のロールバック
- 停電などによる処理中断後の復旧

#### クエリ処理

論理削除されたデータを除外するクエリ：

```rust
// アクティブなデータのみ取得
async fn find_all(&self) -> Result<Vec<T>, RepositoryError> {
    // deleted = false または deleted フィールドが存在しないデータのみ取得
}

// 削除済みデータのみ取得（復元用）
async fn find_all_deleted(&self) -> Result<Vec<T>, RepositoryError> {
    // deleted = true のデータのみ取得
}

// 特定の削除済みデータを取得
async fn find_deleted_by_id(&self, id: &TId) -> Result<Option<T>, RepositoryError> {
    // deleted = true かつ id 一致のデータを取得
}
```

**アーカイブとの関係**:
- `deleted=true`: 論理削除済み（検索結果に含まれない）
- `is_archived=true`: アーカイブ済み（オプション次第で検索結果に含まれる）
- `deleted=false, is_archived=true`: アーカイブされているが削除されていない（検索可能）

### Service層での制御

Service層は以下の責務を担当：

1. 削除要求の受付
2. **カスケード削除対象の特定と制御**（Infrastructure層は単一データ操作のみ）
3. SQLiteとAutomergeへの削除処理の呼び出し（各データごとに個別に呼び出し）
4. エラーハンドリングとトランザクション管理

```rust
// Service層での削除処理
// カスケード削除の制御を含む
pub async fn delete_project<R>(
    repositories: &R,
    project_id: &ProjectId,
    user_id: &UserId,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // 1. カスケード削除対象の子データを取得
    let task_lists = repositories.sqlite_repo().find_task_lists_by_project(project_id).await?;
    let tasks = repositories.sqlite_repo().find_tasks_by_project(project_id).await?;
    let tags = repositories.sqlite_repo().find_tags_by_project(project_id).await?;

    // 2. 子データを再帰的に削除（SQLite: 物理削除、Automerge: 論理削除）
    for task in &tasks {
        // タスクの子データ（サブタスク、割り当てなど）も削除
        delete_task(repositories, &task.id, user_id).await?;
    }

    for task_list in &task_lists {
        // SQLite: 物理削除
        repositories.sqlite_repo().delete_task_list(&task_list.id).await?;
        // Automerge: 論理削除
        repositories.automerge_repo().delete_task_list(&task_list.id, user_id).await?;
    }

    for tag in &tags {
        // SQLite: 物理削除
        repositories.sqlite_repo().delete_tag(&tag.id).await?;
        // Automerge: 論理削除
        repositories.automerge_repo().delete_tag(&tag.id, user_id).await?;
    }

    // 3. 親データ（プロジェクト）を削除
    // SQLite: 物理削除
    repositories.sqlite_repo().delete_project(project_id).await?;
    // Automerge: 論理削除
    repositories.automerge_repo().delete_project(project_id, user_id).await?;

    Ok(())
}
```

#### Service層の責務

- **カスケード削除の制御**: 親子関係を把握し、削除順序を制御
- **Infrastructure層の呼び出し**: 各データに対してSQLiteとAutomergeのInfrastructure層を個別に呼び出し
- **データ整合性の保証**: SQLiteとAutomergeの両方で削除処理が成功することを保証
- **エラーハンドリング**: どちらかの削除が失敗した場合のロールバック処理
- **親子関係の検索**: 削除対象を特定するための検索処理をService層で実装

```rust
// Service層での親子関係検索例
pub async fn find_child_entities_for_deletion<R>(
    repositories: &R,
    project_id: &ProjectId,
) -> Result<DeletionTargets, ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // SQLiteから削除対象を検索
    let task_lists = repositories.sqlite_task_lists()
        .find_by_project(project_id).await?;

    let tasks = repositories.sqlite_tasks()
        .find_by_project(project_id).await?;

    let tags = repositories.sqlite_tags()
        .find_by_project(project_id).await?;

    Ok(DeletionTargets {
        task_lists,
        tasks,
        tags,
    })
}
```

## 削除フロー

### 通常削除フロー

```
1. ユーザーが削除操作を実行
   ↓
2. Service層が削除要求を受付
   ↓
3. Service層がカスケード削除対象を特定（SQLiteから子データを検索）
   ↓
4. 子データを個別に削除（Service層が制御）
   ├─ 各子データに対して：
   │  ├─ SQLite Infrastructure層: 物理削除（単一データ）
   │  └─ Automerge Infrastructure層: 論理削除（deleted=true, updated_by=削除者, updated_at=削除日時）
   ↓
5. 親データを削除（Service層が制御）
   ├─ SQLite Infrastructure層: 物理削除（単一データ）
   └─ Automerge Infrastructure層: 論理削除（deleted=true, updated_by=削除者, updated_at=削除日時）
   ↓
6. 完了
```

### カスケード削除の例

**プロジェクト削除時の処理：**

```
プロジェクト削除（Service層が全体を制御）
  │
  ├─ 1. カスケード削除対象を特定
  │     ├─ タスクリスト一覧を取得
  │     ├─ タスク一覧を取得
  │     └─ タグ一覧を取得
  │
  ├─ 2. タスク削除（各タスクごとに）
  │     ├─ タスク割り当て削除
  │     │   ├─ SQLite Infrastructure: 物理削除
  │     │   └─ Automerge Infrastructure: 論理削除
  │     ├─ サブタスク削除（各サブタスクごとに）
  │     │   ├─ サブタスクタグ削除
  │     │   │   ├─ SQLite Infrastructure: 物理削除
  │     │   │   └─ Automerge Infrastructure: 論理削除
  │     │   ├─ SQLite Infrastructure: 物理削除
  │     │   └─ Automerge Infrastructure: 論理削除
  │     ├─ タスクリカレンス削除
  │     │   ├─ SQLite Infrastructure: 物理削除
  │     │   └─ Automerge Infrastructure: 論理削除
  │     ├─ SQLite Infrastructure: 物理削除
  │     └─ Automerge Infrastructure: 論理削除
  │
  ├─ 3. タスクリスト削除（各タスクリストごとに）
  │     ├─ SQLite Infrastructure: 物理削除
  │     └─ Automerge Infrastructure: 論理削除
  │
  ├─ 4. タグ削除（各タグごとに）
  │     ├─ SQLite Infrastructure: 物理削除
  │     └─ Automerge Infrastructure: 論理削除
  │
  └─ 5. プロジェクト削除
        ├─ SQLite Infrastructure: 物理削除
        └─ Automerge Infrastructure: 論理削除

※ すべてのAutomerge削除では updated_by と updated_at も記録
```

## 復元機能

### 復元処理

権限を持つユーザーが削除されたデータを復元できる機能を提供する。復元時も`updated_by`と`updated_at`で復元操作者と日時を記録する。

```rust
// Service層での復元処理
pub async fn restore_project<R>(
    repositories: &R,
    project_id: &ProjectId,
    user_id: &UserId,
) -> Result<(), ServiceError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // 1. Automergeから削除されたデータを取得（deleted=true）
    let deleted_project = repositories.automerge_repo()
        .find_deleted_project(project_id).await?;

    // 2. SQLiteに物理的に再作成
    repositories.sqlite_repo()
        .create_project(&deleted_project).await?;

    // 3. Automergeでdeleted=falseに設定（復元操作として記録）
    repositories.automerge_repo()
        .restore_project(project_id, user_id).await?;

    // 4. 子データも再帰的に復元（カスケード復元をService層が制御）
    let deleted_task_lists = repositories.automerge_repo()
        .find_deleted_task_lists_by_project(project_id).await?;

    for task_list in deleted_task_lists {
        restore_task_list(repositories, &task_list.id, user_id).await?;
    }

    // タスク、タグなども同様に復元...

    Ok(())
}
```

#### Infrastructure層での復元実装

```rust
// Automerge Infrastructure層での復元処理
async fn restore_project(&self, id: &ProjectId, user_id: &UserId) -> Result<(), RepositoryError> {
    let mut doc = self.get_doc_mut()?;
    let project = doc.get_entity(id)?;

    // 論理削除フラグを解除し、復元操作を記録
    project.set("deleted", false)?;
    project.set("updated_by", user_id)?;  // 復元者を記録
    project.set("updated_at", Utc::now())?;  // 復元日時を記録

    Ok(())
}
```

### 復元フロー

```
1. ユーザーが復元操作を実行
   ↓
2. Service層が復元要求を受付
   ↓
3. Service層がAutomergeから削除済みデータを取得（deleted=true）
   ↓
4. Service層がSQLiteにデータを再作成（物理的に復元）
   ↓
5. Service層がAutomerge Infrastructure層を呼び出し
   ├─ Automergeでdeleted=falseに設定
   ├─ updated_by = 復元操作者
   └─ updated_at = 復元日時
   ↓
6. 子データも再帰的に復元（Service層が制御）
   ├─ 各子データに対して：
   │  ├─ Automergeから削除済みデータを取得
   │  ├─ SQLiteに物理的に再作成
   │  └─ Automergeでdeleted=falseに設定（updated_by, updated_atを記録）
   ↓
7. 完了
```

## 影響範囲

### 対象エンティティ

以下のすべてのエンティティが対象となる：

- Projects（プロジェクト）
- TaskLists（タスクリスト）
- Tasks（タスク）
- Subtasks（サブタスク）
- Tags（タグ）
- Members（メンバー）
- その他すべてのエンティティ

### 影響を受けるレイヤー

1. **Model層**: エンティティ定義にフィールド追加
2. **Infrastructure層**:
   - SQLite実装：物理削除処理（変更なし、フィールド追加のみ）
   - Automerge実装：論理削除処理の実装
3. **Service層**: 削除・復元処理の制御ロジック追加
4. **Repository層**: 削除処理のインターフェース拡張（必要に応じて）

## 実装手順

### Phase 1: スキーマ変更

1. すべてのエンティティモデルにフィールドを追加
   - `deleted: bool` - デフォルト値は`false`
   - `updated_by: Option<UserId>` - 最終操作者（作成・更新・削除・復元すべて）
   - `updated_at: Option<DateTime<Utc>>` - 最終操作日時
   - ※ 削除専用の`deleted_by`や`deleted_at`は持たない

2. SQLiteスキーマを更新
   - 新規テーブル作成時に上記フィールドを含める
   - デフォルト値の設定（`deleted = false`）
   - ※ 開発段階のためマイグレーションは不要

3. Automergeドキュメント構造を更新
   - 各エンティティにフィールドを追加
   - ※ 開発段階のためマイグレーションは不要

### Phase 2: Infrastructure層実装

1. **SQLite実装の更新**
   - 削除処理の確認（物理削除のまま、単一データのみ処理）
   - 更新処理に`updated_by`、`updated_at`の記録を追加
   - 作成処理に`updated_by`、`updated_at`の記録を追加

2. **Automerge実装の更新**
   - 削除処理の実装（論理削除：`deleted=true`、`updated_by`、`updated_at`を記録）
   - 復元処理の実装（`deleted=false`、`updated_by`、`updated_at`を記録）
   - 更新処理に`updated_by`、`updated_at`の記録を追加
   - 作成処理に`updated_by`、`updated_at`の記録を追加
   - クエリ処理の更新（`deleted=false`のみ取得）
   - 削除済みデータ取得クエリの実装（復元用）

### Phase 3: Service層実装

1. **カスケード削除ロジックの実装**
   - 親子関係の特定処理
   - 削除順序の制御
   - Infrastructure層への個別データ削除呼び出し

2. **復元処理の実装**
   - Automergeからの削除済みデータ取得
   - SQLiteへの物理的な再作成
   - Automergeでの論理削除解除
   - カスケード復元の制御

3. **エラーハンドリング**
   - トランザクション管理
   - ロールバック処理

### Phase 4: テスト

1. **単一エンティティの削除テスト**
   - SQLiteで物理削除されることを確認
   - Automergeで論理削除（`deleted=true`）されることを確認
   - `updated_by`と`updated_at`が正しく記録されることを確認

2. **カスケード削除のテスト**
   - 親データ削除時に子データも削除されることを確認
   - 削除順序が正しいことを確認
   - すべての子データが適切に処理されることを確認

3. **復元機能のテスト**
   - 削除済みデータが復元されることを確認
   - SQLiteに物理的に再作成されることを確認
   - Automergeで`deleted=false`に設定されることを確認
   - `updated_by`と`updated_at`に復元操作が記録されることを確認
   - カスケード復元が正しく動作することを確認

4. **SQLiteとAutomergeの整合性テスト**
   - 削除後のデータ整合性を確認
   - 復元後のデータ整合性を確認
   - エラー時のロールバック動作を確認

5. **操作者追跡のテスト**
   - 作成時に`updated_by`と`updated_at`が記録されることを確認
   - 更新時に`updated_by`と`updated_at`が更新されることを確認
   - 削除時に`updated_by`と`updated_at`に削除操作が記録されることを確認
   - 復元時に`updated_by`と`updated_at`に復元操作が記録されることを確認

## 注意事項

### データ整合性

- **Service層の責務**: SQLiteとAutomergeで削除戦略が異なるため、Service層で整合性を保証する
- **トランザクション管理**: 以下の手順で整合性を保証
  1. **Automergeスナップショット作成**: 更新前の状態を一時ファイルに保存
  2. **SQLiteトランザクション開始**: SeaORMの`transaction()`を使用
  3. **SQLiteの更新処理を実行**: コミットせず保留
  4. **Automergeの更新処理を実行**: 論理削除や操作者記録
  5. **成功時**: SQLiteをコミット、スナップショットファイルを削除
  6. **エラー時**:
     - SQLiteをロールバック
     - Automergeはスナップショットから復元
     - スナップショットファイルを削除
  7. **トランザクションの単位**: 1アクション（1つの削除・更新・作成操作）ごと
- **カスケード削除の制御**: Infrastructure層は単一データ操作のみを行い、親子関係の制御はService層が担当
- **Facade層での制御**: トランザクション開始・終了はFacade層（`flequit-core/src/facades`）で実行

```rust
// Facade層でのトランザクション制御例
pub async fn delete_project_with_transaction<R>(
    repositories: &R,
    project_id: &ProjectId,
    user_id: &UserId,
    timestamp: DateTime<Utc>,
) -> Result<(), FacadeError>
where
    R: InfrastructureRepositoriesTrait + Send + Sync,
{
    // 1. Automergeスナップショット作成
    let snapshot_path = repositories.automerge_projects()
        .create_snapshot(project_id).await?;

    // 2. SQLiteトランザクション開始
    let tx = repositories.sqlite_connection().begin().await?;

    match async {
        // 3-4. Service層を呼び出し（SQLite + Automerge更新）
        project_service::delete_project(repositories, project_id, user_id, timestamp).await?;
        Ok::<(), ServiceError>(())
    }.await {
        Ok(_) => {
            // 5. 成功: コミット & スナップショット削除
            tx.commit().await?;
            std::fs::remove_file(&snapshot_path)?;
            Ok(())
        }
        Err(e) => {
            // 6. エラー: ロールバック & スナップショット復元
            tx.rollback().await?;
            repositories.automerge_projects()
                .restore_from_snapshot(&snapshot_path).await?;
            std::fs::remove_file(&snapshot_path)?;
            Err(FacadeError::from(e))
        }
    }
}
```

### パフォーマンス

- **SQLiteの性能**: 物理削除を継続するため、クエリ性能への影響は最小限
- **Automergeのクエリ**: 論理削除のため、すべてのクエリで`deleted=false`の条件を必ず含める必要がある
- **インデックス**: `deleted`フィールドにインデックスを設定してクエリ性能を最適化
- **データ肥大化**: 削除済みデータはAutomergeに永続的に保持されるが、アプリはSQLiteをベースとするため性能低下の心配はない
- **アーカイブ**: 長期間の運用を想定しないため、削除済みデータのアーカイブ機能は実装しない

### 同期時の考慮

- **削除の同期**: Automergeで論理削除されたデータ（`deleted=true`）は同期時に他の端末にも伝播される
- **復元の同期**: 復元操作（`deleted=false`への変更）も同期される
- **操作履歴**: `updated_by`と`updated_at`も同期されるため、すべての端末で操作履歴を追跡可能
- **競合検出と解決**:
  1. 同期前に自身の最新データへのポインタ（バージョン）を保持
  2. 同期後に増えたデータ（変更）を検出
  3. 競合がある場合はユーザーに報告
  4. ユーザーがどのバージョンを反映するか選択
  5. 選択されたバージョンでデータを更新

### 権限管理

- **ユーザーID取得**: クライアントから操作時点のユーザーIDが送信される
- **復元権限**: 復元機能の権限チェックはService層で実行
- **復元の柔軟性**: 任意の階層でデータを復元可能（ただし子を復元する場合は親が必要）
- **操作者追跡**: すべての操作（作成・更新・削除・復元）で`updated_by`に操作者を記録
- **監査ログ**: Automergeの履歴機能と組み合わせることで、完全な監査ログを実現可能

### Infrastructure層の設計原則

- **単一責任**: Infrastructure層は単一データの操作のみを担当
- **カスケード削除の禁止**: Infrastructure層ではカスケード削除を実装しない（Service層の責務）
- **シンプルな実装**: 各リポジトリは自身のエンティティの追加・更新・削除・取得のみを実装

## 関連ドキュメント

- `docs/en/develop/design/data/data-model.md` - データモデル仕様
- `docs/en/develop/design/data/automerge-structure.md` - Automerge構造仕様
- `docs/en/develop/design/data/entity/` - エンティティ定義
