# Entity File Template

This file is a reference template for each table definition.

## Table Name: {table_name}

### Overview
Description of the role and purpose of this table

### Field Definitions

| Logical Name | Physical Name | Rust Type | Description | PrimaryKey | Unique Key | Not Null Constraint | Default Value | Foreign Key | Postgres Type | SQLite Type | TypeScript Type |
|--------------|---------------|-----------|-------------|------------|------------|---------------------|---------------|-------------|---------------|-------------|-----------------|
| Unique Identifier | id | String | Primary key of the table | true | true | true | - | - | UUID | TEXT PRIMARY KEY | string |
| Created At | created_at | String | Record creation timestamp | false | false | true | - | - | TIMESTAMP | TEXT | string |
| Updated At | updated_at | String | Record last update timestamp | false | false | true | - | - | TIMESTAMP | TEXT | string |

### Constraints
- PRIMARY KEY: id
- UNIQUE: id
- NOT NULL: id, created_at, updated_at

### Indexes
```sql
CREATE INDEX IF NOT EXISTS idx_{table_name}_created_at ON {table_name}(created_at);
CREATE INDEX IF NOT EXISTS idx_{table_name}_updated_at ON {table_name}(updated_at);
```

### Related Tables
- List any related tables if they exist

### Notes
Add any additional design considerations or special notes
