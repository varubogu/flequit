# RecurrenceDetails (繰り返し詳細設定) - recurrence_details

## Overview
Entity for managing detailed condition settings of recurrence rules.

## Field Definitions

| Logical Name | Physical Name | Rust Type | Description | PK | UK | NN | Default Value | Foreign Key | PostgreSQL Type | SQLite Type | TypeScript Type |
|--------------|---------------|-----------|-------------|----|----|----|---------------|-------------|-----------------|-------------|-----------------|
| Detail Setting ID | id | String | Detail setting ID | ✓ | - | ✓ | - | - | UUID | TEXT | string |
| Specific Date of Month | specific_date | Option<i32> | Specific date of month (1-31, for monthly recurrence) | - | - | - | NULL | - | INTEGER | INTEGER | number \| null |
| Specific Week of Period | week_of_period | Option<String> | Specific week of period (1st week, last week, etc.) | - | - | - | NULL | - | TEXT | TEXT | string \| null |
| Specific Weekday of Week | weekday_of_week | Option<String> | Specific weekday of week | - | - | - | NULL | - | TEXT | TEXT | string \| null |

## Constraints
- PRIMARY KEY: id
- NOT NULL: id

## Indexes
```sql
CREATE INDEX IF NOT EXISTS idx_recurrence_details_specific_date ON recurrence_details(specific_date);
CREATE INDEX IF NOT EXISTS idx_recurrence_details_week_of_period ON recurrence_details(week_of_period);
```

## Related Tables
- recurrence_rules: Associated recurrence rule

## Notes
Manages detailed conditions for complex recurrence patterns. Supports fine specifications like end of month, 3rd Tuesday, etc.
