# CLAUDE.md

This file provides guidance for Claude Code (claude.ai/code) when working with the code in this repository.

## Response Guidelines

* Always respond **in Japanese**.
* After loading this file, first say "✅️ CLAUDE.md loaded" and then follow the instructions.

## Application Overview

A **Tauri-based desktop task management application** that supports project management and task collaboration.

**Tech Stack**:
- Frontend: SvelteKit 2 (SSG) + Svelte 5 (runes) + Tailwind CSS 4 + bits-ui + Inlang Paraglide
- Backend: Tauri 2 (Rust) + Sea-ORM + SQLite + Automerge (CRDT)
- Package Manager: **Bun**（npm / yarn / pnpm 使用禁止）
- Type Safety: Specta（Rust → TypeScript 型自動生成）
- Architecture: Clean Architecture (Crate separation)

## Frontend Architecture

### Directory Structure (`src/lib/`)

```
components/              # UI 表示層 (.svelte)
services/
  domain/                # 単一エンティティ操作 + Tauri invoke 呼び出し
  composite/             # 複数エンティティをまたぐ操作
  ui/                    # UI 状態管理のみ（invoke 禁止）
stores/                  # Svelte $state 管理（.svelte.ts ファイル）
infrastructure/
  backends/
    tauri/               # Tauri IPC 実装（Components から直接参照禁止）
    web/                 # Web API 実装（フォールバック）
types/                   # 型定義のみ（ロジック禁止）
utils/                   # ユーティリティ
```

### Layer Rules（重要）

