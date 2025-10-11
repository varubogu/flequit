# Project (プロジェクト) - projects

## Overview
Basic entity for project management. Functions as a parent container for tasks and members.

## Field Definitions

| Logical Name | Physical Name | Rust Type | Description | PK | UK | NN | Default Value | Foreign Key | PostgreSQL Type | SQLite Type | TypeScript Type |
|--------------|---------------|-----------|-------------|----|----|----|---------------|-------------|-----------------|-------------|-----------------|
| Project ID | id | ProjectId | Unique project identifier | ✓ | - | ✓ | - | - | UUID | TEXT | string |
| Project Name | name | String | Project name | - | - | ✓ | - | - | TEXT | TEXT | string |
| Description | description | String | Project description | - | - | - | NULL | - | TEXT | TEXT | string \| null |
| Project Color | color | String | Project color | - | - | - | NULL | - | TEXT | TEXT | string \| null |
| Display Order | order_index | i32 | Display order | - | - | ✓ | 0 | - | INTEGER | INTEGER | number |
| Archive Status | is_archived | bool | Archive status | - | - | ✓ | false | - | BOOLEAN | INTEGER | boolean |
| Status | status | String | Project status | - | - | - | NULL | - | TEXT | TEXT | string \| null |
| Owner ID | owner_id | Option<UserId> | Owner's user ID | - | - | - | NULL | users.id | UUID | TEXT | string \| null |
| Created At | created_at | DateTime<Utc> | Creation timestamp (ISO 8601) | - | - | ✓ | - | - | TIMESTAMPTZ | TEXT | string |
| Last Updated At | updated_at | DateTime<Utc> | Last update timestamp (ISO 8601) | - | - | ✓ | - | - | TIMESTAMPTZ | TEXT | string |

## Constraints
- PRIMARY KEY: id
- FOREIGN KEY: owner_id → users.id
- NOT NULL: id, name, order_index, is_archived, created_at, updated_at

## Indexes
```sql
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_order_index ON projects(order_index);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);
```

## Related Tables
- task_lists: Associated task lists
- tasks: Associated tasks
- tags: Project tags
- members: Project members

## Notes
Projects are the basic unit for all task management activities and serve as boundaries for membership and access control.
