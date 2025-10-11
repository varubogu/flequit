# TaskList (タスクリスト) - task_lists

## Overview
List management entity for classifying and organizing tasks within projects.

## Field Definitions

| Logical Name | Physical Name | Rust Type | Description | PK | UK | NN | Default Value | Foreign Key | PostgreSQL Type | SQLite Type | TypeScript Type |
|--------------|---------------|-----------|-------------|----|----|----|---------------|-------------|-----------------|-------------|-----------------|
| Task List ID | id | TaskListId | Unique task list identifier | ✓ | - | ✓ | - | - | UUID | TEXT | string |
| Project ID | project_id | ProjectId | Associated project ID | - | - | ✓ | - | projects.id | UUID | TEXT | string |
| Task List Name | name | String | Task list name | - | - | ✓ | - | - | TEXT | TEXT | string |
| Description | description | String | Description | - | - | - | NULL | - | TEXT | TEXT | string \| null |
| Display Order | order_index | i32 | Display order | - | - | ✓ | 0 | - | INTEGER | INTEGER | number |
| Archive Status | is_archived | bool | Archive status | - | - | ✓ | false | - | BOOLEAN | INTEGER | boolean |
| Created At | created_at | DateTime<Utc> | Creation timestamp (ISO 8601) | - | - | ✓ | - | - | TIMESTAMPTZ | TEXT | string |
| Last Updated At | updated_at | DateTime<Utc> | Last update timestamp (ISO 8601) | - | - | ✓ | - | - | TIMESTAMPTZ | TEXT | string |

## Constraints
- PRIMARY KEY: id
- FOREIGN KEY: project_id → projects.id
- NOT NULL: id, project_id, name, order_index, is_archived, created_at, updated_at

## Indexes
```sql
CREATE INDEX IF NOT EXISTS idx_task_lists_project_id ON task_lists(project_id);
CREATE INDEX IF NOT EXISTS idx_task_lists_order_index ON task_lists(order_index);
CREATE INDEX IF NOT EXISTS idx_task_lists_created_at ON task_lists(created_at);
```

## Related Tables
- projects: Associated project
- tasks: Associated tasks

## Notes
Task lists are optional, and tasks can belong directly to projects. Used for implementing Kanban board columns and GTD lists.
