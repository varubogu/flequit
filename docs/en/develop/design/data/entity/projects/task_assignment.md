# TaskAssignment (タスク担当者関連付け) - task_assignments

## Overview
Entity for managing associations between tasks and assigned users. Managed with composite primary key including project_id for cross-project data management.

## Field Definitions

| Logical Name | Physical Name | Rust Type | Description | PK | UK | NN | Default Value | Foreign Key | PostgreSQL Type | SQLite Type | TypeScript Type |
|--------------|---------------|-----------|-------------|----|----|----|---------------|-------------|-----------------|-------------|-----------------|
| Project ID | project_id | ProjectId | Project ID | ✓ | - | ✓ | - | projects.id | UUID | TEXT | string |
| Task ID | task_id | TaskId | Assigned task ID | ✓ | - | ✓ | - | tasks.id | UUID | TEXT | string |
| User ID | user_id | UserId | Assigned user ID | ✓ | - | ✓ | - | users.id | UUID | TEXT | string |
| Association Created At | created_at | DateTime<Utc> | Association creation timestamp (ISO 8601) | - | - | ✓ | - | - | TIMESTAMPTZ | TEXT | string |

## Constraints
- PRIMARY KEY: (project_id, task_id, user_id)
- FOREIGN KEY: project_id → projects.id
- FOREIGN KEY: task_id → tasks.id
- FOREIGN KEY: user_id → users.id
- NOT NULL: project_id, task_id, user_id, created_at

## Indexes
```sql
CREATE INDEX IF NOT EXISTS idx_task_assignments_project_id ON task_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_task_id ON task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_user_id ON task_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_created_at ON task_assignments(created_at);
```

## Related Tables
- projects: Associated project
- tasks: Assigned task
- users: Assigned user

## Design Principles

### Why project_id is Required

1. **Tasks and Users Belong to Projects**
   - project_id exists in tasks table
   - users table is also managed as project participants
   - project_id is mandatory in association tables

2. **Cross-Project Data Management**
   - When handling tasks and users across multiple projects, project_id is needed for identification
   - Avoids ID collision risks

3. **Data Integrity Guarantee**
   - Ensures integrity with projects table through FOREIGN KEY constraints
   - Prevents invalid associations across projects

## TypeScript Type Definition

```typescript
interface TaskAssignment {
  projectId: string;  // Required
  taskId: string;     // Required
  userId: string;     // Required
  createdAt: Date;
}
```

## Service Usage Example

```typescript
// projectId is required for assignee operations
async assignUserToTask(projectId: string, taskId: string, userId: string): Promise<void>
async unassignUserFromTask(projectId: string, taskId: string, userId: string): Promise<void>
async getUsersByTask(projectId: string, taskId: string): Promise<User[]>
```

## Notes
Manages many-to-many relationship between tasks and users. Prevents duplicates with composite primary key (project_id, task_id, user_id) and enables cross-project data management.
