# User Preferences

## Overview

A category for managing user's personal workspace settings. Independent from project data (team-shared), synchronized only across the same user's multiple devices.

## Classification

### Data Category Classification

| Category | Purpose | Sync Target | Automerge | Examples |
|---------|---------|------------|-----------|----------|
| `accounts` | Authentication | - | No | User profile |
| `user_preferences` | Personal workspace | Same user's other devices | Yes | Tag bookmarks, UI settings |
| `projects` | Project data | All team members | Yes | Tasks, tags, projects |

### Characteristics of user_preferences

1. **Personal**: Not shared with other users
2. **Cross-device sync**: Synchronized across the same user's multiple devices
3. **Project-dependent**: Many settings are managed by project ID as a key
4. **Local persistence**: SQLite + Automerge

## Automerge Document Structure

```
/user_preferences/{user_id}
  ├── tag_bookmarks/                    # Tag bookmarks
  │   ├── {project_id}/
  │   │   ├── {tag_id_1}/
  │   │   │   ├── id: string
  │   │   │   ├── project_id: string
  │   │   │   ├── tag_id: string
  │   │   │   ├── order_index: number
  │   │   │   ├── created_at: timestamp
  │   │   │   └── updated_at: timestamp
  │   │   └── {tag_id_2}/...
  │   └── {another_project_id}/...
  │
  ├── view_preferences/                 # View settings (future)
  │   ├── {project_id}/
  │   │   ├── task_list_columns/        # Column width, show/hide
  │   │   ├── default_sort/             # Default sort
  │   │   └── saved_filters/            # Saved filters
  │   └── ...
  │
  ├── sidebar_state/                    # Sidebar state (future)
  │   ├── collapsed: boolean
  │   ├── width: number
  │   └── pinned_items: string[]
  │
  └── ui_settings/                      # UI settings (future)
      ├── theme: string
      ├── language: string
      └── date_format: string
```

## Currently Implemented Entities

### Tag Bookmark

See [tag_bookmark.md](./entity/user_preferences/tag_bookmark.md) for details.

#### Overview
Management of tags pinned to the sidebar.

#### Key Fields
- `project_id`: Project the tag belongs to
- `tag_id`: Tag to bookmark
- `order_index`: Display order
- `created_at`, `updated_at`: Timestamps

## Synchronization Strategy

### SQLite vs Automerge

1. **SQLite**: Fast read and query
   - Bulk loading on initialization
   - Sorting and filtering

2. **Automerge**: Cross-device synchronization
   - Change history management
   - Conflict resolution (CRDT)

### Sync Flow

```
Device A                                 Device B
  ↓ Setting change
SQLite update + Automerge doc update
  ↓
Sync server (future)
  ↓
                                   ← Receive Automerge doc
                                   ← SQLite update
```

## Handling of user_id

### Current Implementation
- `user_id` is a fixed value: `"local_user"`
- Assumes single-user environment

### Future Extensions
To identify the same user across multiple devices:
- Device ID-based identification
- Integration with cloud authentication

## Design Principles

### 1. Project-Dependent Settings
Most settings are managed by project ID as a key:
```typescript
// Good example
interface TagBookmark {
  projectId: string;  // Required
  tagId: string;
  orderIndex: number;
}

// Bad example (no project information)
interface TagBookmark {
  tagId: string;  // Which project's tag?
  orderIndex: number;
}
```

### 2. Consistency of Automerge Paths
Maintain hierarchical structure:
```
/user_preferences/{user_id}/{category}/{project_id}/{entity_id}
```

### 3. SQLite and Automerge Consistency
- Store same data in both
- SQLite optimized for reads
- Automerge optimized for sync

## Extension Plan

### Priority: High
- **Tag Bookmarks**: Implemented
- **Sidebar State**: Collapsed state, width

### Priority: Medium
- **View Settings**: Column widths, sort order, filters
- **UI Settings**: Theme, language

### Priority: Low
- **Keyboard Shortcuts**: Customization
- **Notification Settings**: ON/OFF

## Implementation Guidelines

### When Adding a New Entity

1. **Create Documentation**
   - `docs/ja/develop/design/data/entity/user_preferences/{entity_name}.md`
   - `docs/en/develop/design/data/entity/user_preferences/{entity_name}.md`

2. **Create Rust Models**
   ```
   src-tauri/crates/
     ├── flequit-model/src/models/user_preferences/{entity_name}.rs
     ├── flequit-infrastructure-sqlite/src/models/user_preferences/{entity_name}.rs
     └── flequit-infrastructure-automerge/src/models/user_preferences/{entity_name}.rs
   ```

3. **TypeScript Type Definitions**
   ```
   src/lib/types/user-preferences/{entity-name}.ts
   ```

4. **Service Implementation**
   - Rust service: `src-tauri/crates/flequit-core/src/services/user_preferences/`
   - TypeScript service: `src/lib/services/domain/user-preferences/`

5. **Store Implementation**
   ```
   src/lib/stores/user-preferences/{entity-name}-store.svelte.ts
   ```

## Related Documents

- [Tag Bookmark Entity](./entity/user_preferences/tag_bookmark.md)
- [Automerge Structure](./automerge-structure.md)
- [Data Flow](./tauri-automerge-repo-dataflow.md)
