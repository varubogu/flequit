# Tag (タグ) - tags

## Overview
Label management entity for classifying tasks and subtasks within projects.

## Field Definitions

| Logical Name | Physical Name | Rust Type | Description | PK | UK | NN | Default Value | Foreign Key | PostgreSQL Type | SQLite Type | TypeScript Type |
|--------------|---------------|-----------|-------------|----|----|----|---------------|-------------|-----------------|-------------|-----------------|
| Tag ID | id | TagId | Unique tag identifier | ✓ | - | ✓ | - | - | UUID | TEXT | string |
| Project ID | project_id | ProjectId | Associated project ID | - | - | ✓ | - | projects.id | UUID | TEXT | string |
| Tag Name | name | String | Tag name | - | - | ✓ | - | - | TEXT | TEXT | string |
| Background Color | color | String | Background color (HEX color) | - | - | ✓ | "#808080" | - | TEXT | TEXT | string |
| Text Color | text_color | String | Text color (HEX color) | - | - | ✓ | "#FFFFFF" | - | TEXT | TEXT | string |
| Display Order | order_index | i32 | Display order | - | - | ✓ | 0 | - | INTEGER | INTEGER | number |
| Created At | created_at | DateTime<Utc> | Creation timestamp (ISO 8601) | - | - | ✓ | - | - | TIMESTAMPTZ | TEXT | string |
| Last Updated At | updated_at | DateTime<Utc> | Last update timestamp (ISO 8601) | - | - | ✓ | - | - | TIMESTAMPTZ | TEXT | string |

## Constraints
- PRIMARY KEY: id
- FOREIGN KEY: project_id → projects.id
- NOT NULL: id, project_id, name, color, text_color, order_index, created_at, updated_at

## Indexes
```sql
CREATE INDEX IF NOT EXISTS idx_tags_project_id ON tags(project_id);
CREATE INDEX IF NOT EXISTS idx_tags_order_index ON tags(order_index);
CREATE INDEX IF NOT EXISTS idx_tags_created_at ON tags(created_at);
```

## Related Tables
- projects: Associated project
- task_tags: Task tag associations
- subtask_tags: SubTask tag associations

## Notes
Tags belong to projects and enable visual classification in the UI through color information.
