# Member (メンバー) - members

## Overview
Related entity for managing user participation status and permissions in projects.

## Field Definitions

| Logical Name | Physical Name | Rust Type | Description | PK | UK | NN | Default Value | Foreign Key | PostgreSQL Type | SQLite Type | TypeScript Type |
|--------------|---------------|-----------|-------------|----|----|----|---------------|-------------|-----------------|-------------|-----------------|
| Project ID | project_id | ProjectId | Project ID | ✓ | - | ✓ | - | projects.id | UUID | TEXT | string |
| User ID | user_id | UserId | Member's user ID | ✓ | - | ✓ | - | users.id | UUID | TEXT | string |
| Role | role | String | Permission role | - | - | ✓ | "Member" | - | TEXT | TEXT | string |
| Joined At | joined_at | DateTime<Utc> | Join timestamp (ISO 8601) | - | - | ✓ | - | - | TIMESTAMPTZ | TEXT | string |
| Last Updated At | updated_at | DateTime<Utc> | Last update timestamp (ISO 8601) | - | - | ✓ | - | - | TIMESTAMPTZ | TEXT | string |

## Constraints
- PRIMARY KEY: (project_id, user_id)
- FOREIGN KEY: project_id → projects.id
- FOREIGN KEY: user_id → users.id
- NOT NULL: project_id, user_id, role, joined_at, updated_at

## Indexes
```sql
CREATE INDEX IF NOT EXISTS idx_members_project_id ON members(project_id);
CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_role ON members(role);
CREATE INDEX IF NOT EXISTS idx_members_joined_at ON members(joined_at);
```

## Related Tables
- projects: Associated project
- users: Member user

## Notes
Manages many-to-many relationship between projects and users. Uniqueness guaranteed by composite primary key.
