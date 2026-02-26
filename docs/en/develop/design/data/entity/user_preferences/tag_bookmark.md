# Tag Bookmark - user_tag_bookmarks

## Overview

Entity for managing tags pinned to the sidebar. Managed as **user settings** and synchronized across the same user's multiple devices.

## Category

- **Classification**: `user_preferences`
- **Sync Target**: Same user's other devices only
- **Automerge Document**: `/user_preferences/{user_id}/tag_bookmarks/{project_id}/{tag_id}`

## Field Definitions

| Logical Name  | Physical Name | Rust Type     | Description                       | PK  | UK  | NN  | Default      | Foreign Key | PostgreSQL  | SQLite  | TypeScript |
| ------------- | ------------- | ------------- | --------------------------------- | --- | --- | --- | ------------ | ----------- | ----------- | ------- | ---------- |
| ID            | id            | TagBookmarkId | Bookmark ID                       | ✓   | -   | ✓   | UUID         | -           | UUID        | TEXT    | string     |
| User ID       | user_id       | UserId        | User ID (currently fixed)         | -   | ✓   | ✓   | "local_user" | -           | UUID        | TEXT    | string     |
| Project ID    | project_id    | ProjectId     | Project the tag belongs to        | -   | ✓   | ✓   | -            | projects.id | UUID        | TEXT    | string     |
| Tag ID        | tag_id        | TagId         | Tag to bookmark                   | -   | ✓   | ✓   | -            | tags.id     | UUID        | TEXT    | string     |
| Display Order | order_index   | i32           | Display order in sidebar          | -   | -   | ✓   | 0            | -           | INTEGER     | INTEGER | number     |
| Created At    | created_at    | DateTime<Utc> | Bookmark creation time (ISO 8601) | -   | -   | ✓   | -            | -           | TIMESTAMPTZ | TEXT    | Date       |
| Updated At    | updated_at    | DateTime<Utc> | Bookmark update time (ISO 8601)   | -   | -   | ✓   | -            | -           | TIMESTAMPTZ | TEXT    | Date       |

## Constraints

- **PRIMARY KEY**: `id`
- **UNIQUE KEY**: `(user_id, project_id, tag_id)` - Prevent duplicate bookmarks
- **FOREIGN KEY**: `project_id` → `projects.id` (ON DELETE CASCADE)
- **NOT NULL**: `id`, `user_id`, `project_id`, `tag_id`, `order_index`, `created_at`, `updated_at`

## Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_user_tag_bookmarks_user_project
  ON user_tag_bookmarks(user_id, project_id, order_index);

CREATE INDEX IF NOT EXISTS idx_user_tag_bookmarks_tag
  ON user_tag_bookmarks(tag_id);
```

## SQLite Table Definition

```sql
CREATE TABLE user_tag_bookmarks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'local_user',
    project_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    UNIQUE(user_id, project_id, tag_id)
);

CREATE INDEX idx_user_tag_bookmarks_user_project
    ON user_tag_bookmarks(user_id, project_id, order_index);
CREATE INDEX idx_user_tag_bookmarks_tag
    ON user_tag_bookmarks(tag_id);
```

## Automerge Document Structure

```javascript
{
  "user_preferences": {
    "local_user": {  // user_id
      "tag_bookmarks": {
        "project-uuid-1": {  // project_id
          "tag-uuid-1": {    // tag_id
            "id": "bookmark-uuid-1",
            "project_id": "project-uuid-1",
            "tag_id": "tag-uuid-1",
            "order_index": 0,
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-01-01T00:00:00Z"
          },
          "tag-uuid-2": { ... }
        },
        "project-uuid-2": { ... }
      }
    }
  }
}
```

## Related Tables

- **projects**: Project the tag belongs to
- **tags**: Tags to be bookmarked

## Important Design Principles

### 1. Management as User Settings

**Important**: Tag bookmarks are **user's personal settings**, not attributes of the tag itself.

#### Reasons

1. **Personal workspace**: Different users bookmark different tags
2. **Not team-shared**: Not shared among project members
3. **Order management**: Each user maintains different order
4. **Cross-device sync**: Same bookmark state on user's other devices

#### Wrong Design Example

```typescript
// ❌ Bad: Including personal settings in Tag entity
interface Tag {
  id: string;
  name: string;
  isBookmarked: boolean; // This is personal setting
}
```

```typescript
// ✅ Good: Separated entity
interface Tag {
  id: string;
  name: string;
  // No bookmark info
}

