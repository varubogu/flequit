# User (ユーザー) - users

## Overview

Table for managing public user information. Has public identifiers that can be referenced by others.

## Field Definitions

| Logical Name    | Physical Name | Rust Type     | Description                                   | PK  | UK  | NN  | Default Value | Foreign Key | PostgreSQL Type | SQLite Type | TypeScript Type |
| --------------- | ------------- | ------------- | --------------------------------------------- | --- | --- | --- | ------------- | ----------- | --------------- | ----------- | --------------- |
| User ID         | id            | UserId        | Public user identifier (referenced by others) | ✓   | -   | ✓   | -             | -           | UUID            | TEXT        | string          |
| Username        | username      | String        | Username                                      | -   | ✓   | ✓   | -             | -           | TEXT            | TEXT        | string          |
| Display Name    | display_name  | String        | Display name                                  | -   | -   | -   | NULL          | -           | TEXT            | TEXT        | string \| null  |
| Email Address   | email         | String        | Email address                                 | -   | -   | -   | NULL          | -           | TEXT            | TEXT        | string \| null  |
| Avatar URL      | avatar_url    | String        | Avatar URL                                    | -   | -   | -   | NULL          | -           | TEXT            | TEXT        | string \| null  |
| Bio             | bio           | String        | Self-introduction                             | -   | -   | -   | NULL          | -           | TEXT            | TEXT        | string \| null  |
| Timezone        | timezone      | String        | Timezone                                      | -   | -   | -   | NULL          | -           | TEXT            | TEXT        | string \| null  |
| Active Status   | is_active     | bool          | Active status                                 | -   | -   | ✓   | true          | -           | BOOLEAN         | INTEGER     | boolean         |
| Created At      | created_at    | DateTime<Utc> | Creation timestamp (ISO 8601)                 | -   | -   | ✓   | -             | -           | TIMESTAMPTZ     | TEXT        | string          |
| Last Updated At | updated_at    | DateTime<Utc> | Last update timestamp (ISO 8601)              | -   | -   | ✓   | -             | -           | TIMESTAMPTZ     | TEXT        | string          |

## Constraints

- PRIMARY KEY: id
- UNIQUE: username
- NOT NULL: id, username, is_active, created_at, updated_at

## Indexes

```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
```

## Related Tables

- accounts: Account internal management information
- members: Project membership
- task_assignments: Task assignee associations
- subtask_assignments: SubTask assignee associations

## Notes

Public user identifier (UserId) can be referenced by others and is used for project members and task assignees.
