# Coding Standards (Cross-Language)

Standards for maintaining consistent code style and quality in the Flequit project. This document focuses on rules common to frontend (TypeScript/Svelte) and backend (Rust). See separate documents for language-specific details.

| Area | Detail document |
| --- | --- |
| Svelte 5 / component design | `docs/en/develop/design/frontend/svelte5-patterns.md`, `docs/en/develop/rules/frontend.md` |
| Layers / stores and services | `docs/en/develop/design/frontend/layers.md`, `store-and-service-architecture.md` |
| Rust design / crate structure | `docs/en/develop/design/backend-tauri/rust-guidelines.md`, `docs/en/develop/rules/backend.md` |
| Tauri <-> frontend IPC | `.claude/skills/tauri-command/SKILL.md` |
| Testing | `docs/en/develop/rules/testing.md` |
| i18n | `docs/en/develop/design/frontend/i18n-system.md` |
| Documentation | `docs/en/develop/rules/documentation.md` |

---

## File Structure

### Single Responsibility Principle

- One file, one feature
- File names should make the feature inferable
- **Store and UI service separation**: stores (`src/lib/stores/...`) only manage state caches and synchronization. Side effects, infrastructure calls, and orchestration across multiple stores belong in UI services (`src/lib/services/ui/...`)

### File Size

- **Over 200 lines**: must be split (excluding tests)
- **Over 100 lines**: consider splitting
- **Exceptions**: configuration files and data definitions
- See "Component Splitting Guidelines" in `docs/en/develop/design/frontend/svelte5-patterns.md`

---

## Naming Rules

### Files and Directories

- Use kebab-case by default: `task-item.svelte`, `user-service.ts`, `task-management/`
- Exception: follow table names or framework conventions when applicable
- Keep original shadcn-svelte names under `src/lib/components/ui/`

### Variables, Functions, and Types

| Language | Variables / functions | Types / classes / enums | Constants |
| --- | --- | --- | --- |
| TypeScript / JavaScript | `camelCase` | `PascalCase` | `SCREAMING_SNAKE_CASE` |
| Rust | `snake_case` | `PascalCase` | `SCREAMING_SNAKE_CASE` |

```typescript
const userName = 'john';
const USER_ROLE_ADMIN = 'admin';
function getUserById(id: string) {}
class TaskManager {}
```

```rust
let user_name = "john";
const USER_ROLE_ADMIN: &str = "admin";
fn get_user_by_id(id: &str) {}
struct TaskManager {}
```

---

## Type Definitions (TypeScript)

### Strict Typing

- `any` is prohibited (exception: a clear reason is documented in a comment)
- Restrict domain values with union types: `'todo' | 'in_progress' | 'completed'`
- Explicitly distinguish optional and required values

```typescript
interface Task {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'completed';
  assignee?: User;
}
```

### Interpretation of `Optional`

- `?` (optional): the value may not exist
- `| null` / `| undefined`: the value exists but is empty

---

## Error Handling

### TypeScript: Explicit Branching

```typescript
async function fetchTasks(): Promise<Task[] | null> {
  try {
    const response = await api.getTasks();
    return response.data;
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    return null;
  }
}
```

### Rust: `Result<T, E>` + `thiserror`

Use layered error types. See "Error Handling" in `docs/en/develop/design/backend-tauri/rust-guidelines.md`.

```rust
pub async fn update_task_status(id: &TaskId, new_status: TaskStatus) -> TaskResult<Task> {
    let mut task = repository.find_by_id(id).await?
        .ok_or_else(|| TaskError::NotFound { id: *id })?;
    if !task.status.can_transition_to(new_status) {
        return Err(TaskError::InvalidStatusTransition { from: task.status, to: new_status });
    }
    task.status = new_status;
    repository.save(&task).await?;
    Ok(task)
}
```

---

## Tauri <-> Frontend Communication (Summary)

See `.claude/skills/tauri-command/SKILL.md` for details.

- **JS side**: `camelCase` (Tauri automatically maps to Rust `snake_case`)
- **Rust side**: `snake_case` parameters
- **Return values**: success/failure only -> `Result<bool, String>` (Rust) / `Promise<boolean>` (TS). Data retrieval uses `Result<Option<T>, String>` / `Result<Vec<T>, String>`
- **invoke import**: `@tauri-apps/api/core` (do not use old `@tauri-apps/api/tauri`)
- **Common error wrapper**: define the `tauriServiceMethod<T>` helper in one place on the TS side; log with `console.error` and return `null` / `false`

Implementation references:

- TS helper: `src/lib/services/domain/...-backend.ts`
- Rust handler: `src-tauri/src/commands/...`

---

## Import Order (TypeScript)

1. Node modules (`@tauri-apps/...`, `svelte/...`)
2. Internal libraries (`$lib/types`, `$lib/services/...`, `$lib/components/...`)
3. Relative paths (only when aliases cannot be used)

### Svelte Component Imports

- Always use aliases under `src/lib/components` (`$lib/components/...`)
- Relative paths are allowed only for folders without aliases (such as local helpers under `src/routes/...`)
- If ESLint rule disabling is necessary, document the reason in a comment

### Export Rules

- Prefer **named exports** (`export { TaskManager }`, `export type { Task, TaskStatus }`)
- Use `default export` only for a single primary export

---

## Function and Method Design

### Prefer Pure Functions

- Separate calculations from side effects
- Refactor when a function name does not make its side effects inferable

```typescript
function calculateProgress(completed: number, total: number): number {
  return total === 0 ? 0 : Math.round((completed / total) * 100);
}
```

### Svelte 5 State Management

- Always use `$derived` for derived state (manual synchronization with `$effect` is prohibited)

```typescript
const isFormValid = $derived(formData.title.trim().length > 0);
```

See `docs/en/develop/design/frontend/svelte5-patterns.md` for details.

---

## Documentation Comments

- Add JSDoc / rustdoc to public APIs
- Including `# Examples` / `@example` improves review efficiency
- Describe "usage" and "contract", not implementation intent

---

## Performance Basics

### Frontend

- Use derived state (`$derived`) and avoid manual synchronization
- Use keys for list rendering

### Backend

- Avoid N+1: batch fetching / single query with `JOIN`
- Use `tokio::join!` for parallel I/O
- See "Performance Optimization" in `rust-guidelines.md` for details
