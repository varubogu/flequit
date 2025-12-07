# Automerge-Repo 概念設計書

タスク管理アプリケーションのデータ管理システム概念設計。
Tauri → Commands → Facade → Service → Repository の4階層呼び出し構造で、クリーンアーキテクチャとAutomerge-RepoによるCRDT操作を提供する。

## 設計概要

### アーキテクチャ

```
Frontend (SvelteKit)
    ↓ Tauri Invoke
Commands Layer (Tauri Command)
    ↓ ファサード呼び出し
Facade Layer (Application Facade)
    ↓ ビジネスロジック呼び出し
Service Layer (Business Logic)
    ↓ データアクセス
Repository Layer (Data Access Layer)
    ├── local_automerge/ (Automerge実装)
    ├── local_sqlite/ (SQLite実装)
    ├── cloud_automerge/ (クラウドストレージのAutomerge実装)
    └── web/ (Webサーバー実装)
```

### レイヤー責務

- **Commands Layer**:
  - Tauri invoke関数の公開
  - 入力検証、結果変換
  - Facadeレイヤーの呼び出し

- **Facade Layer**:
  - アプリケーション層の統合ポイント
  - 複数サービスの協調処理
  - トランザクション境界の管理
  - コマンドモデルへの変換

- **Service Layer**:
  - ドメインビジネスロジック
  - エンティティ間の整合性維持
  - 権限・バリデーションチェック
  - ストレージ実装に依存しない抽象化

