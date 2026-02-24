---
name: tauri-command
description: Tauri コマンドの実装を支援します。フロントエンドとバックエンド間の通信、invoke 関数の実装、camelCase から snake_case への自動変換、戻り値の統一パターンなど、Tauri 固有の実装パターンに使用します。
---

# Tauri Command Implementation Skill

Flequit プロジェクトの Tauri コマンド実装を支援するスキルです。

## 重要: 命名規則の自動変換

Tauri は JavaScript の `camelCase` を自動的に Rust の `snake_case` に変換します。

```typescript
// ✅ JavaScript/TypeScript - camelCase を使用
await invoke('create_task', {
  task: taskData,         // Rust 側: task
  userId: 'user-123',    // Rust 側: user_id
  projectId: 'proj-456'  // Rust 側: project_id
});
```

```rust
// ✅ Rust 側 - snake_case を使用
#[tauri::command]
pub async fn create_task(
    state: State<'_, AppState>,
    task: TaskCommandModel,   // JavaScript 側: task
    user_id: String,          // JavaScript 側: userId
) -> Result<bool, String> { ... }
```

## Tauri invoke の正しい import

```typescript
// ✅ OK: 正しい import パス
import { invoke } from '@tauri-apps/api/core';

// ❌ NG: 古い import パス（使用禁止）
import { invoke } from '@tauri-apps/api/tauri';
```

## Rust コマンドの実装パターン

### 完全な実装例（task_commands.rs の実際のコード）

```rust
use crate::models::{task::TaskCommandModel, CommandModelConverter};
use crate::state::AppState;
use flequit_core::facades::task_facades;
use flequit_model::types::id_types::{ProjectId, TaskId, UserId};
use tauri::State;
use tracing::instrument;

// ✅ 必ずこのパターンで実装
#[instrument(level = "info", skip(state, task), fields(project_id = %task.project_id, task_id = %task.id))]
#[tauri::command]
pub async fn create_task(
    state: State<'_, AppState>,
    task: TaskCommandModel,           // IPC DTO
    user_id: String,
) -> Result<bool, String> {
    // ID 型変換（try_from_str でバリデーション）
    let user_id_typed = UserId::from(user_id);
    let project_id = match ProjectId::try_from_str(&task.project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    // CommandModel → ドメインモデル変換
    let internal_task = task.to_model().await?;
    // State から repositories を取得（必ずロックを取得）
    let repositories = state.repositories.read().await;
    task_facades::create_task(&*repositories, &project_id, &internal_task, &user_id_typed)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::task", command = "create_task", project_id = %project_id, error = %e);
            e
        })
}

// Option を返すパターン
#[instrument(level = "info", skip(state), fields(project_id = %project_id, task_id = %id))]
#[tauri::command]
pub async fn get_task(
    state: State<'_, AppState>,
    project_id: String,
    id: String,
) -> Result<Option<TaskCommandModel>, String> {
    let project_id = match ProjectId::try_from_str(&project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let task_id = match TaskId::try_from_str(&id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let repositories = state.repositories.read().await;
    let result = task_facades::get_task(&*repositories, &project_id, &task_id)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::task", command = "get_task", error = %e);
            e
        })?;
    // ドメインモデル → CommandModel 変換
    match result {
        Some(task) => Ok(Some(task.to_command_model().await?)),
        None => Ok(None),
    }
}
```

### 必須ルール

- **`#[instrument]`**: 全コマンドに必須（`skip(state, ...)` で重い引数を除外）
- **ログ**: `tracing::error!` を使用（`log::error!` / `format!()` のみは禁止）
- **State アクセス**: `state.repositories.read().await`（直接 `&state.repositories` は不可）
- **CommandModel 変換**: `task.to_model().await?` / `result.to_command_model().await?`
- **ID 型変換**: `ProjectId::try_from_str(&id)` でバリデーション

## CommandModel パターン

