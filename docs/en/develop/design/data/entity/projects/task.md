# Task (タスク) - tasks

## Overview

Core entity of the task management system. Manages detailed information and status of work items.

## Field Definitions

| Logical Name       | Physical Name   | Rust Type             | Description                      | PK  | UK  | NN  | Default Value | Foreign Key   | PostgreSQL Type | SQLite Type | TypeScript Type |
| ------------------ | --------------- | --------------------- | -------------------------------- | --- | --- | --- | ------------- | ------------- | --------------- | ----------- | --------------- |
| Task ID            | id              | TaskId                | Unique task identifier           | ✓   | -   | ✓   | -             | -             | UUID            | TEXT        | string          |
| Project ID         | project_id      | ProjectId             | Associated project ID            | -   | -   | ✓   | -             | projects.id   | UUID            | TEXT        | string          |
| Task List ID       | task_list_id    | Option<TaskListId>    | Associated task list ID          | -   | -   | -   | NULL          | task_lists.id | UUID            | TEXT        | string \| null  |
| Task Title         | title           | String                | Task title                       | -   | -   | ✓   | -             | -             | TEXT            | TEXT        | string          |
| Description        | description     | String                | Detailed description             | -   | -   | -   | NULL          | -             | TEXT            | TEXT        | string \| null  |
| Status             | status          | String                | Task status                      | -   | -   | ✓   | "Todo"        | -             | TEXT            | TEXT        | string          |
| Priority           | priority        | String                | Priority                         | -   | -   | ✓   | "Medium"      | -             | TEXT            | TEXT        | string          |
| Importance         | importance      | String                | Importance                       | -   | -   | ✓   | "Medium"      | -             | TEXT            | TEXT        | string          |
| Due Date           | due_date        | Option<DateTime<Utc>> | Due date (ISO 8601)              | -   | -   | -   | NULL          | -             | TIMESTAMPTZ     | TEXT        | string \| null  |
| Planned Start Date | plan_start_date | Option<DateTime<Utc>> | Planned start date (ISO 8601)    | -   | -   | -   | NULL          | -             | TIMESTAMPTZ     | TEXT        | string \| null  |
| Planned End Date   | plan_end_date   | Option<DateTime<Utc>> | Planned end date (ISO 8601)      | -   | -   | -   | NULL          | -             | TIMESTAMPTZ     | TEXT        | string \| null  |
| Actual Start Date  | do_start_date   | Option<DateTime<Utc>> | Actual start date (ISO 8601)     | -   | -   | -   | NULL          | -             | TIMESTAMPTZ     | TEXT        | string \| null  |
| Actual End Date    | do_end_date     | Option<DateTime<Utc>> | Actual end date (ISO 8601)       | -   | -   | -   | NULL          | -             | TIMESTAMPTZ     | TEXT        | string \| null  |
| Display Order      | order_index     | i32                   | Display order                    | -   | -   | ✓   | 0             | -             | INTEGER         | INTEGER     | number          |
| Archive Status     | is_archived     | bool                  | Archive status                   | -   | -   | ✓   | false         | -             | BOOLEAN         | INTEGER     | boolean         |
| Created At         | created_at      | DateTime<Utc>         | Creation timestamp (ISO 8601)    | -   | -   | ✓   | -             | -             | TIMESTAMPTZ     | TEXT        | string          |
| Last Updated At    | updated_at      | DateTime<Utc>         | Last update timestamp (ISO 8601) | -   | -   | ✓   | -             | -             | TIMESTAMPTZ     | TEXT        | string          |

## Constraints

- PRIMARY KEY: id
- FOREIGN KEY: project_id → projects.id
- FOREIGN KEY: task_list_id → task_lists.id
- NOT NULL: id, project_id, title, status, priority, importance, order_index, is_archived, created_at, updated_at

## Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_task_list_id ON tasks(task_list_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_order_index ON tasks(order_index);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
```

## Related Tables

- projects: Associated project
- task_lists: Associated task list (optional)
- subtasks: Child subtasks
- task_assignments: Task assignee associations
- task_tags: Task tag associations
- task_recurrences: Task recurrence associations

## Notes

Tasks must belong to a project, but task list membership is optional. Date management separates planning (plan) and actual (do) records.
