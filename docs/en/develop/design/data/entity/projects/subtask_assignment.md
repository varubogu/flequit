# SubtaskAssignment (サブタスク担当者関連付け) - subtask_assignments

## Overview

Entity for managing associations between subtasks and assigned users. Managed with composite primary key including project_id for cross-project data management.

## Field Definitions

| Logical Name           | Physical Name | Rust Type     | Description                               | PK  | UK  | NN  | Default Value | Foreign Key | PostgreSQL Type | SQLite Type | TypeScript Type |
| ---------------------- | ------------- | ------------- | ----------------------------------------- | --- | --- | --- | ------------- | ----------- | --------------- | ----------- | --------------- |
| Project ID             | project_id    | ProjectId     | Project ID                                | ✓   | -   | ✓   | -             | projects.id | UUID            | TEXT        | string          |
| SubTask ID             | subtask_id    | SubTaskId     | Assigned subtask ID                       | ✓   | -   | ✓   | -             | subtasks.id | UUID            | TEXT        | string          |
| User ID                | user_id       | UserId        | Assigned user ID                          | ✓   | -   | ✓   | -             | users.id    | UUID            | TEXT        | string          |
| Association Created At | created_at    | DateTime<Utc> | Association creation timestamp (ISO 8601) | -   | -   | ✓   | -             | -           | TIMESTAMPTZ     | TEXT        | string          |

## Constraints

- PRIMARY KEY: (project_id, subtask_id, user_id)
- FOREIGN KEY: project_id → projects.id
- FOREIGN KEY: subtask_id → subtasks.id
- FOREIGN KEY: user_id → users.id
- NOT NULL: project_id, subtask_id, user_id, created_at

## Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_subtask_assignments_project_id ON subtask_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_subtask_assignments_subtask_id ON subtask_assignments(subtask_id);
CREATE INDEX IF NOT EXISTS idx_subtask_assignments_user_id ON subtask_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_subtask_assignments_created_at ON subtask_assignments(created_at);
```

## Related Tables

- projects: Associated project
- subtasks: Assigned subtask
- users: Assigned user

## Design Principles

### Why project_id is Required

1. **SubTasks and Users Belong to Projects**
   - project_id exists in subtasks table
   - users table is also managed as project participants
   - project_id is mandatory in association tables

2. **Cross-Project Data Management**
   - When handling subtasks and users across multiple projects, project_id is needed for identification
   - Avoids ID collision risks

3. **Data Integrity Guarantee**
   - Ensures integrity with projects table through FOREIGN KEY constraints
   - Prevents invalid associations across projects

## TypeScript Type Definition

```typescript
interface SubtaskAssignment {
  projectId: string; // Required
  subtaskId: string; // Required
  userId: string; // Required
  createdAt: Date;
}
```

## Service Usage Example

```typescript
// projectId is required for assignee operations
async assignUserToSubtask(projectId: string, subtaskId: string, userId: string): Promise<void>
async unassignUserFromSubtask(projectId: string, subtaskId: string, userId: string): Promise<void>
async getUsersBySubtask(projectId: string, subtaskId: string): Promise<User[]>
```

## Notes

Manages many-to-many relationship between subtasks and users. Prevents duplicates with composite primary key (project_id, subtask_id, user_id) and enables cross-project data management.
