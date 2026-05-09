# Settings Entity Definitions

Entities related to application settings and settings UI. See `_template.md` for the common format.

## Settings — settings

**Role**: Integrated entity holding all application settings. Assumes bulk updates from the settings screen. `id` is normally the fixed value `"app_settings"`.

### Fields

| Logical name | Physical name | Rust type | Constraints | Default | Description |
| --- | --- | --- | --- | --- | --- |
| Settings ID | id | String | PK, NN | "app_settings" | - |
| UI theme | theme | String | NN | "system" | "system" / "light" / "dark" |
| Language | language | String | NN | "ja" | ISO 639-1 |
| Font name | font | String | NN | "system" | - |
| Font size | font_size | i32 | NN | 14 | - |
| Font color | font_color | String | NN | "#000000" | - |
| Background color | background_color | String | NN | "#FFFFFF" | - |
| Week start | week_start | String | NN | "monday" | "sunday" / "monday" |
| Timezone | timezone | String | NN | "Asia/Tokyo" | - |
| Custom due days | custom_due_days | String | NN | "[1,3,7,14,30]" | JSON array string |
| Last selected account ID | last_selected_account | String | NN | "" | - |

### Constraints and Indexes

- PRIMARY KEY: `id`
- NOT NULL: all columns
- Indexes: `theme`, `language`

### Relations

- datetime_format (1:1), time_labels (1:N), due_date_buttons (1:N), view_items (1:N)

### Related Implementation Files

- Rust model: `src-tauri/crates/flequit-model/src/models/settings.rs`
- TypeScript type: `src/lib/types/settings.ts`

---

## DateTimeFormat — datetime_formats

**Role**: Unified view for managing preset (negative IDs) and custom (UUID) date/time formats. Centralizes UI options.

### Fields

| Logical name | Physical name | Rust type | Constraints | Default | Description |
| --- | --- | --- | --- | --- | --- |
| ID | id | String | PK, NN | - | UUID string / negative preset string |
| Display name | name | String | NN | - | UI display name |
| Format string | format | String | NN | - | chrono format |
| Group | group | String | NN | - | preset / custom, etc. |
| Display order | order | i32 | NN | 0 | Ascending |

### Constraints and Indexes

- PRIMARY KEY: `id`
- Indexes: `group`, `order`

### Relations

- app_preset_formats, custom_datetime_formats

---

## DueDateButtons — due_date_buttons

**Role**: Controls visibility of quick buttons in the due-date setting UI.

### Fields

| Logical name | Physical name | Rust type | Constraints | Default | Description |
| --- | --- | --- | --- | --- | --- |
| ID | id | String | PK, NN | - | - |
| Name | name | String | UK, NN | - | - |
| Visible flag | is_visible | bool | NN | true | - |
| Display order | display_order | i32 | NN | - | - |

### Constraints and Indexes

- PRIMARY KEY: `id` / UNIQUE: `name`
- Indexes: `(is_visible, display_order)`, `display_order`

### Notes

Default button examples: `overdue` / `today` / `tomorrow` / `three_days` / `this_week` / `this_month` / `this_quarter` / `this_year` / `this_year_end`. Visibility and default order are defined by the implementation-side seed data (`src-tauri/...`).

---

## RecurrenceRule — recurrence_rules

**Role**: Defines task/subtask recurrence execution patterns. RFC5545 (iCalendar) compatible. Shared rules can be referenced by multiple tasks.

### Fields

| Logical name | Physical name | Rust type | Constraints | Default | Description |
| --- | --- | --- | --- | --- | --- |
| ID | id | String | PK, NN | - | - |
| Unit | unit | String | NN | - | day / week / month, etc. |
| Interval | interval_value | i32 | NN | 1 | - |
| End date | end_date | Option\<DateTime\<Utc\>\> | - | NULL | - |
| Count | count | Option\<i32\> | - | NULL | - |
| Weekday specification | by_weekday | Option\<String\> | - | NULL | Comma-separated |
| Month-day specification | by_monthday | Option\<String\> | - | NULL | Comma-separated |
| Year-day specification | by_yearday | Option\<String\> | - | NULL | Comma-separated |
| Month specification | by_month | Option\<String\> | - | NULL | Comma-separated |
| Created at | created_at | DateTime\<Utc\> | NN | - | - |
| Updated at | updated_at | DateTime\<Utc\> | NN | - | - |

### Constraints and Indexes

- PRIMARY KEY: `id`
- Indexes: `unit`, `created_at`

### Relations

- task_recurrences, subtask_recurrences

---

## RecurrenceDetails — recurrence_details

**Role**: Detailed recurrence rule conditions, such as end-of-month or third Tuesday.

### Fields

| Logical name | Physical name | Rust type | Constraints | Default | Description |
| --- | --- | --- | --- | --- | --- |
| ID | id | String | PK, NN | - | - |
| Specific day of month | specific_date | Option\<i32\> | - | NULL | 1-31 |
| Week of period | week_of_period | Option\<String\> | - | NULL | First week / last week, etc. |
| Weekday of week | weekday_of_week | Option\<String\> | - | NULL | - |

### Constraints and Indexes

- PRIMARY KEY: `id`
- Indexes: `specific_date`, `week_of_period`

### Relations

- recurrence_rules

---

## TimeLabel — time_labels

**Role**: Semantic labels for times, such as standup or lunch break.

### Fields

| Logical name | Physical name | Rust type | Constraints | Default | Description |
| --- | --- | --- | --- | --- | --- |
| ID | id | String | PK, NN | - | - |
| Name | name | String | NN | - | - |
| Time | time | String | NN | - | HH:mm |

### Constraints and Indexes

- PRIMARY KEY: `id`
- Indexes: `time`, `name`

---

## ViewItem — view_items

**Role**: Controls UI display elements such as menus and buttons.

### Fields

| Logical name | Physical name | Rust type | Constraints | Default | Description |
| --- | --- | --- | --- | --- | --- |
| ID | id | String | PK, NN | - | - |
| Display label | label | String | NN | - | - |
| Icon name | icon | String | NN | - | - |
| Visible state | visible | bool | NN | true | - |
| Display order | order | i32 | NN | 0 | - |

### Constraints and Indexes

- PRIMARY KEY: `id`
- Indexes: `visible`, `order`
