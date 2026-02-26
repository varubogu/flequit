# Automerge Structure Specification

## Overview

The Flequit application's data management adopts an Automerge-based system for distributed synchronization in local environments using CRDT (Conflict-free Replicated Data Type). Data is distributed and stored across multiple Automerge documents, designed to support future cloud synchronization and conflict resolution.

## Automerge Document Structure

### Document Segmentation Policy

Data is divided into the following 4 Automerge documents:

1. **Settings** (`settings.automerge`) - Configuration information and project list
2. **Account** (`account.automerge`) - Account information
3. **User** (`user.automerge`) - User information
4. **Project** (`project_{id}.automerge`) - Project-specific data

### Inter-Document Relationships

```
Settings Document
├── Personal settings (Settings)
├── Custom date format settings (CustomDateFormat[])
├── Custom datetime format settings (CustomDateTimeFormat[])
├──
├──
├──
└── Local settings (LocalSettings)

Account Document
├── Local account (Account)
└── Server account array (Account[])

User Document
└── User information array (User[]) ※ Add/Update only, no deletion

Project Documents (per project_id)
├── Project detailed data
├── Task lists (TaskList[])
├── Tasks (Task[])
├── Subtasks (SubTask[])
├── Tags (Tag[])
└── Members (Member[])
```

## Data Access Patterns

### Basic Read/Write Operations

```rust
// Data access example in Rust
use crate::models::project::Project;
use crate::models::user::User;
use crate::types::id_types::{ProjectId, UserId};

// Get project list from Settings Document
let projects: Vec<Project> = document_manager.load_data(
    &DocumentType::Settings,
    "projects"
).await?;

// Get task list from Project Document
let project_id = ProjectId::from("project-uuid-1");
let tasks: Vec<Task> = document_manager.load_data(
    &DocumentType::Project(project_id.to_string()),
    "tasks"
).await?;

// Get user list from User Document (array format)
let users: Vec<User> = document_manager.load_data(
    &DocumentType::User,
    "users"
).await?;

// Get specific user profile
let user_id = UserId::from("public-user-uuid-1");
let specific_user: Option<User> = users.into_iter()
    .find(|user| user.id == user_id);
```

```typescript
// Tauri command invocation example in TypeScript
import { invoke } from '@tauri-apps/api/tauri';

// Get project list (Rust: Vec<Project> → TS: Project[])
const projects: Project[] = await invoke('get_projects');

// Get task list (Rust: Vec<Task> → TS: Task[])
const tasks: Task[] = await invoke('get_tasks', {
  projectId: 'project-uuid-1' // TS: string → Rust: ProjectId
});

// Get user list (array format) (Rust: Vec<User> → TS: User[])
const users: User[] = await invoke('get_users');

// Get user tree structure (with assigned tasks and subtasks)
const userTree: UserTree = await invoke('get_user_with_assignments', {
  userId: 'public-user-uuid-1'
});

// Get tag tree structure (with related tasks and subtasks)
const tagTree: TagTree = await invoke('get_tag_with_relations', {
  tagId: 'tag-uuid-1'
});

// Assign user to task (using normalized association table)
await invoke('assign_task_to_user', {
  taskId: 'task-uuid-1',
  userId: 'public-user-uuid-1'
});

// Add tag to subtask (using normalized association table)
await invoke('add_tag_to_subtask', {
  subtaskId: 'subtask-uuid-1',
  tagId: 'tag-uuid-1'
});

// Associate recurrence rule with task
await invoke('associate_recurrence_rule_to_task', {
  taskId: 'task-uuid-1',
  recurrenceRuleId: 'recurrence-rule-uuid-1'
});

// Update own profile (with edit permission check)
const updatedProfile: User = await invoke('update_user_profile', {
  userProfile: {
    id: 'public-user-uuid-1',
    username: 'new_username',
    display_name: 'New Display Name'
    // ... other fields
  }
});
```

### Inter-Document Relationships

1. **Settings → Project**: Navigation from project list to project details
2. **Account ↔ User**: Association between account authentication information (local/server) and user profile
3. **Project → User**: Association between project members/task assignees and user information (referenced by User.id)
4. **TaskList → Task → SubTask**: Hierarchical task management structure

### Special Operation Constraints for User Document

The User Document has special constraints different from other documents:

#### Data Operation Constraints

- **Add**: Adding new user profiles is always possible
- **Update**: Updating existing user profiles is possible
- **Delete**: User profile deletion is not allowed (information accumulation method)
- **Edit Permission**: Only profiles matching the current Account.user_id can be edited

#### Data Characteristics

- **Public Information**: All user profiles are accessible by other users
- **Information Accumulation**: Continuously accumulate information about project participants and assignees
- **Profile Management**: Functions as public profile information for self and others

#### Implementation Considerations

```rust
// Example of determining editable profiles
fn can_edit_user_profile(current_account: &Account, target_user_id: &UserId) -> bool {
    current_account.user_id == *target_user_id
}

// Example of user profile update (no deletion)
fn update_user_profile(users: &mut Vec<User>, updated_user: User) -> Result<()> {
    if let Some(existing_user) = users.iter_mut().find(|u| u.id == updated_user.id) {
        // Update existing profile
        *existing_user = updated_user;
    } else {
        // Add new profile
        users.push(updated_user);
    }
    Ok(())
}
```

### Synchronization and Conflict Resolution

Automerge characteristics provide the following benefits:

- **Automatic Conflict Resolution**: Automatic merging through CRDT algorithms
- **Distributed Synchronization**: Operations in offline environments and subsequent synchronization
- **History Management**: Retention of all change history
- **Partial Synchronization**: Efficient synchronization per document unit
