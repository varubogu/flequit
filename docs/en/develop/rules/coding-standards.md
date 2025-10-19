# Coding Standards

## Overview

This document establishes coding standards to maintain unified code style and quality in the Flequit project. It includes common standards for frontend (TypeScript/Svelte) and backend (Rust), as well as technology-specific standards.

## Common Standards

### File Structure

#### Single Responsibility Principle
- **One file, one function**: Each file has a single responsibility
- **Appropriate separation**: Split appropriately when functionality becomes complex
- **Clear naming**: Functionality should be inferable from file names
- **Store vs UI Service**: Reactive stores (`src/lib/stores/…`) must keep pure state; side effects and orchestration belong in UI services (`src/lib/services/ui/…`). Store files should not import infrastructure/services directly.

#### File Size Standards
- **Over 200 lines**: Mandatory split target (excluding test code)
- **Over 100 lines**: Consider splitting
- **Exceptions**: Configuration files and data definitions are excluded
- Cross-reference: Follow component-patterns.md / anti-patterns.md to determine split strategy

### Naming Conventions

#### Directory & File Names
```
components/
├── ui/                    # shadcn-svelte basic components
├── shared/                # Common components
├── task-management/       # Feature-specific directories (kebab-case)
└── project-settings/

task-item.svelte          # Svelte components (kebab-case)
user-service.ts           # Service classes (kebab-case)
types.ts                  # Type definition files
```

#### Variable & Function Names
```typescript
// TypeScript/JavaScript
const userName = 'john';              // camelCase
const USER_ROLE_ADMIN = 'admin';      // Constants are SCREAM_SNAKE_CASE
function getUserById(id: string) {}   // camelCase
class TaskManager {}                  // PascalCase

// Rust
let user_name = "john";              // snake_case
const USER_ROLE_ADMIN: &str = "admin"; // Constants are SCREAM_SNAKE_CASE
fn get_user_by_id(id: &str) {}       // snake_case
struct TaskManager {}                // PascalCase
```

### Tauri⇔Frontend Communication Standards

#### Overview

Tauri automatically converts JavaScript `camelCase` parameters to Rust `snake_case`. Understanding and properly utilizing this mechanism allows writing code following each language's conventions while achieving correct communication.

#### Parameter Naming Rules

**JavaScript side (camelCase)** ⇔ **Rust side (snake_case)** correspondence:

```typescript
// JavaScript/TypeScript side - use camelCase
await invoke('update_task', {
  projectId: 'project-123',        // Rust side: project_id
  taskId: 'task-456',             // Rust side: task_id
  partialSettings: {...}          // Rust side: partial_settings
});

await invoke('create_task_assignment', {
  taskAssignment: {               // Rust side: task_assignment
    task_id: 'task-123',
    user_id: 'user-456'
  }
});
```

```rust
// Rust side - use snake_case
#[tauri::command]
pub async fn update_task(
    project_id: String,           // JavaScript side: projectId
    task_id: String,              // JavaScript side: taskId
    partial_settings: PartialSettings // JavaScript side: partialSettings
) -> Result<bool, String> {
    // Implementation
}

#[tauri::command]
pub async fn create_task_assignment(
    task_assignment: TaskAssignment  // JavaScript side: taskAssignment
) -> Result<bool, String> {
    // Implementation
}
```

#### Return Value Unification

**Unified return values for void commands**:

```rust
// Rust side - return () (Unit type) on success
#[tauri::command]
pub async fn save_settings(settings: Settings) -> Result<(), String> {
    // Save processing
    Ok(()) // Return Unit type
}
```

```typescript
// JavaScript side - treat success as true
async saveSettings(settings: Settings): Promise<boolean> {
  try {
    await invoke('save_settings', { settings });
    return true; // void success = true
  } catch (error) {
    console.error('Failed to save settings:', error);
    return false; // Error = false
  }
}
```

#### Unified Error Handling

