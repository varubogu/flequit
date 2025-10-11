# WeekdayCondition (曜日条件) - weekday_conditions

## Overview
Entity for managing condition adjustments based on weekdays.

## Field Definitions

| Logical Name | Physical Name | Rust Type | Description | PK | UK | NN | Default Value | Foreign Key | PostgreSQL Type | SQLite Type | TypeScript Type |
|--------------|---------------|-----------|-------------|----|----|----|---------------|-------------|-----------------|-------------|-----------------|
| Condition ID | id | String | Unique condition identifier | ✓ | - | ✓ | - | - | UUID | TEXT | string |
| Target Weekday | if_weekday | String | Target weekday for evaluation | - | - | ✓ | - | - | TEXT | TEXT | string |
| Adjustment Direction | then_direction | String | Adjustment direction (before, after, nearest, etc.) | - | - | ✓ | - | - | TEXT | TEXT | string |
| Adjustment Target | then_target | String | Adjustment target (weekday, specific day, days, etc.) | - | - | ✓ | - | - | TEXT | TEXT | string |
| Target Weekday | then_weekday | Option<String> | Target weekday (when target=specific day) | - | - | - | NULL | - | TEXT | TEXT | string \| null |
| Adjustment Days | then_days | Option<i32> | Adjustment days (when target=days) | - | - | - | NULL | - | INTEGER | INTEGER | number \| null |

## Constraints
- PRIMARY KEY: id
- NOT NULL: id, if_weekday, then_direction, then_target

## Indexes
```sql
CREATE INDEX IF NOT EXISTS idx_weekday_conditions_if_weekday ON weekday_conditions(if_weekday);
CREATE INDEX IF NOT EXISTS idx_weekday_conditions_then_target ON weekday_conditions(then_target);
```

## Related Tables
None

## Notes
Used for business day adjustments and weekday-fixed tasks. Enables flexible date adjustments through conditional logic.