- **Repository Layer**:
  - データアクセスの具象実装
  - 複数ストレージタイプの実装
    - **local_automerge/**: ローカルAutomerge実装
    - **local_sqlite/**: ローカルSQLite実装
    - **cloud_automerge/**: クラウドAutomerge実装
    - **web/**: Webサーバー実装
  - CRUD操作とデータ永続化
  - 型変換・シリアライゼーション

### データフロー

```
Frontend Request → Commands Layer → Facade Layer → Service Layer → Repository Layer
                                                                        ↓
                                                    Repository実装による分岐処理
                                                    ├── local_automerge/
                                                    ├── local_sqlite/
                                                    ├── cloud_automerge/
                                                    └── web/
                                                                        ↓
                                            選択されたストレージでのデータ操作
                                                                        ↓
                                                    Network Sync (必要に応じて)
```

### Automerge Document操作フロー

Repository Layer内での基本操作パターン:

1. Document取得 → 2. 型変換 → 3. 構造体操作 → 4. Document更新 → 5. 保存・同期

CRDT操作の種類:

- Insert: 新規エンティティ追加
- Update: 既存データ部分更新
- Delete: ドキュメントを `.deleted/` フォルダに移動（後述の「ドキュメント削除とゴミ箱機能」を参照）

詳細な実装例については別紙「automerge-document-operations.md」を参照。

## プロジェクト構造

```
src-tauri/src/
├── commands/                   # Tauriコマンド層
│   └── mod.rs                  # Tauri invoke関数の公開
├── facades/                    # アプリケーションファサード層
│   └── mod.rs                  # 複数サービスの協調処理
├── services/                   # ドメインビジネスロジック層
│   └── mod.rs                  # ストレージ非依存のビジネスロジック
├── repositories/               # データアクセス層（複数実装）
│   ├── local_automerge/        # ローカルAutomerge実装
│   │   ├── document_manager.rs
│   │   ├── project.rs
│   │   ├── account.rs
│   │   ├── user.rs
│   │   └── settings.rs
│   ├── local_sqlite/           # ローカルSQLite実装
│   │   └── mod.rs
│   ├── cloud_automerge/        # クラウドAutomerge実装
│   │   └── mod.rs
│   ├── web/                    # Webサーバー実装
│   │   └── mod.rs
│   ├── base_repository_trait.rs     # 基底リポジトリトレイト
│   ├── project_repository_trait.rs  # プロジェクトリポジトリトレイト
│   ├── task_list_repository_trait.rs # タスクリストリポジトリトレイト
│   └── mod.rs
├── models/                     # データモデル層
│   ├── project.rs
│   ├── account.rs
│   ├── user.rs
│   ├── task.rs
│   ├── task_list.rs
│   ├── tag.rs
│   ├── command/                # コマンドモデル（フロントエンド⇔バックエンド）
│   └── mod.rs
├── types/                      # 型定義・列挙型
│   └── mod.rs
├── errors/                     # エラー型定義
│   └── mod.rs
└── main.rs
```

## データ階層構造

### Automergeドキュメント分割

現在の実装では、以下の4つのAutomergeドキュメントに分割されています：

```
settings.automerge                 # 設定・プロジェクト一覧ドキュメント
├── projects[] (Project構造体配列)
├── local_settings (LocalSettings構造体)
└── view_settings[] (ViewItem構造体配列)

account.automerge                  # アカウント情報ドキュメント
└── (Account構造体)

user.automerge                     # ユーザー情報ドキュメント
└── (User構造体)

project_{project_id}.automerge     # プロジェクト別ドキュメント
├── project_id (文字列)
├── task_lists[] (TaskList構造体配列)
├── tasks[] (Task構造体配列)
├── subtasks[] (SubTask構造体配列)
├── tags[] (Tag構造体配列)
└── project_members[] (ProjectMember構造体配列)
```

## 階層的データアクセス API設計

### 基本パターン

```rust
// Settings Document アクセス
list_projects() -> Result<Vec<Project>, RepositoryError>
get_local_settings() -> Result<LocalSettings, RepositoryError>
set_local_settings(settings: &LocalSettings) -> Result<(), RepositoryError>

// Account/User Document アクセス
get_account() -> Result<Option<Account>, RepositoryError>
set_account(account: &Account) -> Result<(), RepositoryError>
get_user() -> Result<Option<User>, RepositoryError>
set_user(user: &User) -> Result<(), RepositoryError>

// Project Document アクセス (project_id毎)
// タスクリスト操作
set_task_list(project_id: &str, task_list: &TaskList) -> Result<(), RepositoryError>
get_task_list(project_id: &str, task_list_id: &str) -> Result<Option<TaskList>, RepositoryError>
list_task_lists(project_id: &str) -> Result<Vec<TaskList>, RepositoryError>

// タスク操作
set_task(project_id: &str, task: &Task) -> Result<(), RepositoryError>
get_task(project_id: &str, task_id: &str) -> Result<Option<Task>, RepositoryError>
list_tasks(project_id: &str) -> Result<Vec<Task>, RepositoryError>

// サブタスク操作
set_subtask(subtask: &SubTask) -> Result<(), RepositoryError>
get_subtask(subtask_id: &str) -> Result<Option<SubTask>, RepositoryError>
list_subtasks(task_id: &str) -> Result<Vec<SubTask>, RepositoryError>

// タグ操作
set_tag(project_id: &str, tag: &Tag) -> Result<(), RepositoryError>
get_tag(project_id: &str, tag_id: &str) -> Result<Option<Tag>, RepositoryError>
list_tags(project_id: &str) -> Result<Vec<Tag>, RepositoryError>

// プロジェクトメンバー操作
set_project_member(project_id: &str, member: &ProjectMember) -> Result<(), RepositoryError>
get_project_member(project_id: &str, user_id: &str) -> Result<Option<ProjectMember>, RepositoryError>
list_project_members(project_id: &str) -> Result<Vec<ProjectMember>, RepositoryError>
```

## エラーハンドリング

### エラー変換フロー

```
Repository Error → Service Error → Facade Error → Command Error → Frontend
```

### 各層の役割

- **RepositoryError**: データアクセスエラー（ストレージ固有）
- **ServiceError**: ドメインビジネスロジックエラー（RepositoryErrorからの自動変換含む）
- **FacadeError**: アプリケーション統合エラー（複数サービス協調時のエラー）
- **CommandError**: UI表示用エラー（SerializationError、入力検証エラー等）

### データ整合性エラー

**削除済みエンティティへの操作**:

- `.deleted/` フォルダに移動済みのエンティティへの操作は失敗
- RepositoryErrorとしてエラーを返却
- 削除されたドキュメントはFileStorage初期化時に読み込み対象から除外される

**バリデーションエラー**:

- 必須フィールド不足、型制約違反等
- 入力値検証はService Layer、データ制約はRepository Layerで実施

**エラー通知**:

- 全てのエラーはCommand戻り値としてフロントエンドに通知
- フロントエンドでユーザーへの表示を実装

### 同期エラー

**リトライ戦略**:

- 周期的同期：次回同期時に再実行
- 手動同期：ユーザーが再度実行

**オフライン対応**:

- ローカル動作が基本、同期はオプション機能
- ネットワーク切断時も通常動作継続

## 主要機能

### Automerge-Repo統合

- CRDT操作による自動マージ
- 競合解決の自動化
- 履歴管理機能

### 同期機能

- ローカルファースト設計（SQLiteベース）
- 増分同期：Automergeが自動処理
- 競合検知：同期実行時に自動解決
- 同期対象：Webバックエンドサーバー（※自分でセルフホスティング可）、クラウドストレージ
- オフライン動作：標準機能

### データ管理

- 型安全な構造体操作
- 階層的データアクセス
- トランザクション管理

### 型安全性

- Rust厳格型システムによる型保証
- 必須フィールド：id、作成日時、更新日時
- その他フィールド：全てOptional（将来の拡張性考慮）
- 型変換失敗：不正ドキュメントとしてエラー処理

## ファイルストレージとDocumentIDマッピング

### ファイルストレージアーキテクチャ

Automergeファイルストレージの実装は、**人間が読めるファイル名**を使用しながら、automerge-repoのDocumentIdベースのシステムとの互換性を**インメモリマッピング**によって維持します。

### ファイル命名規則

ファイルは `~/.local/share/flequit/automerge/` に説明的な名前で保存されます：

- `settings.automerge` - アプリケーション設定とプロジェクト一覧
- `account.automerge` - アカウント情報
- `user.automerge` - ユーザープロフィール
- `project_{uuid}.automerge` - プロジェクト固有ドキュメント（1プロジェクト = 1ファイル）

### 動的マッピングシステム

**永続化されたマッピングファイルは使用しません。** 代わりに、起動時にインメモリの双方向マッピングを構築します：

1. **起動時スキャン**: `FileStorage::new()` がストレージディレクトリ内の全 `.automerge` ファイルをスキャン
   - `.deleted/` フォルダ内のファイルは除外（削除済みファイル）
   - ディレクトリはスキップ（ファイルのみ処理）
2. **DocumentId抽出**: 各ファイルを読み込み、バイナリAutomergeデータから埋め込まれたDocumentIdを抽出
3. **DocumentId生成**: ファイル内容からDocumentIdを抽出できない場合、ファイル名から決定的に生成（UUID v5使用）
4. **マッピング構築**: `HashMap<DocumentId, Filename>` と `HashMap<Filename, DocumentId>` をメモリ内に構築
5. **実行時アクセス**: 全ファイル操作でインメモリマッピングを使用してDocumentIdとファイル名を変換

### ファイルポータビリティの利点

この設計により以下が実現されます：

- **簡単なファイル共有**: ユーザーは `.automerge` ファイルを直接コピーしてデータを共有可能
- **クラウドストレージ互換性**: クラウドストレージフォルダへのシンボリックリンクがシームレスに動作
- **ゼロコンフィグレーション**: コピーされたファイルはセットアップなしで即座に動作
- **クリーンなストレージ**: ストレージディレクトリには `.automerge` ファイルのみ存在（メタデータファイル不要）

### 実装詳細

```rust
// インメモリのみのマッピング（永続化しない）
struct FileNameMapping {
    id_to_filename: HashMap<String, String>,
    filename_to_id: HashMap<String, String>,
}

// 起動時初期化
pub fn new<P: AsRef<Path>>(base_path: P) -> Result<Self, AutomergeError> {
    // 既存の .automerge ファイルをスキャン
    // ファイルのバイナリ内容からDocumentIdを抽出
    // 抽出失敗時はファイル名から決定的に生成
    // インメモリマッピングを構築
}
```

### DocumentId抽出と生成

**抽出**: DocumentIdはautomerge-repoのバイナリファイルフォーマットに埋め込まれています。`extract_document_id_from_file()` メソッドがバイナリ構造を解析して、automerge-repoシステム内でドキュメントを識別するUUIDを取得します。

**生成**: ファイル内容からDocumentIdを抽出できない場合（compactされたファイルなど）、`generate_document_id_from_filename()` メソッドがファイル名からUUID v5（名前ベースUUID）を使用して決定的にDocumentIdを生成します。これにより、同じファイル名から常に同じDocumentIdが生成され、ファイル内容に関係なく一貫性が保たれます。

### ファイル書き込み時のマッピング保持

`append()` および `compact()` 操作時、`ensure_mapping_from_path()` メソッドが自動的に呼び出され、ファイルパスからファイル名を抽出してマッピングを確保します。これにより、ファイル内容が変更されてもマッピングが維持されます。

## ドキュメント削除とゴミ箱機能

### 削除戦略

Automergeドキュメントの削除は、物理削除ではなく **`.deleted/` フォルダへの移動** によって実現されます。これにより、以下の利点が得られます：

- **誤削除からの保護**: ファイルは完全には削除されず、復元可能
- **データバックアップ**: 削除されたファイルもバックアップに含まれる
- **監査証跡**: 削除日時と元の場所を記録

### ファイル構造

```
~/.local/share/flequit/automerge/
├── settings.automerge          # 有効なファイル
├── account.automerge           # 有効なファイル
├── user.automerge              # 有効なファイル
├── project_xxx.automerge       # 有効なファイル
└── .deleted/                   # 削除済みフォルダ
    ├── project_yyy.automerge       # 削除されたプロジェクト
    ├── project_yyy.meta.json       # 削除メタデータ
    ├── project_zzz.automerge       # 削除されたプロジェクト
    └── project_zzz.meta.json       # 削除メタデータ
```

### 削除メタデータ

各削除ファイルに対して、`.meta.json` ファイルが自動生成されます：

```json
{
  "doc_type": "Project(ProjectId(16e13612-6223-429b-b97f-45a6bfdf0b76))",
  "deleted_at": "2025-12-07T20:09:16.903708468Z",
  "original_filename": "project_16e13612-6223-429b-b97f-45a6bfdf0b76.automerge",
  "original_path": ".../automerge_data/project_16e13612-6223-429b-b97f-45a6bfdf0b76.automerge"
}
```

### 削除処理フロー

1. **メモリキャッシュから削除**: `DocumentManager::delete()` がメモリ内のドキュメントを削除
2. **ファイルチェック**: 元ファイルの存在確認
3. **`.deleted/` フォルダ作成**: 存在しない場合は作成
4. **ファイル移動**: 元のファイルを `.deleted/` フォルダに移動
5. **メタデータ作成**: 削除日時と元パスを記録した `.meta.json` ファイルを作成
6. **ログ記録**: 削除操作をログに記録

### FileStorage初期化時の除外

`FileStorage::new()` の起動時スキャンでは、以下を自動的に除外します：

- `.deleted/` フォルダ内の全ファイル
- ディレクトリ（ファイルのみ処理）
- `.meta.json` ファイル（メタデータ）

これにより、削除済みドキュメントがアプリケーションから読み込まれることはありません。

### 将来的な拡張機能

以下の機能は将来的に実装可能です：

#### 復元機能
```rust
/// .deleted/ フォルダから元の場所にファイルを復元
pub fn restore(&mut self, filename: &str) -> Result<(), AutomergeError>
```

- メタデータファイルから元のパスを取得
- ファイルを元の場所に移動
- メタデータファイルを削除
- メモリキャッシュを更新

#### 完全削除機能（プラットフォーム別）

**デスクトップ環境（Windows/macOS/Linux）**:
```rust
/// .deleted/ フォルダからOSのゴミ箱にファイルを移動
/// trash クレートを使用
pub fn permanent_delete(&mut self, filename: &str) -> Result<(), AutomergeError>
```

**モバイル環境（iOS/Android）**:
```rust
/// .deleted/ フォルダから完全に削除
pub fn permanent_delete_mobile(&mut self, filename: &str) -> Result<(), AutomergeError>
```

#### 自動クリーンアップ機能
```rust
/// 指定日数経過した削除ファイルを自動削除
pub fn cleanup_old_deleted_files(&mut self, days: u32) -> Result<(), AutomergeError>
```

- メタデータの `deleted_at` を確認
- 指定日数以上経過したファイルをOSゴミ箱に移動（デスクトップ）または完全削除（モバイル）

### 設計の利点

✅ **二段階の安全網**: アプリ内復元 → OSゴミ箱 → 完全削除
✅ **クロスプラットフォーム**: デスクトップ・モバイルで統一的な動作
✅ **バックアップ容易**: フォルダごとコピーで削除ファイルも含めて完全移行
✅ **実装シンプル**: ファイル移動のみで実現
✅ **拡張性**: 復元・完全削除・自動クリーンアップを段階的に追加可能

## パフォーマンス最適化

### 2層ストレージアーキテクチャ

- **SQLite**: 最新データの高速アクセス、インデックス・クエリ最適化
- **Automerge**: 履歴管理・同期機能に特化
- **メモリ効率**: 必要な最新データのみメモリ展開
- **スケーラビリティ**: データ量増加時も実行時パフォーマンス維持

### データアクセスパターン

- **読み込み**: SQLiteから最新データを取得（高速）
- **書き込み**: SQLite + Automerge両方更新（整合性保証）
- **同期**: Automergeから変更をSQLiteに反映
- **履歴**: Automergeから過去データアクセス

### Automergeドキュメント粒度

- **4ドキュメント分割方式**:
  - **Settings Document**: アプリケーション設定とプロジェクト一覧
  - **Account Document**: 認証アカウント情報（プロバイダー情報、認証状態）
  - **User Document**: ユーザープロフィール情報（個人設定、プロフィール）
  - **Project Documents**: プロジェクト毎の詳細データ（1プロジェクト = 1ドキュメント）

- **Project Document含有データ**:
  - プロジェクト詳細データ
  - 全タスクリスト、全タスク、全サブタスク
  - プロジェクト固有タグ、メンバー情報

- **設計根拠**:
  - **データ一貫性**: プロジェクト内エンティティの整合性を1ドキュメントで保証
  - **トランザクション境界**: プロジェクト内の複数変更を1トランザクションで処理
  - **権限管理**: プロジェクト単位でのアクセス制御が自然
  - **パフォーマンス**: 2層アーキテクチャにより大きなドキュメントも実行時影響軽微
  - **セキュリティ**: アカウント認証情報とユーザー情報を分離管理
  - **設定分離**: グローバル設定とプロジェクト固有データの独立管理
