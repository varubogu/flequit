# User Preference Entity Definitions

Entities managed as personal user settings and synchronized across multiple devices for the same user. See `_template.md` for the common format.

## TagBookmark (user setting) — user_tag_bookmarks

**Role**: Manages tags pinned in the sidebar. Managed as a **personal user setting** and synchronized across multiple devices for the same user (not shared with the team).

- **Category**: `user_preferences`
- **Sync target**: other devices for the same user only
- **Automerge document path**: `/user_preferences/{user_id}/tag_bookmarks/{project_id}/{tag_id}`

### Fields

| Logical name | Physical name | Rust type | Constraints | Default | Foreign key | Description |
| --- | --- | --- | --- | --- | --- | --- |
| ID | id | TagBookmarkId | PK, NN | UUID generation | - | - |
| User ID | user_id | UserId | UK, NN | "local_user" | - | Currently fixed |
| Project ID | project_id | ProjectId | UK, NN | - | projects.id | - |
| Tag ID | tag_id | TagId | UK, NN | - | tags.id | - |
| Display order | order_index | i32 | NN | 0 | - | Within sidebar |
| Created at | created_at | DateTime\<Utc\> | NN | - | - | - |
| Updated at | updated_at | DateTime\<Utc\> | NN | - | - | - |

### Constraints and Indexes

- PRIMARY KEY: `id`
- UNIQUE: `(user_id, project_id, tag_id)` — prevents duplicate bookmarks for the same tag
- FOREIGN KEY: `project_id -> projects.id (ON DELETE CASCADE)`
- NOT NULL: all columns
- Indexes: `(user_id, project_id, order_index)`, `tag_id`

### Relations

- projects, tags

### Key Design Principles

#### 1. Managed as User Preferences

Tag bookmarks are a **personal user workspace**, not an attribute of the tag itself. Reasons:

- Different users bookmark different tags (personal workspace)
- Bookmarks are not shared between project members (outside team sharing)
- Each user keeps their own ordering
- The same user has the same bookmark state on other devices (cross-device sync)

Putting a personal setting such as `is_bookmarked` on the `Tag` entity is incorrect. Bookmarks are managed as an independent entity.

#### 2. Project Scope

Because tags belong to projects, bookmarks also keep `project_id`. This allows different tags to be managed across projects.

#### 3. Display Order (`order_index`)

- Can be reordered by drag and drop in the sidebar
- Manages ordering across projects
- Zero-based sequential numbers

### Note: Required `projectId` Rule for All Entities

Any operation that needs ID parameters (`taskListId`, `taskId`, `subTaskId`, `tagId`, and association IDs) must also receive `projectId`. Reasons:

1. All entities belong to a project
2. When handling data across projects, this prevents ID collisions
3. `projectId` can be obtained from a task (reverse lookup is possible)

Exception: reverse-lookup-only methods such as `getProjectIdByTagId(tagId)` do not need `projectId`.