```typescript
// Unified error handling pattern
async function tauriServiceMethod<T>(
  command: string,
  params?: object
): Promise<T | null> {
  try {
    const result = await invoke(command, params) as T;
    return result;
  } catch (error) {
    console.error(`Failed to execute ${command}:`, error);
    return null;
  }
}

// For boolean returns
async function tauriBooleanMethod(
  command: string,
  params?: object
): Promise<boolean> {
  try {
    await invoke(command, params);
    return true;
  } catch (error) {
    console.error(`Failed to execute ${command}:`, error);
    return false;
  }
}
```

#### Implementation Checklist

**JavaScript/TypeScript Implementation**:
- [ ] Write parameter names in `camelCase`
- [ ] Correspond to Rust side `snake_case` function parameters
- [ ] Return `true` on success, `false` on failure for void return commands
- [ ] Implement appropriate error handling
- [ ] Output error content in console logs

**Rust Implementation**:
- [ ] Write function parameters in `snake_case`
- [ ] Correspond to JavaScript side `camelCase` parameters
- [ ] Handle errors with `Result<T, String>`
- [ ] Provide appropriate error messages

#### Notes

1. **Automatic conversion scope**: Tauri's automatic conversion only applies to parameter names. Struct field names and Enum variants are not included
2. **Consistency maintenance**: Use the same pattern throughout the project
3. **Type safety**: Match TypeScript type definitions with Rust struct definitions
4. **Testing**: Recommend testing communication parts in actual Tauri environment

## TypeScript/Svelte Standards

### Type Definitions

#### Strict Type Specification
```typescript
// Good example
interface Task {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'completed';
  assignee?: User;
}

// Bad example
interface Task {
  id: any;
  title: string;
  status: string;
  assignee: any;
}
```

#### Optional vs Required
```typescript
// Clear distinction
interface CreateTaskRequest {
  title: string;           // Required
  description?: string;    // Optional
  dueDate?: Date;         // Optional
}

interface Task {
  id: string;             // Required after creation
  title: string;          // Required
  description: string;    // Required after creation (even if empty string)
  dueDate?: Date;        // Always optional
}
```

### Functions & Methods

#### Pure Function Recommendation
```typescript
// Good example - pure function
function calculateProgress(completedTasks: number, totalTasks: number): number {
  if (totalTasks === 0) return 0;
  return Math.round((completedTasks / totalTasks) * 100);
}

// Good example - clear separation when side effects are needed
function updateTaskInStore(task: Task): void {
  taskStore.updateTask(task);
}

// Bad example - function with side effects
function calculateProgressAndUpdate(completedTasks: number, totalTasks: number): number {
  const progress = Math.round((completedTasks / totalTasks) * 100);
  // Side effect - not inferable from function name
  updateProgressUI(progress);
  return progress;
}
```

#### Error Handling
```typescript
// Good example - explicit error handling
async function fetchTasks(): Promise<Task[] | null> {
  try {
    const response = await api.getTasks();
    return response.data;
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    return null;
  }
}

// Error handling using Result type
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

async function fetchTasksWithResult(): Promise<Result<Task[]>> {
  try {
    const response = await api.getTasks();
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}
```

### Svelte Components

#### Props Definition
```typescript
// Good example - clear Props interface
<script lang="ts">
  interface Props {
    task: Task;
    readonly?: boolean;
    onUpdate?: (task: Task) => void;
    onDelete?: (taskId: string) => void;
  }

  let {
    task,
    readonly = false,
    onUpdate = () => {},
    onDelete = () => {}
  }: Props = $props();
</script>
```

#### State Management
```typescript
// Good example - appropriate $state usage
let isEditing = $state<boolean>(false);
let formData = $state<CreateTaskRequest>({
  title: '',
  description: ''
});

// Good example - use $derived for derived state
const isFormValid = $derived(
  formData.title.trim().length > 0
);

// Bad example - manual state synchronization
let isFormValid = $state<boolean>(false);
$effect(() => {
  isFormValid = formData.title.trim().length > 0; // Should use $derived
});
```

### Import/Export

#### Import Order
```typescript
// 1. Node modules
import { invoke } from '@tauri-apps/api/tauri';
import { writable } from 'svelte/store';

// 2. Internal libraries (starting with $lib)
import type { Task } from '$lib/types';
import { taskService } from '$lib/services/task-service';
import TaskItem from '$lib/components/task-item.svelte';

// 3. Relative paths
import './component.css';
```