IPC では `CommandModel` 型（DTO）を使用し、内部処理前にドメインモデルに変換します。

```rust
// src-tauri/src/models/task.rs
pub struct TaskCommandModel {
    pub id: String,
    pub project_id: String,
    pub title: String,
    // ...
}

// CommandModelConverter を impl して変換メソッドを提供
impl CommandModelConverter<Task> for TaskCommandModel {
    async fn to_model(&self) -> Result<Task, String> { ... }
}
```

## TypeScript 側の実装パターン

### infrastructure/backends/tauri/ での実装

```typescript
// src/lib/infrastructure/backends/tauri/task-backend.ts
import { invoke } from '@tauri-apps/api/core';
import type { Task } from '$lib/types/task';

export async function createTaskBackend(
  projectId: string,
  task: Task,
  userId: string
): Promise<boolean> {
  try {
    return await invoke<boolean>('create_task', {
      task,           // camelCase
      userId,         // Rust: user_id
      projectId       // Rust: project_id（CommandModel 内のフィールドが参照）
    });
  } catch (error) {
    console.error('create_task failed:', error);
    return false;
  }
}

export async function getTaskBackend(
  projectId: string,
  id: string
): Promise<Task | null> {
  try {
    return await invoke<Task | null>('get_task', { projectId, id });
  } catch (error) {
    console.error('get_task failed:', error);
    return null;
  }
}
```

### services/domain/ での呼び出し

```typescript
// src/lib/services/domain/task/task-read-service.ts
import { getTaskBackend } from '$lib/infrastructure/backends/tauri/task-backend';
import { taskStore } from '$lib/stores/tasks.svelte';

export async function loadTask(projectId: string, taskId: string): Promise<void> {
  const task = await getTaskBackend(projectId, taskId);
  if (task) {
    taskStore.setTask(task);
  }
}
```

## コマンド登録

```rust
// src-tauri/src/lib.rs
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            task_commands::create_task,
            task_commands::get_task,
            // ...
        ])
        // ...
}
```

## 戻り値の型

| ユースケース | Rust 戻り値 | TypeScript 戻り値 |
|-------------|------------|-----------------|
| 作成・更新・削除（成功/失敗） | `Result<bool, String>` | `boolean` |
| 単一エンティティ取得 | `Result<Option<T>, String>` | `T \| null` |
| リスト取得 | `Result<Vec<T>, String>` | `T[]` |

## 注意事項

### 自動変換の対象範囲

Tauri の自動変換は**コマンドパラメータ名のみ**に適用されます。

```rust
#[tauri::command]
pub async fn update_task(
    partial_task: PartialTaskCommandModel,  // JS: partialTask ✅
    // ...
) { ... }

#[derive(Deserialize)]
pub struct PartialTaskCommandModel {
    pub task_id: String,  // ← struct フィールドは自動変換されない
    // JS側でも snake_case で送る必要がある
}
```

## 実装チェックリスト

### Rust 実装
- [ ] `#[instrument]` アトリビュートを追加
- [ ] `#[tauri::command]` アトリビュートを追加
- [ ] パラメータを `snake_case` で記述
- [ ] `state.repositories.read().await` でロック取得
- [ ] `task.to_model().await?` で CommandModel 変換
- [ ] `tracing::error!` でエラーログ出力
- [ ] `Result<T, String>` でエラーを処理

### TypeScript 実装
- [ ] `import { invoke } from '@tauri-apps/api/core'` を使用
- [ ] パラメータ名を `camelCase` で記述
- [ ] `infrastructure/backends/tauri/` に実装
- [ ] `services/domain/` から呼び出す

## 関連ドキュメント

- `docs/en/develop/rules/coding-standards.md` - コーディング標準
- `docs/en/develop/design/backend-tauri/rust-guidelines.md` - Rust 設計ガイドライン
- `docs/en/develop/rules/backend.md` - バックエンドルール
