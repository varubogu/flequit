# Data Model Specification

## Overview

This document defines the data models used in the Flequit application and type conversion rules.

## Type System and Conversion Rules

### Type Conversion Table

Flequit performs type conversions between different layers. Each data type is managed according to the following conversion table:

| Rust Internal Type | TypeScript/Frontend | SQLite    | PostgreSQL    | Automerge JSON | Description                                    |
| ------------------ | ------------------- | --------- | ------------- | -------------- | ---------------------------------------------- |
| `ProjectId`        | `string`            | `TEXT`    | `UUID`        | `string`       | Project unique identifier (UUID v4)            |
| `AccountId`        | `string`            | `TEXT`    | `UUID`        | `string`       | Account internal identifier (UUID v4, private) |
| `UserId`           | `string`            | `TEXT`    | `UUID`        | `string`       | User identifier (UUID v4, public)              |
| `TaskId`           | `string`            | `TEXT`    | `UUID`        | `string`       | Task unique identifier (UUID v4)               |
| `TaskListId`       | `string`            | `TEXT`    | `UUID`        | `string`       | Task list unique identifier (UUID v4)          |
| `TagId`            | `string`            | `TEXT`    | `UUID`        | `string`       | Tag unique identifier (UUID v4)                |
| `SubTaskId`        | `string`            | `TEXT`    | `UUID`        | `string`       | Subtask unique identifier (UUID v4)            |
| `DateTime<Utc>`    | `string`            | `TEXT`    | `TIMESTAMPTZ` | `string`       | ISO 8601 format datetime string                |
| `Option<T>`        | `T \| null`         | `NULL`    | `NULL`        | `null`         | Optional value                                 |
| `String`           | `string`            | `TEXT`    | `TEXT`        | `string`       | String                                         |
| `i32`              | `number`            | `INTEGER` | `INTEGER`     | `number`       | 32-bit integer                                 |
| `bool`             | `boolean`           | `INTEGER` | `BOOLEAN`     | `boolean`      | Boolean (SQLite stores as 0/1)                 |
| Enum Type          | `string`            | `TEXT`    | `TEXT`        | `string`       | Enumeration type (stored as string)            |

### Notes

- **UUID Format**: All IDs follow `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx` format
- **Datetime Format**: `YYYY-MM-DDTHH:mm:ss.sssZ` (UTC)
- **SQLite Boolean**: `true`=1, `false`=0
- **Optional Values**: `null`/`NULL` when not set

## UTC Policy

All datetime data in the application must follow this policy:

### Internal Data (Always UTC)

- **Rust models**: All fields use `DateTime<Utc>` from the chrono crate
- **SQLite storage**: All TIMESTAMP columns stored as UTC ISO 8601 strings (`YYYY-MM-DDTHH:mm:ss.sssZ`)
- **Automerge CRDT**: All datetime fields stored as UTC ISO 8601 strings
- **IPC layer (Tauri)**: `DateTime<Utc>` serialized as UTC ISO 8601 strings
- **Date-only convention**: Date-only values are stored as UTC midnight (`T00:00:00Z`)

### Display Layer (User's Timezone)

- All datetimes displayed to users must be converted to the user's effective timezone
- Source of user timezone: `generalSettingsStore.effectiveTimezone` (falls back to system timezone when set to `'system'`)
- Formatting utilities accept a `timezone: string` parameter (default: system timezone via `Intl.DateTimeFormat().resolvedOptions().timeZone`)
- Components must obtain the timezone from `generalSettingsStore.effectiveTimezone` and pass it to formatting functions

### Test Rules

- All date strings must include the `Z` suffix to make UTC intent explicit: `new Date('2025-01-15T12:00:00Z')`
- Tests must pass `'UTC'` explicitly as the timezone parameter when testing formatting functions: `formatDate(date, 'UTC')`

## Entity Definitions

Refer to `./entity/*.md`
