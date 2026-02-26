# Tag Bookmark (タグブックマーク) - tag_bookmarks

## Overview

Entity for managing tags fixed in the sidebar. Managed with (project_id, tag_id) pairs to display bookmarked tags across projects in a list.

## Field Definitions

| Logical Name  | Physical Name | Rust Type     | Description                            | PK  | UK  | NN  | Default Value | Foreign Key | PostgreSQL Type | SQLite Type | TypeScript Type |
| ------------- | ------------- | ------------- | -------------------------------------- | --- | --- | --- | ------------- | ----------- | --------------- | ----------- | --------------- |
| Project ID    | project_id    | ProjectId     | Tag's associated project ID            | ✓   | -   | ✓   | -             | projects.id | UUID            | TEXT        | string          |
| Tag ID        | tag_id        | TagId         | Tag ID to bookmark                     | ✓   | -   | ✓   | -             | tags.id     | UUID            | TEXT        | string          |
| Display Order | order_index   | i32           | Display order within sidebar           | -   | -   | ✓   | 0             | -           | INTEGER         | INTEGER     | number          |
| Created At    | created_at    | DateTime<Utc> | Bookmark addition timestamp (ISO 8601) | -   | -   | ✓   | -             | -           | TIMESTAMPTZ     | TEXT        | string          |

## Constraints

- PRIMARY KEY: (project_id, tag_id) - Composite primary key
- FOREIGN KEY: project_id → projects.id
- FOREIGN KEY: tag_id → tags.id
- NOT NULL: project_id, tag_id, order_index, created_at

## Indexes

```sql
-- Automatically created by composite primary key: (project_id, tag_id)
CREATE INDEX IF NOT EXISTS idx_tag_bookmarks_order_index ON tag_bookmarks(order_index);
CREATE INDEX IF NOT EXISTS idx_tag_bookmarks_created_at ON tag_bookmarks(created_at);
```

## Related Tables

- projects: Project to which the tag belongs
- tags: Tag to be bookmarked

## Important Design Principles

### Why (project_id, tag_id) Pairs are Required

1. **Tags Belong to Projects**
   - project_id always exists in tags table
   - Same tag_id may exist in different projects (theoretically zero UUID collision, but for design clarity)
   - project_id is mandatory for identification

2. **Cross-Project Display**
   - Sidebar displays bookmarked tags from multiple projects mixed together
   - project_id is required to identify which project the tag belongs to

3. **Data Integrity**
   - tag_id alone cannot determine which project the tag belongs to
   - FOREIGN KEY constraints ensure integrity with tags table

### About Display Order (order_index)

- Used for drag & drop reordering within sidebar
- Manages order across projects
- Sequential numbers starting from 0

## TypeScript Type Definition

```typescript
interface TagBookmark {
  projectId: string; // Required
  tagId: string; // Required
  orderIndex: number;
  createdAt: Date;
}

// Store management
class TagBookmarkStore {
  // Managed with Map<tagId, projectId>
  bookmarkedTags = $state<Map<string, string>>(new Map());

  addBookmark(projectId: string, tagId: string) {
    this.bookmarkedTags.set(tagId, projectId);
  }

  getProjectIdByTagId(tagId: string): string | undefined {
    return this.bookmarkedTags.get(tagId);
  }

  isBookmarked(tagId: string): boolean {
    return this.bookmarkedTags.has(tagId);
  }
}
```

## Service Usage Example

```typescript
// TagService
async addBookmark(projectId: string, tagId: string) {
  // projectId is a required parameter
  await tagStoreFacade.addBookmark(projectId, tagId);
}

async updateTag(projectId: string, tagId: string, updates: Partial<Tag>) {
  // projectId is required for all tag operations
}

async deleteTag(projectId: string, tagId: string, onDelete?: (tagId: string) => void) {
  // projectId is also needed for deletion
}
```

## Notes

### General Principle: projectId Required Rule

**For all operations requiring ID-type parameters (taskListId, taskId, subTaskId, tagId, associations), projectId is also required as a set**

Reasons:

1. All entities belong to projects
2. Prevents ID collisions when handling data across projects
3. projectId can be obtained from tasks (reverse lookup possible)

Applied to:

- Tag CRUD operations
- Tag bookmarking
- Task tagging
- SubTask tagging
- All other entity operations

Exceptions:

- Reverse lookup from project ID: `getProjectIdByTagId(tagId)` etc. are exceptions where projectId is not required