#### Export Standards
```typescript
// Prefer named exports
export { TaskManager } from './task-manager';
export type { Task, TaskStatus } from './types';

// Default export only for single main export
export default class TaskService {
  // ...
}
```

## Rust Standards

### Struct & Enum Definitions

#### Structs
```rust
// Good example - clear struct definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: TaskId,
    pub title: String,
    pub status: TaskStatus,
    pub assignee_id: Option<UserId>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// Using Builder pattern
impl Task {
    pub fn builder() -> TaskBuilder {
        TaskBuilder::default()
    }
}

#[derive(Default)]
pub struct TaskBuilder {
    title: Option<String>,
    status: Option<TaskStatus>,
    assignee_id: Option<UserId>,
}

impl TaskBuilder {
    pub fn title<S: Into<String>>(mut self, title: S) -> Self {
        self.title = Some(title.into());
        self
    }

    pub fn build(self) -> Result<Task, String> {
        let title = self.title.ok_or("Title is required")?;
        Ok(Task {
            id: TaskId::new(),
            title,
            status: self.status.unwrap_or(TaskStatus::Todo),
            assignee_id: self.assignee_id,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        })
    }
}
```

#### Enum Definitions
```rust
// Good example - clear Enum definition
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TaskStatus {
    Todo,
    InProgress,
    Completed,
    Cancelled,
}

impl TaskStatus {
    pub fn is_active(&self) -> bool {
        matches!(self, TaskStatus::Todo | TaskStatus::InProgress)
    }

    pub fn can_transition_to(&self, target: TaskStatus) -> bool {
        match (self, target) {
            (TaskStatus::Todo, TaskStatus::InProgress) => true,
            (TaskStatus::InProgress, TaskStatus::Completed) => true,
            (TaskStatus::InProgress, TaskStatus::Cancelled) => true,
            _ => false,
        }
    }
}
```

### Error Handling

#### Custom Error Types
```rust
// Good example - structured error definition
#[derive(Debug, thiserror::Error)]
pub enum TaskError {
    #[error("Task not found: {id}")]
    NotFound { id: TaskId },

    #[error("Invalid task status transition from {from:?} to {to:?}")]
    InvalidStatusTransition { from: TaskStatus, to: TaskStatus },

    #[error("Repository error: {0}")]
    Repository(#[from] RepositoryError),

    #[error("Validation error: {message}")]
    Validation { message: String },
}

// Using Result type
pub type TaskResult<T> = Result<T, TaskError>;

// Usage example
pub async fn update_task_status(
    id: &TaskId,
    new_status: TaskStatus
) -> TaskResult<Task> {
    let mut task = repository.find_by_id(id).await?
        .ok_or_else(|| TaskError::NotFound { id: *id })?;

    if !task.status.can_transition_to(new_status) {
        return Err(TaskError::InvalidStatusTransition {
            from: task.status,
            to: new_status,
        });
    }

    task.status = new_status;
    task.updated_at = Utc::now();

    repository.save(&task).await?;
    Ok(task)
}
```

### Option/Result Processing Standards

#### Option Value Extraction
```rust
// Use if let Some for single case
if let Some(user) = user_repository.find_by_id(&user_id).await? {
    return Ok(user.display_name);
}

// For multiple cases, store in temporary variables to avoid nesting
let user = user_repository.find_by_id(&user_id).await?;
let project = project_repository.find_by_id(&project_id).await?;
let task = task_repository.find_by_id(&task_id).await?;

let (user, project, task) = match (user, project, task) {
    (Some(u), Some(p), Some(t)) => (u, p, t),
    _ => return Err(ServiceError::ResourceNotFound),
};

// Usage
process_task_assignment(&user, &project, &task).await?;
```

#### Error Chaining
```rust
// Good example - adding error context
use anyhow::{Context, Result};

pub async fn create_project_with_tasks(
    project_data: CreateProjectRequest
) -> Result<Project> {
    let project = project_service
        .create_project(project_data.project)
        .await
        .context("Failed to create project")?;

    for task_data in project_data.tasks {
        task_service
            .create_task(&project.id, task_data)
            .await
            .with_context(|| format!("Failed to create task: {}", task_data.title))?;
    }

    Ok(project)
}
```

