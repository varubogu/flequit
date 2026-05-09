# Entity Definition Template

Common format for documenting each entity in the consolidated entity documents (`projects.md` / `settings.md` / `accounts-and-users.md` / `user-preferences.md`).

## Entity Sections

```markdown
## {EntityName} (English name) — {table_name}

**Role**: 1-2 line overview

### Fields

| Logical name | Physical name | Type (Rust) | Constraints | Default | Foreign key | Description |
| --- | --- | --- | --- | --- | --- | --- |
| ... | ... | ... | PK/UK/NN | ... | ... | ... |

### Constraints

- PRIMARY KEY: ...
- FOREIGN KEY: ...
- NOT NULL: ...
- UNIQUE: ... (when applicable)

### Indexed Columns

`column_a`, `column_b` (SQL statements are canonical in implementation-side migrations under `src-tauri/...`)

### Relations

- Related table name: overview

### Notes (optional)

- Add only 1-3 lines of design-specific notes when needed
```

## Naming and Type Guide

- ID types: dedicated types (`ProjectId`, `TaskId`, etc.)
- Date/time type: `DateTime<Utc>` (ISO 8601)
- Optional: `Option<T>` (nullable)
- Numbers: `i32`; booleans: `bool`; strings: `String`
- TS type mapping: `Option<T>` -> `T | null`, `DateTime<Utc>` -> `string` (ISO 8601)

See `../data-model.md` for detailed type conversion rules.

## SQL and Code Example Policy

- **Do not include them**. SQL DDL, Sea-ORM code, TypeScript interfaces, and Rust service code do not belong in these documents.
- Refer to canonical implementation sources such as `src-tauri/crates/flequit-infrastructure-sqlite/`.
