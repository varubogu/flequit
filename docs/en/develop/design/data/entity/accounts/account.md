# Account (アカウント) - accounts

## Overview
Table for managing account internal identifiers and authentication provider information. This is an internal management entity separate from user IDs.

## Field Definitions

| Logical Name | Physical Name | Rust Type | Description | PK | UK | NN | Default Value | Foreign Key | PostgreSQL Type | SQLite Type | TypeScript Type |
|--------------|---------------|-----------|-------------|----|----|----|---------------|-------------|-----------------|-------------|-----------------|
| Account ID | id | AccountId | Account internal identifier (private) | ✓ | - | ✓ | - | - | UUID | TEXT | string |
| User ID | user_id | UserId | Public user identifier (referenced by others) | - | - | ✓ | - | users.id | UUID | TEXT | string |
| Email Address | email | String | Email address | - | - | - | NULL | - | TEXT | TEXT | string \| null |
| Display Name | display_name | String | Display name provided by provider | - | - | - | NULL | - | TEXT | TEXT | string \| null |
| Avatar URL | avatar_url | String | Profile image URL | - | - | - | NULL | - | TEXT | TEXT | string \| null |
| Provider | provider | String | Authentication provider name | - | - | ✓ | - | - | TEXT | TEXT | string |
| Provider ID | provider_id | String | Provider-side user ID | - | - | - | NULL | - | TEXT | TEXT | string \| null |
| Active Status | is_active | bool | Account active status | - | - | ✓ | true | - | BOOLEAN | INTEGER | boolean |
| Created At | created_at | DateTime<Utc> | Creation timestamp (ISO 8601) | - | - | ✓ | - | - | TIMESTAMPTZ | TEXT | string |
| Last Updated At | updated_at | DateTime<Utc> | Last update timestamp (ISO 8601) | - | - | ✓ | - | - | TIMESTAMPTZ | TEXT | string |

## Constraints
- PRIMARY KEY: id
- FOREIGN KEY: user_id → users.id
- NOT NULL: id, user_id, provider, is_active, created_at, updated_at

## Indexes
```sql
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_provider ON accounts(provider);
CREATE INDEX IF NOT EXISTS idx_accounts_created_at ON accounts(created_at);
```

## Related Tables
- users: Association with public user information

## Notes
The account internal identifier (AccountId) is an internal management ID that cannot be referenced by others and is clearly separated from the public user identifier (UserId).
