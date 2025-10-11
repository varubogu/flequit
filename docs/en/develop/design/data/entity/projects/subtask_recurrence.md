# SubtaskRecurrence (サブタスク繰り返し関連付け) - subtask_recurrences

## Overview
Entity for managing associations between subtasks and recurrence rules.

## Field Definitions

| Logical Name | Physical Name | Rust Type | Description | PK | UK | NN | Default Value | Foreign Key | PostgreSQL Type | SQLite Type | TypeScript Type |
|--------------|---------------|-----------|-------------|----|----|----|---------------|-------------|-----------------|-------------|-----------------|
| SubTask ID | subtask_id | SubTaskId | Recurring subtask ID | ✓ | - | ✓ | - | subtasks.id | UUID | TEXT | string |
| Recurrence Rule ID | recurrence_rule_id | String | Recurrence rule ID | ✓ | - | ✓ | - | recurrence_rules.id | UUID | TEXT | string |
| Association Created At | created_at | DateTime<Utc> | Association creation timestamp (ISO 8601) | - | - | ✓ | - | - | TIMESTAMPTZ | TEXT | string |

## Constraints
- PRIMARY KEY: (subtask_id, recurrence_rule_id)
- FOREIGN KEY: subtask_id → subtasks.id
- FOREIGN KEY: recurrence_rule_id → recurrence_rules.id
- NOT NULL: subtask_id, recurrence_rule_id, created_at

## Indexes
```sql
CREATE INDEX IF NOT EXISTS idx_subtask_recurrences_subtask_id ON subtask_recurrences(subtask_id);
CREATE INDEX IF NOT EXISTS idx_subtask_recurrences_recurrence_rule_id ON subtask_recurrences(recurrence_rule_id);
CREATE INDEX IF NOT EXISTS idx_subtask_recurrences_created_at ON subtask_recurrences(created_at);
```

## Related Tables
- subtasks: Target subtask for recurrence
- recurrence_rules: Applied recurrence rule

## Notes
Manages many-to-many relationship between subtasks and recurrence rules. Prevents duplicates with composite primary key.
