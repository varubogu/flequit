# Settings (統合設定) - settings

## Overview

Integrated settings entity for managing all application settings. Corresponds to the frontend Settings type.

## Field Definitions

| Logical Name             | Physical Name         | Rust Type | Description                                      | PK  | UK  | NN  | Default Value   | Foreign Key | PostgreSQL Type | SQLite Type | TypeScript Type |
| ------------------------ | --------------------- | --------- | ------------------------------------------------ | --- | --- | --- | --------------- | ----------- | --------------- | ----------- | --------------- |
| Settings ID              | id                    | String    | Settings ID (usually fixed value "app_settings") | ✓   | -   | ✓   | "app_settings"  | -           | UUID            | TEXT        | string          |
| UI Theme                 | theme                 | String    | UI theme ("system", "light", "dark")             | -   | -   | ✓   | "system"        | -           | TEXT            | TEXT        | string          |
| Language Setting         | language              | String    | Language setting (ISO 639-1 format)              | -   | -   | ✓   | "ja"            | -           | TEXT            | TEXT        | string          |
| Font Name                | font                  | String    | Font name                                        | -   | -   | ✓   | "system"        | -           | TEXT            | TEXT        | string          |
| Font Size                | font_size             | i32       | Font size                                        | -   | -   | ✓   | 14              | -           | INTEGER         | INTEGER     | number          |
| Font Color               | font_color            | String    | Font color                                       | -   | -   | ✓   | "#000000"       | -           | TEXT            | TEXT        | string          |
| Background Color         | background_color      | String    | Background color                                 | -   | -   | ✓   | "#FFFFFF"       | -           | TEXT            | TEXT        | string          |
| Week Start Day           | week_start            | String    | Week start day ("sunday", "monday")              | -   | -   | ✓   | "monday"        | -           | TEXT            | TEXT        | string          |
| Timezone                 | timezone              | String    | Timezone                                         | -   | -   | ✓   | "Asia/Tokyo"    | -           | TEXT            | TEXT        | string          |
| Custom Due Days          | custom_due_days       | String    | Custom due days (JSON format)                    | -   | -   | ✓   | "[1,3,7,14,30]" | -           | TEXT            | TEXT        | number[]        |
| Last Selected Account ID | last_selected_account | String    | Last selected account ID                         | -   | -   | ✓   | ""              | -           | TEXT            | TEXT        | string          |

## Constraints

- PRIMARY KEY: id
- NOT NULL: All fields

## Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_settings_theme ON settings(theme);
CREATE INDEX IF NOT EXISTS idx_settings_language ON settings(language);
```

## Related Tables

- datetime_format: Datetime format settings (1:1)
- time_labels: Time label settings (1:N)
- due_date_buttons: Due date button settings (1:N)
- view_items: View item settings (1:N)

## Notes

Integrated settings system that manages all application settings in a single structure. Corresponds to the frontend Settings type and is designed for bulk updates in settings screens.

## Related Files

- Rust model: `src-tauri/crates/flequit-model/src/models/settings.rs`
- TypeScript type: `src/lib/types/settings.ts`
