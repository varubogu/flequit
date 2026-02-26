# TaskRecurrence (タスク繰り返し関連付け) - task_recurrences

## Overview

Entity for managing associations between tasks and recurrence rules.

## Field Definitions

| Logical Name           | Physical Name      | Rust Type     | Description                               | PK  | UK  | NN  | Default Value | Foreign Key         | PostgreSQL Type | SQLite Type | TypeScript Type |
| ---------------------- | ------------------ | ------------- | ----------------------------------------- | --- | --- | --- | ------------- | ------------------- | --------------- | ----------- | --------------- |
| Task ID                | task_id            | TaskId        | Recurring task ID                         | ✓   | -   | ✓   | -             | tasks.id            | UUID            | TEXT        | string          |
| Recurrence Rule ID     | recurrence_rule_id | String        | Recurrence rule ID                        | ✓   | -   | ✓   | -             | recurrence_rules.id | UUID            | TEXT        | string          |
| Association Created At | created_at         | DateTime<Utc> | Association creation timestamp (ISO 8601) | -   | -   | ✓   | -             | -                   | TIMESTAMPTZ     | TEXT        | string          |

## Constraints

- PRIMARY KEY: (task_id, recurrence_rule_id)
- FOREIGN KEY: task_id → tasks.id
- FOREIGN KEY: recurrence_rule_id → recurrence_rules.id
- NOT NULL: task_id, recurrence_rule_id, created_at

## Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_task_recurrences_task_id ON task_recurrences(task_id);
CREATE INDEX IF NOT EXISTS idx_task_recurrences_recurrence_rule_id ON task_recurrences(recurrence_rule_id);
CREATE INDEX IF NOT EXISTS idx_task_recurrences_created_at ON task_recurrences(created_at);
```

## Related Tables

- tasks: Target task for recurrence
- recurrence_rules: Applied recurrence rule

## Notes

Manages many-to-many relationship between tasks and recurrence rules. Prevents duplicates with composite primary key.
