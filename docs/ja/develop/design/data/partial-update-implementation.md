# 部分更新システム実装詳細設計書

## 概要

本設計書は、Tauriタスク管理アプリケーションにおける**フィールド単位の部分更新システム**の実装について詳細に定めるものです。`partially`クレートを活用して効率的な部分更新を実現し、データ転送量の最適化と型安全性の両立を図ります。

## 1. 背景と課題

### 1.1 現状の問題

- **データ転送効率**: 列の変更でも行全体のデータ転送が発生
- **パフォーマンス**: 不必要なデータ転送とデータベース更新
- **保守性**: 列単位コマンドを個別作成すると膨大なコード量

### 1.2 要件

- 読み込み：全データ、テーブル単位、行単位、列単位
- 書き込み：全データ（初回のみ）、行単位（新規追加）、列単位（リアルタイム更新）
- 複数のRepository実装（SQLite、AutoMerge、将来的にクラウド/Web）

## 2. 設計方針

1. **Patch/Delta Update パターン**の採用
2. **`partially`クレート**による自動生成
3. **既存システムとの併存**による段階的導入
4. **型安全性**の最大限活用

## 3. 技術選定

### 3.1 部分更新ライブラリ比較

| アプローチ                   | データ転送量 | 実装コスト | 保守性   | 型安全性 | AutoMerge親和性 |
| ---------------------------- | ------------ | ---------- | -------- | -------- | --------------- |
| **Patch Update (partially)** | ⭐⭐⭐       | ⭐⭐⭐⭐   | ⭐⭐⭐⭐ | ⭐⭐⭐   | ⭐⭐⭐          |
| Field Specific Commands      | ⭐⭐⭐       | ⭐         | ⭐       | ⭐⭐⭐   | ⭐⭐            |
| Generic Field Update         | ⭐⭐⭐       | ⭐⭐⭐     | ⭐⭐     | ⭐       | ⭐⭐            |
| 現状維持                     | ⭐           | ⭐⭐⭐     | ⭐⭐⭐   | ⭐⭐⭐   | ⭐⭐⭐          |

### 3.2 採用ライブラリ

**`partially`クレート**を採用

**採用理由**:

- ✅ 成熟したAPI設計と豊富なドキュメント
- ✅ `apply_some()`による部分適用と変更検知機能
- ✅ フィールドレベルでの詳細制御（`#[partially(omit)]`等）
- ✅ 自動生成による開発効率向上

## 4. 実装仕様

### 4.1 構造体定義

```rust
// models/task.rs
use partially::Partial;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, Partial)]
#[partially(derive(Debug, Clone, Serialize, Deserialize, Default))]
pub struct Task {
    #[partially(omit)]  // IDは更新対象外
    pub id: TaskId,
    pub title: String,
    pub status: TaskStatus,
    pub description: String,
    pub priority: TaskPriority,
    pub assigned_user_id: Option<UserId>,
    pub due_date: Option<DateTime<Utc>>,
    pub tags: Vec<TagId>,
}

// 自動生成される TaskPartial
// pub struct TaskPartial {
//     pub title: Option<String>,
//     pub status: Option<TaskStatus>,
//     pub description: Option<String>,
//     pub priority: Option<TaskPriority>,
//     pub assigned_user_id: Option<Option<UserId>>,
//     pub due_date: Option<Option<DateTime<Utc>>>,
//     pub tags: Option<Vec<TagId>>,
// }
```

### 4.2 Command層実装

```rust
// commands/task_commands.rs

// 汎用パッチ更新コマンド
#[tauri::command]
pub async fn update_task_patch(
    id: String,
    patch: TaskPartial
) -> Result<bool, String> {
    let task_id = TaskId::try_from_str(&id)?;
    task_facades::update_task_patch(&task_id, &patch).await
}

// 便利な専用コマンド（内部でPatchを使用）
#[tauri::command]
pub async fn update_task_title(id: String, title: String) -> Result<bool, String> {
    let task_id = TaskId::try_from_str(&id)?;
    let patch = TaskPartial {
        title: Some(title),
        ..Default::default()
    };
    task_facades::update_task_patch(&task_id, &patch).await
}

#[tauri::command]
pub async fn update_task_status(id: String, status: TaskStatus) -> Result<bool, String> {
    let task_id = TaskId::try_from_str(&id)?;
    let patch = TaskPartial {
        status: Some(status),
        ..Default::default()
    };
    task_facades::update_task_patch(&task_id, &patch).await
}
```

### 4.3 Facade層実装

```rust
// facades/task_facades.rs

pub async fn update_task_patch(
    task_id: &TaskId,
    patch: &TaskPartial
) -> Result<bool, String> {
    match task_service::update_task_patch(task_id, patch).await {
        Ok(changed) => Ok(changed),
        Err(ServiceError::ValidationError(msg)) => Err(msg),
        Err(e) => Err(format!("Failed to update task: {:?}", e)),
    }
}
```

### 4.4 Service層実装

```rust
// services/task_service.rs

pub async fn update_task_patch(
    task_id: &TaskId,
    patch: &TaskPartial
) -> Result<bool, ServiceError> {
    let repository = Repositories::new().await?;

    if let Some(mut task) = repository.tasks.find_by_id(task_id).await? {
        let changed = task.apply_some(patch.clone());
        if changed {
            repository.tasks.save(&task).await?;
        }
        Ok(changed)
    } else {
        Err(ServiceError::NotFound("Task not found".to_string()))
    }
}
```

