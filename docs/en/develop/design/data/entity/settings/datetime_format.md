# DateTimeFormat (統合日時フォーマット管理) - datetime_formats

## Overview

View entity for unified management of preset and custom datetime formats.

## Field Definitions

| Logical Name        | Physical Name | Rust Type | Description                                                           | PK  | UK  | NN  | Default Value | Foreign Key | PostgreSQL Type | SQLite Type | TypeScript Type |
| ------------------- | ------------- | --------- | --------------------------------------------------------------------- | --- | --- | --- | ------------- | ----------- | --------------- | ----------- | --------------- |
| Format ID           | id            | String    | Unique format identifier (UUID string or negative string for presets) | ✓   | -   | ✓   | -             | -           | TEXT            | TEXT        | string          |
| Format Display Name | name          | String    | Format display name (name users see when selecting)                   | -   | -   | ✓   | -             | -           | TEXT            | TEXT        | string          |
| Format String       | format        | String    | Actual datetime format string (chrono format)                         | -   | -   | ✓   | -             | -           | TEXT            | TEXT        | string          |
| Format Group        | group         | String    | Format group (classification like preset, custom, etc.)               | -   | -   | ✓   | -             | -           | TEXT            | TEXT        | string          |
| Display Order       | order         | i32       | Display order (for ascending sort, order in UI options)               | -   | -   | ✓   | 0             | -           | INTEGER         | INTEGER     | number          |

## Constraints

- PRIMARY KEY: id
- NOT NULL: id, name, format, group, order

## Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_datetime_formats_group ON datetime_formats(group);
CREATE INDEX IF NOT EXISTS idx_datetime_formats_order ON datetime_formats(order);
```

## Related Tables

- app_preset_formats: Application standard presets
- custom_datetime_formats: User-defined custom formats

## Notes

View table for unified management of presets (negative IDs) and custom formats (UUID string IDs). Used for centralizing UI options.
