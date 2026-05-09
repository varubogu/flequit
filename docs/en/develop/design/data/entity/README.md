# Entity Design Documents

Database schema definitions and entity specifications for the Flequit application.

## File Structure

| File | Content |
| --- | --- |
| [`_template.md`](./_template.md) | Entity documentation template (format definition) |
| [`accounts-and-users.md`](./accounts-and-users.md) | `accounts`, `users` |
| [`projects.md`](./projects.md) | `projects`, `task_lists`, `tasks`, `subtasks`, `tags`, `tag_bookmarks`, `members`, `task_assignments`, `subtask_assignments`, `task_tags`, `subtask_tags`, `task_recurrences`, `subtask_recurrences`, `date_conditions`, `weekday_conditions` |
| [`settings.md`](./settings.md) | `settings`, `datetime_formats`, `due_date_buttons`, `recurrence_rules`, `recurrence_details`, `time_labels`, `view_items` |
| [`user-preferences.md`](./user-preferences.md) | `user_tag_bookmarks` (personal user setting) |

## Major Schema Categories

### accounts — Account Management

`AccountId` is an internal identifier and cannot be referenced by others. It is separate from `UserId`. In LocalSQLite/LocalAutomerge it is fully hidden, remains local to the PC, and must be encrypted.

- Physical file: `./accounts.database` / `./accounts.automerge`

### users — User Information

Has the public identifier `UserId`. Used for project members and task assignees.

- Physical file: `./users.database` / `./users.automerge`

### projects — Project Management

Aggregates all information required to run a project. One file per project.

- Physical file: `./projects/{project_id}.database` / `./projects/{project_id}.automerge`

### settings — General Settings

Application-wide settings.

- Physical file: `./settings.database` / `./settings.automerge`

## Type System

| Kind | Example |
| --- | --- |
| ID type | `ProjectId`, `AccountId`, `UserId`, etc. (dedicated types) |
| Date/time | `DateTime<Utc>` (ISO 8601) |
| Optional | `Option<T>` (nullable) |
| String / number | `String`, `i32`, `bool` |

See [`../data-model.md`](../data-model.md) for detailed type conversion rules.

## Design Policy

- Each entity document only includes field definitions, constraints, indexed columns, relations, and short notes when needed.
- SQL DDL, Sea-ORM code, TypeScript interfaces, and Rust service code are **not included** in this document set. The canonical implementation is `src-tauri/crates/flequit-infrastructure-sqlite/`.
- When adding a new entity, follow `_template.md` and add it to the relevant consolidated file.
