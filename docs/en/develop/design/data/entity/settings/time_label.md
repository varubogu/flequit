# TimeLabel (時刻ラベル) - time_labels

## Overview
Entity for managing time labeling.

## Field Definitions

| Logical Name | Physical Name | Rust Type | Description | PK | UK | NN | Default Value | Foreign Key | PostgreSQL Type | SQLite Type | TypeScript Type |
|--------------|---------------|-----------|-------------|----|----|----|---------------|-------------|-----------------|-------------|-----------------|
| Label ID | id | String | Label ID | ✓ | - | ✓ | - | - | UUID | TEXT | string |
| Label Name | name | String | Label name | - | - | ✓ | - | - | TEXT | TEXT | string |
| Time | time | String | Time (HH:mm format) | - | - | ✓ | - | - | TEXT | TEXT | string |

## Constraints
- PRIMARY KEY: id
- NOT NULL: id, name, time

## Indexes
```sql
CREATE INDEX IF NOT EXISTS idx_time_labels_time ON time_labels(time);
CREATE INDEX IF NOT EXISTS idx_time_labels_name ON time_labels(name);
```

## Related Tables
None

## Notes
Manages semantic labeling for times (such as "morning meeting", "lunch break", etc.). Stores time in HH:mm format.