### 4.5 フロントエンド実装

```typescript
// lib/services/task-service.ts
import { invoke } from '@tauri-apps/api/tauri';

export interface TaskPatch {
  title?: string;
  status?: TaskStatus;
  description?: string;
  priority?: TaskPriority;
  assigned_user_id?: string | null;
  due_date?: string | null;
  tags?: string[];
}

// 汎用パッチ更新
export async function updateTaskPatch(id: string, patch: TaskPatch): Promise<boolean> {
  return await invoke<boolean>('update_task_patch', { id, patch });
}

// 便利な専用関数
export async function updateTaskTitle(id: string, title: string): Promise<boolean> {
  return await invoke<boolean>('update_task_title', { id, title });
}

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<boolean> {
  return await invoke<boolean>('update_task_status', { id, status });
}
```

```typescript
// lib/utils/task-patch.ts
// Svelte 5 runesベースの変更検知
export function createTaskPatch(original: Task, current: Task): TaskPatch {
  const patch: TaskPatch = {};

  if (original.title !== current.title) patch.title = current.title;
  if (original.status !== current.status) patch.status = current.status;
  if (original.description !== current.description) patch.description = current.description;
  if (original.priority !== current.priority) patch.priority = current.priority;
  if (original.assigned_user_id !== current.assigned_user_id) {
    patch.assigned_user_id = current.assigned_user_id;
  }
  if (original.due_date !== current.due_date) patch.due_date = current.due_date;
  if (JSON.stringify(original.tags) !== JSON.stringify(current.tags)) {
    patch.tags = current.tags;
  }

  return patch;
}
```

## 5. 実装課題と対策

### 5.1 バリデーション戦略

**課題**: 部分更新時の整合性チェック
**対策**:

- フィールドレベルバリデーション
- 既存データとの組み合わせバリデーション
- Service層でのビジネスルール適用

### 5.2 パフォーマンス最適化

**課題**: 頻繁な部分更新による性能影響
**対策**:

- フロントエンドでのデバウンス実装
- バッチ更新の検討
- Repository層でのSQL最適化

### 5.3 AutoMerge統合の考慮点

**課題**: AutoMergeとSQLiteの2層構造での整合性
**対策**:

- 部分更新はSQLite側で効率実行
- AutoMerge側は従来のsave()で全体保存
- 同期時の自動整合性確保

## 6. 段階的導入計画

### Phase 1: 基盤実装

- `partially`クレートの依存関係追加
- `Task`構造体への`Partial`derive追加
- 基本的なパッチ更新コマンドの実装

### Phase 2: 機能拡張

- よく使用されるフィールドの専用コマンド追加
- フロントエンド側での変更検知システム実装
- エラーハンドリングとバリデーション強化

### Phase 3: 最適化

- パフォーマンス測定と調整
- Repository層でのSQL最適化
- AutoMerge同期の効率化

### Phase 4: 他エンティティ展開

- Project、Subtask、Tag等への適用
- 統一的なパッチ更新パターンの確立

## 7. テスト戦略

### 7.1 単体テスト

- パッチ適用ロジックのテスト
- 変更検知機能のテスト
- バリデーションルールのテスト

### 7.2 結合テスト

- Command層からRepository層までの統合テスト
- AutoMergeとSQLiteの整合性テスト

### 7.3 E2Eテスト

- フロントエンドからバックエンドまでの完全なフロー
- リアルタイム更新の動作確認

## 8. パフォーマンス考慮事項

### 8.1 フロントエンド最適化

- **デバウンス実装**: 頻繁なフィールド変更のバッチ処理
- **変更検知最適化**: Svelte 5 runesでの効率的な差分検知
- **キャッシュ戦略**: パッチ適用前のローカル状態管理

### 8.2 バックエンド最適化

- **SQL最適化**: 部分更新用の効率的なUPDATE文
- **メモリ管理**: 部分更新時の一時オブジェクト最小化
- **同期処理**: AutoMergeとSQLiteの効率的な整合性管理

## 9. 実装チェックリスト

### Phase 1 実装チェックポイント

- [ ] `partially`クレートのCargo.toml追加
- [ ] Task構造体への`#[derive(Partial)]`追加
- [ ] `update_task_patch`コマンド実装
- [ ] Facade層のパッチ処理ロジック
- [ ] Service層の`apply_some()`統合
- [ ] フロントエンドTaskPatch型定義

### Phase 2 機能拡張チェックポイント

- [ ] 頑繁フィールドの専用コマンド追加
- [ ] フロントエンド変更検知ユーティリティ
- [ ] バリデーションルール強化
- [ ] エラーハンドリング改善

## 10. まとめ

本実装詳細設計書により以下を実現します：

1. **効率的なデータ更新**: 変更フィールドのみの転送でネットワーク負荷減
2. **型安全性**: `partially`クレートとRust型システムによる安全な部分更新
3. **保守性**: マクロ自動生成によるコード重複減とメンテナンス性向上
4. **実装の具体性**: そのまま使用可能なコード例と段階的導入計画

この設計に基づいて実装を進めることで、効率的で保守しやすいフィールド単位部分更新システムを構築できます。
