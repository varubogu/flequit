# Frontend Backend Command Implementation

Backend communication layers that interact with external systems for data saving and loading are defined as `infrastructure/backends/`.

> **Important**: This document explains Infrastructure layer implementation.
> For overall layer architecture, refer to [layers.md](./layers.md).

## infrastructure/backends/

**Location**: `src/lib/infrastructure/backends/`

**Responsibilities**:
- Provide backend communication implementation
- Absorb environment differences between Tauri/Web/Cloud, etc.
- Data persistence and retrieval

**Features**:
- Interface definition + implementation
- Folder separation by environment (`tauri/`, `web/`, `cloud/`, etc.)
- Select BackendService based on environment in `index.ts`

**Access Restrictions**:
- ❌ **Direct invocation from components prohibited**
- ❌ **Direct invocation from stores prohibited**
- ✅ **Access only from Services layer (`services/domain/`)**

### Directory Structure

```
src/lib/infrastructure/backends/
├── index.ts                    # BackendService selection logic
├── types.ts                    # BackendService interface definition
├── tauri/                      # Tauri implementation
│   ├── project.ts
│   ├── tasklist.ts
│   ├── task.ts
│   ├── subtask.ts
│   ├── tag.ts
│   ├── settings.ts
│   └── index.ts
└── web/                        # Web/Supabase implementation
    ├── project.ts
    ├── tasklist.ts
    ├── task.ts
    ├── subtask.ts
    ├── tag.ts
    ├── settings.ts
    └── index.ts
```

## infrastructure/backends/tauri/, infrastructure/backends/web/

**Location**:
- `src/lib/infrastructure/backends/tauri/`
- `src/lib/infrastructure/backends/web/`

**Implementation Content**:
- **Tauri**: Communicate with Rust backend via Tauri commands
- **Web**: Communicate with WebAPI like Supabase
- **Future**: Cloud sync, Git sync implementations can also be added

**Current State**:
- Only Tauri implemented
- Web implementation planned for later

## Common Items

### Data Structures Handled

Interface and implementation for the following entities:

- `project` (Project)
- `tasklist` (Task List)
- `task` (Task)
- `subtask` (Subtask)
- `tag` (Tag)
- `settings` (Settings)
- `account` (Account)

### BackendService Interface

Each entity's BackendService is defined as an interface in `infrastructure/backends/types.ts`:

```typescript
export interface BackendService {
  project: ProjectBackend;
  tasklist: TaskListBackend;
  task: TaskBackend;
  subtask: SubTaskBackend;
  tag: TagBackend;
  settings: SettingsBackend;
  // ... others
}
```

### Required Functions (CRUD Operations)

Each entity's Backend provides the following CRUD operations:

#### Create (Create)
- **Parameters**: Object
- **Return Value**: `boolean` (registration success/failure)
- **Naming Convention**: `createProject`, `createTask`, etc.

```typescript
async create(projectId: string, entity: Project): Promise<boolean>
```

#### Update (Update)
- **Parameters**: ID + update content (partial object)
- **Return Value**: `boolean` (update success/failure)
- **Naming Convention**: `updateProject`, `updateTask`, etc.

```typescript
async update(projectId: string, id: string, updates: Partial<Project>): Promise<boolean>
```

#### Delete (Delete)
- **Parameters**: ID
- **Return Value**: `boolean` (deletion success/failure)
- **Naming Convention**: `deleteProject`, `deleteTask`, etc.

```typescript
async delete(projectId: string, id: string): Promise<boolean>
```

#### Search (Single) (Read - Single)
- **Parameters**: ID
- **Return Value**: Entity object (null if not found)
- **Naming Convention**: `getProject`, `getTask`, etc.

```typescript
async get(projectId: string, id: string): Promise<Project | null>
```

#### Search (Multiple) (Read - Multiple)
- **Parameters**: Search condition object (optional)
- **Return Value**: Array of entity objects
- **Naming Convention**: `getAllProjects`, `getAllTasks`, etc.

```typescript
async getAll(projectId: string, conditions?: SearchConditions): Promise<Project[]>
```

**Note**:
- `project`, `tasklist`, `task`, `subtask`, `tag`: Provide **both** single and multiple search
- `settings`, `account`: Provide single search only

### Data Update Notification Mechanism

When data is retrieved (synchronized) from backend (Tauri/Web), the following mechanism notifies updates:

- Notify which values were updated from `tauri/web` → frontend
- Frontend updates display of relevant parts upon receiving notification
- Implementation method may vary by backend (Tauri uses events, Web uses WebSocket, etc.)

## Type Considerations

Type definition rules for entities with parent-child relationships:

### Parent to Child Access

- Not needed due to list structure or object structure
- Example: `Project` has `taskLists: TaskList[]`

### Child to Parent Access

- **Children only hold ID of one level up parent**
- Example: `Task` has `listId` but not `projectId` or `subTaskId`

```
project (projectId)
  ↓
tasklist (tasklistId, holds projectId)
  ↓
task (taskId, holds listId)
  ↓
subtask (subtaskId, holds taskId)
```

**Reason**: Data normalization and clear dependency relationships

## Implementation Order

Infrastructure layer implementation follows this order:

1. **Type Definition Revision**
   - Review entity type definitions
   - Follow parent-child ID holding rules

2. **Interface Definition in `infrastructure/backends/types.ts`**
   - `BackendService` interface
   - Each entity's Backend interface

3. **Implement `infrastructure/backends/tauri/`, `infrastructure/backends/web/`**
   - Tauri: Full implementation
   - Web: Function skeletons only (internal processing pending)

## Services Layer Integration

Only **Services layer (`services/domain/`)** uses Infrastructure layer:

```typescript
// services/domain/task.ts
import { getBackendService } from '$lib/infrastructure/backends';

export class TaskService {
  static async updateTask(taskId: string, updates: Partial<Task>) {
    // Use Infrastructure layer
    const backend = await getBackendService();
    await backend.task.update(projectId, taskId, updates);

    // Update Store
    taskStore.updateTask(taskId, updates);
  }
}
```

## Adding New Backends

When adding new backends (e.g., Firebase, Cloud sync):

1. Create `infrastructure/backends/firebase/` folder
2. Implement `BackendService` interface
3. Add to selection logic in `infrastructure/backends/index.ts`

```typescript
// infrastructure/backends/index.ts
export async function getBackendService(): Promise<BackendService> {
  if (isFirebase) {
    return new FirebaseBackend(); // New addition
  } else if (isTauri) {
    return new TauriBackend();
  } else {
    return new WebBackend();
  }
}
```

**Important**: Services layer requires no changes!

## Related Documents

- [Layer Architecture](./layers.md) - Relationship between Infrastructure and Services layers
- [Svelte 5 Patterns](./svelte5-patterns.md) - Component design
- [Overall Architecture](../architecture.md) - System-wide design
