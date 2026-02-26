# CLAUDE.md

This file provides guidance for Claude Code (claude.ai/code) when working with the code in this repository.

## Response Guidelines

- Always respond **in Japanese**.
- After loading this file, first say "✅️ CLAUDE.md loaded" and then follow the instructions.

## Application Overview

A **Tauri-based desktop task management application** that supports project management and task collaboration.

**Tech Stack**:

- Frontend: SvelteKit 2 (SSG) + Svelte 5 (runes) + Tailwind CSS 4 + bits-ui + Inlang Paraglide
- Backend: Tauri 2 (Rust) + Sea-ORM + SQLite + Automerge (CRDT)
- Package Manager: **Bun** (do not use npm / yarn / pnpm)
- Type Safety: Specta (Rust -> TypeScript automatic type generation)
- Architecture: Clean Architecture (crate separation)

## Frontend Architecture

### Directory Structure (`src/lib/`)

```
components/              # UI presentation layer (.svelte)
services/
  domain/                # Single-entity operations + Tauri invoke calls
  composite/             # Cross-entity operations
  ui/                    # UI state orchestration only (no invoke)
stores/                  # Svelte $state management (.svelte.ts files)
infrastructure/
  backends/
    tauri/               # Tauri IPC implementation (must not be imported directly by components)
    web/                 # Web API implementation (fallback)
types/                   # Type definitions only (no logic)
utils/                   # Utilities
```

### Layer Rules (Important)

- **Components** -> depend on `services/` only (no direct dependency on `infrastructure/`)
- **services/domain/** -> call backends via `infrastructure/backends/` (invoke lives here)
- **stores/** -> state management only (no invoke, no services imports)
- **Optimistic update pattern**: update stores first -> call backend -> rollback on error

### Svelte 5 Runes (Always use the new syntax)

```svelte
<!-- ✅ OK: Svelte 5 -->
<script lang="ts">
  let { title, onSave } = $props<{ title: string; onSave: () => void }>();
  let count = $state(0);
  let doubled = $derived(count * 2);
  $effect(() => { console.log(count); });
</script>
<button onclick={() => count++}>Click</button>

<!-- ❌ NG: Svelte 4 syntax (do not use) -->
<script>
  export let title;
  let count = 0;
  $: doubled = count * 2;
</script>
<button on:click={() => count++}>Click</button>
```

## Backend Architecture

### Crate Dependencies (dependency order)

```
flequit-types                        # Shared types (ProjectId, TaskId, etc.)
  ↓ flequit-model                    # Domain models
  ↓ flequit-repository               # Repository trait definitions only
  ↓ flequit-core                     # Services + facades (business logic)
  ↓ flequit-infrastructure-sqlite    # SQLite implementation
  ↓ src-tauri/src/commands/          # Tauri IPC commands
```

### Tauri Command Pattern (Required)

```rust
use tracing::instrument;

// ✅ Always follow this pattern
#[instrument(level = "info", skip(state, task), fields(project_id = %task.project_id))]
#[tauri::command]
pub async fn create_task(
    state: State<'_, AppState>,
    task: TaskCommandModel,           // IPC DTO (CommandModel format)
    user_id: String,
) -> Result<bool, String> {
    let user_id_typed = UserId::from(user_id);
    let project_id = match ProjectId::try_from_str(&task.project_id) {
        Ok(id) => id,
        Err(err) => return Err(err.to_string()),
    };
    let internal_task = task.to_model().await?;       // CommandModel -> domain model
    let repositories = state.repositories.read().await;  // Acquire lock (required)
    task_facades::create_task(&*repositories, &project_id, &internal_task, &user_id_typed)
        .await
        .map_err(|e| {
            tracing::error!(target: "commands::task", command = "create_task", error = %e);
            e
        })
}
```

**Rules**:

- `#[instrument]` is required on all commands
- Use `tracing::error!/warn!/info!` for logging (do not use `log::`)
- State access: `state.repositories.read().await` (do not use `&state.repositories` directly)
- CommandModel -> domain conversion: `task.to_model().await?`

## Critical Commands

| Purpose             | Command                     | Notes                                 |
| ------------------- | --------------------------- | ------------------------------------- |
| Type check (TS)     | `bun check`                 | Do not use `bun run check`            |
| Frontend tests      | `bun run test [file]`       | Start with single-file scope          |
| Backend tests       | `cargo test -j 4`           | Always include `-j 4`                 |
| Build               | `bun run build`             | i18n types are also regenerated       |
| Machine translation | `bun run machine-translate` | Run `bun run build` after translation |
| Rust check          | `cargo check --quiet`       | Focus on errors only                  |
| Tauri dev mode      | `bun run tauri dev`         | -                                     |

## Common Mistakes (Code Generation)

### Tauri invoke

```typescript
// ❌ NG: old package path
import { invoke } from '@tauri-apps/api/tauri';

// ✅ OK: correct package path
import { invoke } from '@tauri-apps/api/core';
```

### Architecture violations

```typescript
// ❌ NG: direct invoke in component
// src/lib/components/TaskItem.svelte
import { invoke } from '@tauri-apps/api/core';
const tasks = await invoke('get_tasks', ...);

// ✅ OK: go through services/domain/
import { getTasksService } from '$lib/services/domain/task/task-read-service';
const tasks = await getTasksService(projectId);
```

```typescript
// ❌ NG: importing services in a store
// src/lib/stores/task-store.svelte.ts
import { createTask } from '$lib/services/domain/task/task-write-service';

// ✅ OK: store handles state only
let tasks = $state<Task[]>([]);
```

## Important Development Rules

- When instructed to make changes, do **not** modify unrelated parts of the source code without first asking for permission from the user.
- When performing replacements using regular expressions or similar methods, always verify beforehand to ensure no unintended effects occur before proceeding with the replacement.
- If you get an error saying a file or directory does not exist when executing a command, verify your current working directory with `pwd`.

## Documentation & Skills

Claude Code has specialized **skills** for common tasks. These skills provide detailed guidance:

- **`.claude/skills/frontend-testing/`** - Frontend testing (Vitest / Svelte 5)
- **`.claude/skills/backend-testing/`** - Backend testing (Rust / cargo)
- **`.claude/skills/tauri-command/`** - Tauri command implementation (frontend <-> backend IPC)
- **`.claude/skills/architecture-review/`** - Architecture compliance checks
- **`.claude/skills/debugging/`** - Debugging support
- **`.claude/skills/i18n/`** - Internationalization (Inlang Paraglide)
- **`.claude/skills/documentation/`** - Documentation editing (keep Japanese and English synced)
- **`.claude/skills/coding-standards/`** - Coding standards checks

For detailed design and specifications, refer to the documents in the `docs` directory:

- **Architecture & Design**: `docs/en/develop/design/`
  - `architecture.md` - Overall architecture
  - `tech-stack.md` - Tech stack and project structure
  - `frontend/` - Frontend design (Svelte 5, i18n, layers, etc.)
  - `backend-tauri/` - Backend design (Rust guidelines, transactions, etc.)
  - `data/` - Data design (models, security, Automerge, etc.)

- **Development Rules**: `docs/en/develop/rules/`
  - `coding-standards.md` - Coding standards
  - `frontend.md` - Frontend rules
  - `backend.md` - Backend rules
  - `testing.md` - Testing rules
  - `documentation.md` - Documentation editing rules (must update both ja/en)

- **Requirements**: `docs/en/develop/requirements/`
  - `performance.md`, `security.md`, `testing.md`, etc.

Refer to these documents and skills as needed. Skills will be automatically invoked based on your tasks.
