# Account and User Entity Definitions

Manages authentication accounts and public user information. See `_template.md` for the common format.

## Account — accounts

**Role**: Internal account identifier and authentication provider information. `AccountId` is an internal ID that must not be referenced by others. It is separate from `UserId` (`users.id`).

### Fields

| Logical name | Physical name | Rust type | Constraints | Default | Foreign key | Description |
| --- | --- | --- | --- | --- | --- | --- |
| Account ID | id | AccountId | PK, NN | - | - | Internal identifier (private) |
| User ID | user_id | UserId | NN | - | users.id | Public identifier |
| Email | email | Option\<String\> | - | NULL | - | - |
| Display name | display_name | Option\<String\> | - | NULL | - | Provided by provider |
| Avatar URL | avatar_url | Option\<String\> | - | NULL | - | - |
| Provider | provider | String | NN | - | - | Authentication provider name |
| Provider ID | provider_id | Option\<String\> | - | NULL | - | Provider-side ID |
| Active state | is_active | bool | NN | true | - | - |
| Created at | created_at | DateTime\<Utc\> | NN | - | - | - |
| Updated at | updated_at | DateTime\<Utc\> | NN | - | - | - |

### Constraints and Indexes

- PRIMARY KEY: `id`
- FOREIGN KEY: `user_id -> users.id`
- NOT NULL: `id, user_id, provider, is_active, created_at, updated_at`
- Indexes: `user_id`, `provider`, `created_at`

### Relations

- users (public user information)

### Notes

`AccountId` is an internal management ID that is never referenced by others. In LocalSQLite / LocalAutomerge it is fully hidden and remains local to the PC. Encryption is only unlocked when integrating with OS authentication.

---

## User — users

**Role**: Public user information. `UserId` can be referenced by others and is used for project members and task assignees.

### Fields

| Logical name | Physical name | Rust type | Constraints | Default | Foreign key | Description |
| --- | --- | --- | --- | --- | --- | --- |
| User ID | id | UserId | PK, NN | - | - | Public identifier |
| Username | username | String | UK, NN | - | - | - |
| Display name | display_name | Option\<String\> | - | NULL | - | - |
| Email | email | Option\<String\> | - | NULL | - | - |
| Avatar URL | avatar_url | Option\<String\> | - | NULL | - | - |
| Bio | bio | Option\<String\> | - | NULL | - | - |
| Timezone | timezone | Option\<String\> | - | NULL | - | - |
| Active state | is_active | bool | NN | true | - | - |
| Created at | created_at | DateTime\<Utc\> | NN | - | - | - |
| Updated at | updated_at | DateTime\<Utc\> | NN | - | - | - |

### Constraints and Indexes

- PRIMARY KEY: `id` / UNIQUE: `username`
- NOT NULL: `id, username, is_active, created_at, updated_at`
- Indexes: `username` (UNIQUE), `created_at`

### Relations

- accounts (internal account), members (project participation), task_assignments, subtask_assignments
