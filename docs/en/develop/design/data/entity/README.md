# Entity Design Documentation

Database schema definitions and entity specifications for the Flequit application.

## Overview

This directory contains detailed specifications for all 24 tables used in Flequit as individual files.
Each file includes field definitions, constraints, indexes, and related table information in a unified format.

## Main Schemas

### 🏢 accounts - Account Management

Core schema for managing account internal identifiers and authentication provider information.
This is an internal management entity separate from user IDs, serving as the core of the authentication system.
In LocalSQLite and LocalAutomerge, this content should be completely hidden and should not be synchronized anywhere, completing only within that PC.
Also, encryption requirements are mandatory.
Encryption is only removed when using the OS authentication system.

**File Names**
LocalSQLite: ./accounts.database
LocalAutomerge: ./accounts.automerge

### 👥 users - User Information

Schema for managing public user information.
Has public identifiers that can be referenced by others and is used for project membership and task assignees.
It is OK to be referenced by others.

**File Names**
LocalSQLite: ./users.database
LocalAutomerge: ./users.automerge

### 📁 projects - Project Management

Basic entity for project management.
Functions as a parent container for tasks and members, serving as the basic unit for all task management activities.
All information necessary for project execution is aggregated within this.

**File Names**
LocalSQLite: ./projects/{project_id}.database
LocalAutomerge: ./projects/{project_id}.automerge
※ One file per project

### ⚙️ settings - General Settings

Schema for user settings.

**File Names**
LocalSQLite: ./settings.database
LocalAutomerge: ./settings.automerge

## File Structure

Each entity file is described in the following unified format:

```markdown
# Entity Name (Japanese Name) - Table Name

## Overview

Description of the entity's role and purpose

## Field Definitions

Field definition table (logical name, physical name, type, constraints, etc.)

## Constraints

Primary keys, foreign keys, constraint information

## Indexes

Index definitions for performance optimization

## Related Tables

Relationships with other tables

## Notes

Design considerations and special notes
```

## Type System

All entities use a unified type system:

- **ID Types**: Dedicated types (ProjectId, AccountId, UserId, etc.)
- **DateTime Types**: `DateTime<Utc>` (ISO 8601 format)
- **Optional Types**: `Option<T>` (NULL allowed)
- **String Types**: `String`
- **Numeric Types**: `i32`, `bool`

For detailed type conversion rules, refer to the type conversion table in `../data-model.md`.

## Usage

1. **Adding New Entities**: Create using the `__entity_example.md` template as reference
2. **Modifying Existing Entities**: Edit the corresponding file directly
3. **Checking Relationships**: Refer to the "Related Tables" section in each file
4. **Index Design**: Use the SQL statements in the "Indexes" section of each file

## Reference Materials

- `__entity_example.md`: Entity file creation template
- `../data-model.md`: Type conversion table and overall system specifications
- `../data-structure.md`: Automerge CRDT design specifications