- **Components** → `services/` のみ参照（`infrastructure/` への直接参照禁止）
- **services/domain/** → `infrastructure/backends/` で backend 呼び出し（invoke はここ）
- **stores/** → 状態管理のみ（invoke も services の import も禁止）
- **Optimistic Update パターン**: stores を先に更新 → backend 呼び出し → エラー時ロールバック

### Svelte 5 Runes（必ず新記法を使用）

```svelte
<!-- ✅ OK: Svelte 5 -->
<script lang="ts">
  let { title, onSave } = $props<{ title: string; onSave: () => void }>();
  let count = $state(0);
  let doubled = $derived(count * 2);
  $effect(() => { console.log(count); });
</script>
<button onclick={() => count++}>Click</button>

<!-- ❌ NG: Svelte 4 記法（使用禁止） -->
<script>
  export let title;
  let count = 0;
  $: doubled = count * 2;
</script>
<button on:click={() => count++}>Click</button>
```

## Backend Architecture

### Crate Dependencies（依存関係順）

```
flequit-types                        # 共通型 (ProjectId, TaskId 等)
  ↓ flequit-model                    # ドメインモデル
  ↓ flequit-repository               # Repository トレイト定義のみ
  ↓ flequit-core                     # Service + Facade（ビジネスロジック）
  ↓ flequit-infrastructure-sqlite    # SQLite 実装
  ↓ src-tauri/src/commands/          # Tauri IPC コマンド
```

### Tauri Command パターン（必須）

```rust
use tracing::instrument;

// ✅ 必ずこのパターンで実装
#[instrument(level = "info", skip(state, task), fields(project_id = %task.project_id))]
#[tauri::command]
pub async fn create_task(
    state: State<'_, AppState>,
    task: TaskCommandModel,           // IPC DTO（CommandModel 形式）
    user_id: String,
) -> Result<bool, String> {
    let user_id_typed = UserId::from(user_id);
    let project_id = match ProjectId::try_from_str(&task.project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let internal_task = task.to_model().await?;       // CommandModel → ドメインモデル
    let repositories = state.repositories.read().await;  // ロック取得（必須）
    task_facades::create_task(&*repositories, &project_id, &internal_task, &user_id_typed)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::task", command = "create_task", error = %e);
            e
        })
}
```

**ルール**:
- 全コマンドに `#[instrument]` 必須
- ログは `tracing::error!/warn!/info!`（`log::` 使用禁止）
- State アクセス: `state.repositories.read().await`（直接 `&state.repositories` 不可）
- CommandModel → ドメインモデル変換: `task.to_model().await?`

## Critical Commands

| 用途 | コマンド | 備考 |
|------|---------|------|
| 型チェック（TS） | `bun check` | `bun run check` は使用禁止 |
| フロントエンドテスト | `bun run test [file]` | 単一ファイルから実施 |
| バックエンドテスト | `cargo test -j 4` | 必ず `-j 4` を付ける |
| ビルド | `bun run build` | i18n 型も自動生成 |
| 機械翻訳 | `bun run machine-translate` | 翻訳後 `bun run build` で型生成 |
| Rust チェック | `cargo check --quiet` | エラーのみ確認 |
| Tauri 開発モード | `bun run tauri dev` | - |

## Common Mistakes（コード生成時の注意）

### Tauri invoke

```typescript
// ❌ NG: 古いパッケージパス
import { invoke } from '@tauri-apps/api/tauri';

// ✅ OK: 正しいパッケージパス
import { invoke } from '@tauri-apps/api/core';
```

### Architecture 違反

```typescript
// ❌ NG: Component から直接 invoke
// src/lib/components/TaskItem.svelte
import { invoke } from '@tauri-apps/api/core';
const tasks = await invoke('get_tasks', ...);

// ✅ OK: services/domain/ 経由
import { getTasksService } from '$lib/services/domain/task/task-read-service';
const tasks = await getTasksService(projectId);
```

```typescript
// ❌ NG: store から services を import
// src/lib/stores/task-store.svelte.ts
import { createTask } from '$lib/services/domain/task/task-write-service';

// ✅ OK: store は状態管理のみ
let tasks = $state<Task[]>([]);
```

## Important Development Rules

* When instructed to make changes, do **not** modify unrelated parts of the source code without first asking for permission from the user.
* When performing replacements using regular expressions or similar methods, always verify beforehand to ensure no unintended effects occur before proceeding with the replacement.
* If you get an error saying a file or directory does not exist when executing a command, verify your current working directory with `pwd`.

## Documentation & Skills

Claude Code has specialized **skills** for common tasks. These skills provide detailed guidance:

* **`.claude/skills/frontend-testing/`** - フロントエンドテスト（Vitest / Svelte 5）
* **`.claude/skills/backend-testing/`** - バックエンドテスト（Rust / cargo）
* **`.claude/skills/tauri-command/`** - Tauri コマンド実装（フロント ↔ バック通信）
* **`.claude/skills/architecture-review/`** - アーキテクチャ準拠チェック
* **`.claude/skills/debugging/`** - デバッグ支援
* **`.claude/skills/i18n/`** - 国際化対応（Inlang Paraglide）
* **`.claude/skills/documentation/`** - ドキュメント編集（日本語・英語同時）
* **`.claude/skills/coding-standards/`** - コーディング標準チェック

For detailed design and specifications, refer to the documents in the `docs` directory:

* **Architecture & Design**: `docs/en/develop/design/`
  * `architecture.md` - Overall architecture
  * `tech-stack.md` - Tech stack and project structure
  * `frontend/` - Frontend design (Svelte 5, i18n, layers, etc.)
  * `backend-tauri/` - Backend design (Rust guidelines, transactions, etc.)
  * `data/` - Data design (models, security, Automerge, etc.)

* **Development Rules**: `docs/en/develop/rules/`
  * `coding-standards.md` - Coding standards
  * `frontend.md` - Frontend rules
  * `backend.md` - Backend rules
  * `testing.md` - Testing rules
  * `documentation.md` - Documentation editing rules (MUST update both ja/en)

* **Requirements**: `docs/en/develop/requirements/`
  * `performance.md`, `security.md`, `testing.md`, etc.

Refer to these documents and skills as needed. Skills will be automatically invoked based on your tasks.