interface TagBookmark {
  id: string;
  userId: string;
  projectId: string;
  tagId: string;
  orderIndex: number;
}
```

### 2. Project Scope

Since tags belong to projects, bookmarks also have project IDs:

```typescript
// Can bookmark different tags per project
const bookmarks = [
  { userId: 'user1', projectId: 'proj1', tagId: 'tag-urgent' },
  { userId: 'user1', projectId: 'proj2', tagId: 'tag-important' }
];
```

### 3. Display Order Management

- Used for drag & drop reordering in sidebar
- Manages cross-project order
- `order_index` starts from 0

#### Reordering Algorithm

```typescript
// Move tag to dropped position
function reorderBookmark(
  bookmarks: TagBookmark[],
  fromIndex: number,
  toIndex: number
): TagBookmark[] {
  const [moved] = bookmarks.splice(fromIndex, 1);
  bookmarks.splice(toIndex, 0, moved);

  // Update order_index
  return bookmarks.map((b, index) => ({
    ...b,
    orderIndex: index,
    updatedAt: new Date()
  }));
}
```

## TypeScript Type Definitions

```typescript
// Entity definition
interface TagBookmark {
  id: string;
  userId: string;
  projectId: string;
  tagId: string;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

// Store management
class TagBookmarkStore {
  bookmarks = $state<TagBookmark[]>([]);

