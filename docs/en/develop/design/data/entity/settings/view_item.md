# ViewItem (ビューアイテム) - view_items

## Overview

Entity for managing UI display element settings.

## Field Definitions

| Logical Name      | Physical Name | Rust Type | Description                 | PK  | UK  | NN  | Default Value | Foreign Key | PostgreSQL Type | SQLite Type | TypeScript Type |
| ----------------- | ------------- | --------- | --------------------------- | --- | --- | --- | ------------- | ----------- | --------------- | ----------- | --------------- |
| View Item ID      | id            | String    | Unique view item identifier | ✓   | -   | ✓   | -             | -           | UUID            | TEXT        | string          |
| Display Label     | label         | String    | Display label               | -   | -   | ✓   | -             | -           | TEXT            | TEXT        | string          |
| Icon Name         | icon          | String    | Icon name                   | -   | -   | ✓   | -             | -           | TEXT            | TEXT        | string          |
| Visibility Status | visible       | bool      | Visibility status           | -   | -   | ✓   | true          | -           | BOOLEAN         | INTEGER     | boolean         |
| Display Order     | order         | i32       | Display order               | -   | -   | ✓   | 0             | -           | INTEGER         | INTEGER     | number          |

## Constraints

- PRIMARY KEY: id
- NOT NULL: id, label, icon, visible, order

## Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_view_items_visible ON view_items(visible);
CREATE INDEX IF NOT EXISTS idx_view_items_order ON view_items(order);
```

## Related Tables

None

## Notes

Used for dynamic display control of UI elements. Manages visibility and order of menus and buttons.
