# User Preferences

Category for managing a user's personal work-environment settings. It is independent from project data (team-shared data) and is synchronized only across multiple devices for the same user.

## Positioning: Data Categories

| Category | Purpose | Sync target | Automerge | Examples |
| --- | --- | --- | --- | --- |
| `accounts` | Authentication information | - | none | User profile |
| `user_preferences` | Personal work environment | Other devices for the same user | yes | Tag bookmarks, UI settings |
| `projects` | Project data | All team members | yes | Tasks, tags, projects |

### Characteristics of `user_preferences`

1. **Personal only**: not shared with other users
2. **Cross-device sync**: synchronized across multiple devices for the same user
3. **Project-dependent**: many settings are managed with `project_id` as a key
4. **Local persistence**: SQLite + Automerge

## Automerge Document Hierarchy

```
/user_preferences/{user_id}
  ├── tag_bookmarks/{project_id}/{tag_id}
  ├── view_preferences/{project_id}/         # Future: column widths, sorting, filters
  ├── sidebar_state/                          # Future: open/closed state, width, pinned state
  └── ui_settings/                            # Future: theme, language, date format
```

## Currently Implemented Entity

### TagBookmark

Manages tags pinned in the sidebar. See [`entity/user-preferences.md`](./entity/user-preferences.md) for detailed field definitions.

Main fields: `project_id` / `tag_id` / `order_index` / `created_at` / `updated_at`

## Sync Strategy

### SQLite and Automerge Roles

| Storage | Role |
| --- | --- |
| SQLite | Fast reads and queries (bulk initial loading, sorting, filtering) |
| Automerge | Multi-device sync (change history management, CRDT conflict resolution) |

### Sync Flow

Setting change on device A -> update SQLite + Automerge -> through sync server (future) -> device B receives Automerge -> reflect into SQLite.

## Handling `user_id`

- **Current**: fixed value `"local_user"` (single-user environment)
- **Future**: identify the same user across multiple devices (device-ID based or cloud-auth integration)

## Design Principles

### 1. Project-Dependent Settings

Many settings are managed with `project_id` as a key. A `tag_id` alone does not identify which project's tag it is, so `project_id` must always be stored together.

### 2. Consistent Automerge Paths

Keep the hierarchy `/user_preferences/{user_id}/{category}/{project_id}/{entity_id}`.

### 3. SQLite and Automerge Consistency

Store the same data in both. SQLite is optimized for reading; Automerge is optimized for synchronization.

## Extension Plan

| Priority | Entity |
| --- | --- |
| High | Tag bookmarks (implemented), sidebar state (open/closed, width) |
| Medium | View settings (column width, sort order, filters), UI settings (theme, language) |
| Low | Keyboard shortcut customization, notification settings |

## Implementation Guidelines (When Adding a New Entity)

1. **Add documentation**: add the new entity to `entity/user-preferences.md` (following `_template.md`). Sync `docs/en/` in a separate task when needed.
2. **Create Rust models**: add under `src/models/user_preferences/` in `flequit-model`, `flequit-infrastructure-sqlite`, and `flequit-infrastructure-automerge`
3. **Create TypeScript types**: add under `src/lib/types/user-preferences/`
4. **Implement services**: Rust side in `flequit-core/src/services/user_preferences/`, TypeScript side in `src/lib/services/domain/user-preferences/`
5. **Implement store**: `src/lib/stores/user-preferences/{entity-name}-store.svelte.ts`

## Related

- [`entity/user-preferences.md`](./entity/user-preferences.md): entity specification
- [`automerge-structure.md`](./automerge-structure.md): general Automerge structure
- [`tauri-automerge-repo-dataflow.md`](./tauri-automerge-repo-dataflow.md): data flow
