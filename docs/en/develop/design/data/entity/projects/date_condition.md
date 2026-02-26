# DateCondition (日付条件) - date_conditions

## Overview

Entity for managing condition evaluation based on dates.

## Field Definitions

| Logical Name               | Physical Name  | Rust Type     | Description                                                | PK  | UK  | NN  | Default Value | Foreign Key | PostgreSQL Type | SQLite Type | TypeScript Type |
| -------------------------- | -------------- | ------------- | ---------------------------------------------------------- | --- | --- | --- | ------------- | ----------- | --------------- | ----------- | --------------- |
| Condition ID               | id             | String        | Unique identifier for the condition                        | ✓   | -   | ✓   | -             | -           | UUID            | TEXT        | string          |
| Relation to Reference Date | relation       | String        | Relationship to reference date (before, after, same, etc.) | -   | -   | ✓   | -             | -           | TEXT            | TEXT        | string          |
| Reference Date             | reference_date | DateTime<Utc> | Date used as comparison reference                          | -   | -   | ✓   | -             | -           | TIMESTAMPTZ     | TEXT        | string          |

## Constraints

- PRIMARY KEY: id
- NOT NULL: id, relation, reference_date

## Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_date_conditions_relation ON date_conditions(relation);
CREATE INDEX IF NOT EXISTS idx_date_conditions_reference_date ON date_conditions(reference_date);
```

## Related Tables

None

## Notes

Manages date-based condition logic. Performs condition evaluation based on relative relationships to reference dates.