## Code Quality

### Test Writing

#### Unit Test Structure
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_task_status_transition_valid() {
        // Arrange
        let status = TaskStatus::Todo;
        let target = TaskStatus::InProgress;

        // Act
        let result = status.can_transition_to(target);

        // Assert
        assert!(result);
    }

    #[test]
    fn test_task_status_transition_invalid() {
        // Arrange
        let status = TaskStatus::Completed;
        let target = TaskStatus::Todo;

        // Act
        let result = status.can_transition_to(target);

        // Assert
        assert!(!result);
    }
}
```

```typescript
// TypeScript test example
describe('TaskService', () => {
  describe('calculateProgress', () => {
    it('should return 0 when no tasks exist', () => {
      // Arrange
      const completedTasks = 0;
      const totalTasks = 0;

      // Act
      const result = calculateProgress(completedTasks, totalTasks);

      // Assert
      expect(result).toBe(0);
    });

    it('should calculate correct percentage', () => {
      // Arrange
      const completedTasks = 3;
      const totalTasks = 10;

      // Act
      const result = calculateProgress(completedTasks, totalTasks);

      // Assert
      expect(result).toBe(30);
    });
  });
});
```

### Documentation

#### Code Comments
```rust
/// Calculates task progress
///
/// # Arguments
///
/// * `completed_tasks` - Number of completed tasks
/// * `total_tasks` - Total number of tasks
///
/// # Returns
///
/// Progress percentage (0-100)
///
/// # Examples
///
/// ```
/// let progress = calculate_progress(3, 10);
/// assert_eq!(progress, 30);
/// ```
pub fn calculate_progress(completed_tasks: usize, total_tasks: usize) -> u8 {
    if total_tasks == 0 {
        return 0;
    }
    ((completed_tasks * 100) / total_tasks) as u8
}
```

```typescript
/**
 * Retrieves user's task list
 *
 * @param userId - Target user's ID
 * @param options - Retrieval options
 * @returns Promise<Task[]> - Task list
 *
 * @example
 * ```typescript
 * const tasks = await getUserTasks('user-123', { includeCompleted: false });
 * ```
 */
export async function getUserTasks(
  userId: string,
  options: GetTasksOptions = {}
): Promise<Task[]> {
  // Implementation
}
```

## Performance Standards

### Frontend

#### Appropriate Reactivity Usage
```typescript
// Good example - minimal state management
class TaskStore {
  private tasks = $state<Task[]>([]);

  // Use derived state
  get completedTasks() {
    return $derived(this.tasks.filter(t => t.status === 'completed'));
  }
}

// Bad example - redundant state management
class TaskStore {
  private tasks = $state<Task[]>([]);
  private completedTasks = $state<Task[]>([]); // Redundant

  addTask(task: Task) {
    this.tasks.push(task);
    // Manual synchronization required - source of bugs
    this.updateCompletedTasks();
  }
}
```

### Backend

#### Efficient Database Access
```rust
// Good example - batch processing
pub async fn get_tasks_with_assignees(
    project_id: &ProjectId
) -> Result<Vec<TaskWithAssignee>> {
    // Use JOIN to fetch in single query
    let query = r#"
        SELECT t.*, u.display_name as assignee_name
        FROM tasks t
        LEFT JOIN users u ON t.assignee_id = u.id
        WHERE t.project_id = ?
    "#;

    database.query(query, &[project_id]).await
}

// Bad example - N+1 problem
pub async fn get_tasks_with_assignees_slow(
    project_id: &ProjectId
) -> Result<Vec<TaskWithAssignee>> {
    let tasks = task_repository.find_by_project(project_id).await?;

    let mut result = Vec::new();
    for task in tasks {
        // Execute query for each task - N+1 problem
        let assignee = if let Some(assignee_id) = &task.assignee_id {
            user_repository.find_by_id(assignee_id).await?
        } else {
            None
        };
        result.push(TaskWithAssignee { task, assignee });
    }

    Ok(result)
}
```

Following these standards enables maintaining a maintainable, performant, and consistent codebase.