  // Filter by project ID
  getByProject(projectId: string): TagBookmark[] {
    return this.bookmarks
      .filter((b) => b.projectId === projectId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  // Check if tag is bookmarked
  isBookmarked(projectId: string, tagId: string): boolean {
    return this.bookmarks.some((b) => b.projectId === projectId && b.tagId === tagId);
  }
}
```

## Service Usage Examples

### TypeScript

```typescript
// TagBookmarkService
class TagBookmarkService {
  // Add bookmark
  async addBookmark(projectId: string, tagId: string): Promise<void> {
    const userId = getCurrentUserId(); // "local_user"
    const maxOrder = await this.getMaxOrderIndex(userId, projectId);

    const bookmark: TagBookmark = {
      id: crypto.randomUUID(),
      userId,
      projectId,
      tagId,
      orderIndex: maxOrder + 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Optimistic update
    tagBookmarkStore.addBookmark(bookmark);

    try {
      // Backend sync
      await invoke('add_tag_bookmark', { bookmark });
    } catch (error) {
      // Rollback
      tagBookmarkStore.removeBookmark(bookmark.id);
      throw error;
    }
  }

  // Remove bookmark
  async removeBookmark(projectId: string, tagId: string): Promise<void> {
    const bookmark = tagBookmarkStore.findByProjectAndTag(projectId, tagId);
    if (!bookmark) return;

    // Optimistic update
    tagBookmarkStore.removeBookmark(bookmark.id);

    try {
      await invoke('remove_tag_bookmark', {
        bookmarkId: bookmark.id
      });
    } catch (error) {
      // Rollback
      tagBookmarkStore.addBookmark(bookmark);
      throw error;
    }
  }

  // Reorder
  async reorderBookmarks(projectId: string, fromIndex: number, toIndex: number): Promise<void> {
    const bookmarks = tagBookmarkStore.getByProject(projectId);
    const reordered = reorderBookmark(bookmarks, fromIndex, toIndex);

    // Optimistic update
    tagBookmarkStore.updateBulk(reordered);

    try {
      await invoke('reorder_tag_bookmarks', {
        bookmarks: reordered
      });
    } catch (error) {
      // Rollback
      tagBookmarkStore.updateBulk(bookmarks);
      throw error;
    }
  }
}
```

### Rust

```rust
// Service layer
pub async fn add_tag_bookmark<R>(
    repositories: &R,
    user_id: &UserId,
    project_id: &ProjectId,
    tag_id: &TagId,
) -> Result<TagBookmark, ServiceError>
where
    R: InfrastructureRepositoriesTrait,
{
    // Check existence
    if let Some(_) = repositories
        .tag_bookmark()
        .find_by_user_project_tag(user_id, project_id, tag_id)
        .await?
    {
        return Err(ServiceError::AlreadyExists(
            "Tag bookmark already exists".to_string()
        ));
    }

    // Get max order_index
    let max_order = repositories
        .tag_bookmark()
        .get_max_order_index(user_id, project_id)
        .await?;

    let bookmark = TagBookmark {
        id: TagBookmarkId::new(),
        user_id: user_id.clone(),
        project_id: project_id.clone(),
        tag_id: tag_id.clone(),
        order_index: max_order + 1,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    // Save to both SQLite + Automerge
    repositories.tag_bookmark().create(&bookmark).await?;

    Ok(bookmark)
}
```

## Data Flow

### Bookmark Addition Flow

```
UI (sidebar-tag-list-controller)
  ↓ Click
TagBookmarkOperations.addBookmark(projectId, tagId)
  ↓
TagBookmarkService.addBookmark(projectId, tagId)
  ↓
1. Update local store (optimistic)
  ↓
2. Call Tauri command
  ↓
add_tag_bookmark(user_id, project_id, tag_id)
  ↓
Parallel execution:
  ├─ SQLite: INSERT into user_tag_bookmarks
  └─ Automerge: /user_preferences/{user_id}/tag_bookmarks/{project_id}/{tag_id}
  ↓
Success or rollback on error
```

### Initialization Flow (App Startup)

```
App starts
  ↓
TagBookmarkService.initializeBookmarks()
  ↓
Tauri command: list_tag_bookmarks(user_id)
  ↓
Load from SQLite (fast)
  ↓
TagBookmarkStore.setBookmarks(bookmarks)
  ↓
Reflect in UI
  ↓
(Background) Sync with Automerge
```

## Migration

### Migration from Existing Data

No migration needed as current implementation has no persisted data.

If future implementation has `Tag.is_bookmarked`:

```sql
-- Migration SQL (reference)
INSERT INTO user_tag_bookmarks (id, user_id, project_id, tag_id, order_index, created_at, updated_at)
SELECT
    lower(hex(randomblob(16))),
    'local_user',
    project_id,
    id,
    0,  -- Reset order_index later
    created_at,
    datetime('now')
FROM tags
WHERE is_bookmarked = 1;
```

## Test Strategy

### Unit Tests

```typescript
describe('TagBookmarkService', () => {
  it('should add bookmark', async () => {
    const service = new TagBookmarkService();
    await service.addBookmark('proj1', 'tag1');

    expect(store.isBookmarked('proj1', 'tag1')).toBe(true);
  });

  it('should prevent duplicate bookmarks', async () => {
    const service = new TagBookmarkService();
    await service.addBookmark('proj1', 'tag1');

    await expect(service.addBookmark('proj1', 'tag1')).rejects.toThrow('Already exists');
  });

  it('should reorder bookmarks', async () => {
    const service = new TagBookmarkService();
    await service.addBookmark('proj1', 'tag1');
    await service.addBookmark('proj1', 'tag2');
    await service.addBookmark('proj1', 'tag3');

    await service.reorderBookmarks('proj1', 0, 2);

    const bookmarks = store.getByProject('proj1');
    expect(bookmarks[0].tagId).toBe('tag2');
    expect(bookmarks[1].tagId).toBe('tag3');
    expect(bookmarks[2].tagId).toBe('tag1');
  });
});
```

## Notes

### About user_id

- Currently uses fixed value `"local_user"`
- For future multi-device support
- Considering device ID or cloud authentication integration

### Deletion Behavior

- **Cascade delete**: Bookmarks automatically deleted when project is deleted
- **Tag deletion**: Bookmark remains (hidden in UI) when tag is deleted

### Performance Optimization

1. **Indexes**: `(user_id, project_id, order_index)` for fast sorting
2. **Initialization**: Bulk load all bookmarks on app startup
3. **Cache**: Memory cache in store

## Related Documents

- [User Preferences Category](../user-preferences.md)
- [Tag Entity](../projects/tag.md)
- [Automerge Structure](../automerge-structure.md)
