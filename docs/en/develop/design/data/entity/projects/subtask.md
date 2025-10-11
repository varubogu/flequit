# SubTask (サブタスク) - subtasks

## Overview
Work items that break down tasks. Child entities subordinate to parent tasks.

## Field Definitions

| Logical Name | Physical Name | Rust Type | Description | PK | UK | NN | Default Value | Foreign Key | PostgreSQL Type | SQLite Type | TypeScript Type |
|--------------|---------------|-----------|-------------|----|----|----|---------------|-------------|-----------------|-------------|-----------------|
| SubTask ID | id | SubTaskId | Unique subtask identifier | ✓ | - | ✓ | - | - | UUID | TEXT | string |
| Task ID | task_id | TaskId | Parent task ID | - | - | ✓ | - | tasks.id | UUID | TEXT | string |
| SubTask Title | title | String | SubTask title | - | - | ✓ | - | - | TEXT | TEXT | string |
| Description | description | String | Description | - | - | - | NULL | - | TEXT | TEXT | string \| null |
| Status | status | String | Status | - | - | ✓ | "not_started" | - | TEXT | TEXT | string |
| Priority | priority | Option<i32> | Priority | - | - | - | NULL | - | INTEGER | INTEGER | number \| null |
| Planned Start Date | plan_start_date | Option<DateTime<Utc>> | Planned start date (ISO 8601) | - | - | - | NULL | - | TIMESTAMPTZ | TEXT | string \| null |
| Planned End Date | plan_end_date | Option<DateTime<Utc>> | Planned end date (ISO 8601) | - | - | - | NULL | - | TIMESTAMPTZ | TEXT | string \| null |
| Actual Start Date | do_start_date | Option<DateTime<Utc>> | Actual start date (ISO 8601) | - | - | - | NULL | - | TIMESTAMPTZ | TEXT | string \| null |
| Actual End Date | do_end_date | Option<DateTime<Utc>> | Actual end date (ISO 8601) | - | - | - | NULL | - | TIMESTAMPTZ | TEXT | string \| null |
| Range Date Flag | is_range_date | Option<bool> | Range date flag | - | - | - | NULL | - | BOOLEAN | INTEGER | boolean \| null |
| Display Order | order_index | i32 | Display order | - | - | ✓ | 0 | - | INTEGER | INTEGER | number |
| Completion Status | completed | bool | Completion status | - | - | ✓ | false | - | BOOLEAN | INTEGER | boolean |
| Created At | created_at | DateTime<Utc> | Creation timestamp (ISO 8601) | - | - | ✓ | - | - | TIMESTAMPTZ | TEXT | string |
| Last Updated At | updated_at | DateTime<Utc> | Last update timestamp (ISO 8601) | - | - | ✓ | - | - | TIMESTAMPTZ | TEXT | string |

## Constraints
- PRIMARY KEY: id
- FOREIGN KEY: task_id → tasks.id
- NOT NULL: id, task_id, title, status, order_index, completed, created_at, updated_at

## Indexes
```sql
CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_status ON subtasks(status);
CREATE INDEX IF NOT EXISTS idx_subtasks_order_index ON subtasks(order_index);
CREATE INDEX IF NOT EXISTS idx_subtasks_completed ON subtasks(completed);
CREATE INDEX IF NOT EXISTS idx_subtasks_created_at ON subtasks(created_at);
```

## Related Tables
- tasks: Parent task
- subtask_assignments: SubTask assignee associations
- subtask_tags: SubTask tag associations
- subtask_recurrences: SubTask recurrence associations

## Notes
SubTasks are used for detailed breakdown of tasks. They have independent completion status and status, and are managed separately from parent tasks.
