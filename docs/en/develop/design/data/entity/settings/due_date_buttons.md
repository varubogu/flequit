# DueDateButtons (期日ボタン) - due_date_buttons

## Overview

Entity for managing quick button display control in due date setting UI.

## Field Definitions

| Logical Name    | Physical Name | Rust Type | Description          | PK  | UK  | NN  | Default Value | Foreign Key | PostgreSQL Type | SQLite Type | TypeScript Type |
| --------------- | ------------- | --------- | -------------------- | --- | --- | --- | ------------- | ----------- | --------------- | ----------- | --------------- |
| ID              | id            | String    | Due date button ID   | ✓   | -   | ✓   | -             | -           | UUID            | TEXT        | string          |
| Name            | name          | String    | Due date button name | -   | -   | ✓   | -             | -           | VARCHAR(50)     | TEXT        | string          |
| Visibility Flag | is_visible    | bool      | Show/hide control    | -   | -   | ✓   | true          | -           | BOOLEAN         | INTEGER     | boolean         |
| Order           | display_order | i32       | Display order        | -   | -   | ✓   | -             | -           | INTEGER         | INTEGER     | number          |

## Constraints

- PRIMARY KEY: id
- UNIQUE KEY: name
- NOT NULL: id, name, is_visible, display_order

## Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_due_date_buttons_visible_order ON due_date_buttons(is_visible, display_order);
CREATE INDEX IF NOT EXISTS idx_due_date_buttons_display_order ON due_date_buttons(display_order);
```

## Related Tables

None

## Notes

Controls show/hide of quick buttons in due date setting screen. Display items can be customized based on user usage frequency.

## Default Data Example

```sql
INSERT INTO due_date_buttons (id, name, is_visible, display_order) VALUES
('overdue', '期限切れ', false, 1),
('today', '今日', true, 2),
('tomorrow', '明日', true, 3),
('three_days', '3日以内', true, 4),
('this_week', '今週', true, 5),
('this_month', '今月', true, 6),
('this_quarter', '今四半期', false, 7),
('this_year', '今年', false, 8),
('this_year_end', '年末', false, 9);
```
