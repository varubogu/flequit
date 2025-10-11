# RecurrenceRule (繰り返しルール) - recurrence_rules

## Overview
Rule entity for defining recurrence execution patterns for tasks and subtasks.

## Field Definitions

| Logical Name | Physical Name | Rust Type | Description | PK | UK | NN | Default Value | Foreign Key | PostgreSQL Type | SQLite Type | TypeScript Type |
|--------------|---------------|-----------|-------------|----|----|----|---------------|-------------|-----------------|-------------|-----------------|
| Recurrence Rule ID | id | String | Recurrence rule ID | ✓ | - | ✓ | - | - | UUID | TEXT | string |
| Recurrence Unit | unit | String | Recurrence unit | - | - | ✓ | - | - | TEXT | TEXT | string |
| Recurrence Interval | interval_value | i32 | Recurrence interval | - | - | ✓ | 1 | - | INTEGER | INTEGER | number |
| End Date | end_date | Option<DateTime<Utc>> | End date (ISO 8601) | - | - | - | NULL | - | TIMESTAMPTZ | TEXT | string \| null |
| Recurrence Count | count | Option<i32> | Recurrence count | - | - | - | NULL | - | INTEGER | INTEGER | number \| null |
| Weekday Specification | by_weekday | Option<String> | Weekday specification (comma-separated) | - | - | - | NULL | - | TEXT | TEXT | string \| null |
| Month Day Specification | by_monthday | Option<String> | Month day specification (comma-separated) | - | - | - | NULL | - | TEXT | TEXT | string \| null |
| Year Day Specification | by_yearday | Option<String> | Year day specification (comma-separated) | - | - | - | NULL | - | TEXT | TEXT | string \| null |
| Month Specification | by_month | Option<String> | Month specification (comma-separated) | - | - | - | NULL | - | TEXT | TEXT | string \| null |
| Created At | created_at | DateTime<Utc> | Creation timestamp (ISO 8601) | - | - | ✓ | - | - | TIMESTAMPTZ | TEXT | string |
| Last Updated At | updated_at | DateTime<Utc> | Last update timestamp (ISO 8601) | - | - | ✓ | - | - | TIMESTAMPTZ | TEXT | string |

## Constraints
- PRIMARY KEY: id
- NOT NULL: id, unit, interval_value, created_at, updated_at

## Indexes
```sql
CREATE INDEX IF NOT EXISTS idx_recurrence_rules_unit ON recurrence_rules(unit);
CREATE INDEX IF NOT EXISTS idx_recurrence_rules_created_at ON recurrence_rules(created_at);
```

## Related Tables
- task_recurrences: Task recurrence associations
- subtask_recurrences: SubTask recurrence associations

## Notes
RFC5545 (iCalendar) compliant recurrence rule definition. Shared rules that can be referenced by multiple tasks and subtasks.
