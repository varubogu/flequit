# Frontend Layer Architecture

## Overview

The frontend is clearly separated into **Infrastructure layer** and **Application layer**.
This separation enables:

- Easy switching of backend implementations (Tauri/Web/Cloud, etc.)
- Prevention of incorrect direct access from components
- Simple addition of new backends
- Improved testability

## Directory Structure

```
src/lib/
├── infrastructure/              ← Infrastructure layer (direct invocation prohibited)
│   └── backends/
│       ├── index.ts            (BackendService selection logic)
│       ├── tauri/              (Tauri implementation)
│       │   ├── project.ts
│       │   ├── task.ts
│       │   ├── subtask.ts
│       │   └── ...
│       ├── web/                (Web/Supabase implementation)
│       │   ├── project.ts
│       │   ├── task.ts
│       │   └── ...
│       └── (future) cloud/     (Future: Cloud sync implementation, etc.)
│
└── services/                    ← Application layer (OK to use from components)
    ├── domain/                 (Single entity operations)
    │   ├── project.ts
    │   ├── tasklist.ts
    │   ├── task.ts
    │   ├── subtask.ts
    │   ├── tag.ts
    │   └── settings.ts
    │
    ├── composite/              (Cross-cutting operations)
    │   ├── project-composite.ts
    │   ├── task-composite.ts
    │   └── recurrence-composite.ts
    │
    ├── ui/                     (UI state management only)
    │   ├── task-detail.ts
    │   ├── view.ts
    │   └── layout.ts
    │
    └── index.ts                (Public API definition)
```

## Layer Responsibilities

### Stores Layer (`stores/*.svelte.ts`)

**Responsibilities**:
- Reactive state management using Svelte runes (`$state`, `$derived`)
- Global state maintenance for entire application
- Calculation and provision of data necessary for UI display
- **Focus only on state management** (delegate persistence to Services layer)

**Features**:
- `.svelte.ts` extension (required for Svelte runes)
- No persistence or business logic (all delegated to services)
- Pure reactive state maintenance only

**Dependency Rules**:
- ✅ **OK to reference utils/types**
  - Example: Date formatting functions, type definitions
- ❌ **Prohibited to reference services (domain/ui/composite)**
  - Reason: Prevents circular dependencies (services reference stores)
- ❌ **Prohibited to reference infrastructure**
  - Reason: Stores layer handles only state management, persistence via Services layer
- ❌ **Prohibited to reference components**
  - Reason: Stores layer handles only state management, should not depend on UI components
- ❌ **Minimize mutual references between stores**
  - If necessary, clarify dependency direction (unidirectional only)

**Example**:
```typescript
// stores/tasks.svelte.ts
class TaskStore {
  tasks = $state<Task[]>([]);
  selectedTaskId = $state<string | null>(null);

  // ✅ State update methods (called from Services layer)
  addTask(task: Task) {
    this.tasks.push(task);
  }

  updateTask(taskId: string, updates: Partial<Task>) {
    const index = this.tasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
      this.tasks[index] = { ...this.tasks[index], ...updates };
    }
  }

  selectTask(taskId: string) {
    this.selectedTaskId = taskId;
  }
}

export const taskStore = new TaskStore();
```

---

### Infrastructure Layer (`infrastructure/backends/`)

**Responsibilities**:
- Provide **implementation** of backend communication
- Absorb environment differences between Tauri/Web/Cloud, etc.
- Data persistence and retrieval
- Handle only pure backend communication (no business logic)

**Features**:
- Interface definition + implementation
- Folder separation by environment (`tauri/`, `web/`, `cloud/`, etc.)
- Select BackendService based on environment in `index.ts`

**Access Restrictions**:
- ❌ **Prohibited direct invocation from Components layer**
- ❌ **Prohibited direct invocation from Stores layer**
- ✅ **OK to invoke directly from Services layer** (only access point)

**Dependency Rules**:
- ❌ **Prohibited to reference Services**
  - Reason: Infrastructure layer is bottom layer, should not depend on upper layers
- ❌ **Prohibited to reference Stores**
  - Reason: Infrastructure layer handles only pure backend communication
- ✅ **OK to reference Utils/Types**
  - Example: Type definitions, conversion functions

---

### Application Layer - Domain Services (`services/domain/`)

**Responsibilities**:
- Business logic for single entities
- Bridge between Infrastructure and Store
- Implementation of complex operations and validation logic

**Pattern**:
```typescript
// services/domain/task.ts
import { taskStore } from '$lib/stores/tasks.svelte';
import { getBackendService } from '$lib/infrastructure/backends';

export class TaskService {
  static async updateTask(taskId: string, updates: Partial<Task>) {
    // 1. Business logic (e.g., validation)
    if (!updates.title || updates.title.trim() === '') {
      throw new Error('Title is required');
    }

    // 2. Persist via Infrastructure layer
    const backend = await getBackendService();
    const updatedTask = await backend.task.update(projectId, taskId, updates);

    // 3. Update state in Store layer
    taskStore.updateTask(taskId, updatedTask);

    return updatedTask;
  }
}
```

**Dependency Rules**:
- ✅ **OK to invoke from Components layer**
- ✅ **OK to use Infrastructure layer**
  - Reason: Services layer bridges Infrastructure and Store
  - Example: `backend.task.update()`, `backend.project.create()`
- ✅ **OK to get/update data from Stores (domain model Stores only)**
  - Reason: Svelte runes work only in `.svelte.ts`, state is centralized in stores
  - Example: `taskStore.tasks`, `taskStore.updateTask()`
  - ⚠️ **Note**: Only domain model Stores (task, project, etc.). Do NOT reference UI state Stores (selection-store, etc.)
- ❌ **Prohibited to reference UI state stores (selection-store, etc.)**
  - Reason: Domain layer handles only business logic, should not depend on UI state
  - Example: Do NOT call `selectionStore.selectTask()`, etc.
  - UI state updates are the responsibility of Components layer
- ✅ **OK to use other Domain Services**
  - Example: TaskService calling RecurrenceService
  - Note: Unidirectional only to avoid circular references
- ✅ **OK to reference Utils/Types**
  - Example: Date calculations, validation functions
- ❌ **Prohibited to reference UI/Composite Services**
  - Reason: Prohibited to depend from lower to upper layers
- ❌ **Prohibited to reference Components layer**
  - Reason: Services layer handles only business logic, should not depend on UI components

**Notes**:
- Services layer operating both Infrastructure and Store makes responsibilities clear
- Functions as bridge between Store and Infrastructure even when no business logic exists
- **Important**: Domain Services operate only domain model Stores, do NOT depend on UI state Stores
- UI state management is the responsibility of Components layer

---

### Application Layer - Composite Services (`services/composite/`)

**Responsibilities**:
- Coordinated operations across multiple entities
- Transaction-like processing
- Combine and use Domain Services

**Example**:
```typescript
// services/composite/task-composite.ts
import { TaskService } from '$lib/services/domain/task';
import { SubTaskService } from '$lib/services/domain/subtask';

export class TaskCompositeService {
  /**
   * Create task and subtasks in batch
   */
  static async createTaskWithSubTasks(
    listId: string,
    task: Task,
    subTasks: SubTask[]
  ) {
    // Combine Domain Services
    const createdTask = await TaskService.createTask(listId, task);

    for (const subTask of subTasks) {
      await SubTaskService.createSubTask(createdTask.id, subTask);
    }

    return createdTask;
  }
}
```

**Dependency Rules**:
- ✅ **OK to invoke from Components layer**
- ✅ **OK to use Infrastructure layer**
  - Reason: Services layer bridges Infrastructure and Store
- ✅ **OK to use Domain Services**
- ✅ **OK to use other Composite Services** (carefully, watch for circular references)
- ✅ **OK to get/update data from Stores**
- ✅ **OK to reference Utils/Types**
- ❌ **Prohibited to reference UI Services**
  - Reason: Prohibited to depend from lower to upper layers
- ❌ **Prohibited to reference Components layer**
  - Reason: Services layer handles only business logic, should not depend on UI components

---

### ⚠️ Deprecated: Application Layer - UI Services (`services/ui/`)

**Important**: The UI Services layer is **deprecated**. Please follow the new design principles below:

**New Design Principles**:
- **UI Logic**: Implement in Components layer
- **UI State Management**: Manage with local state in Components layer or dedicated Stores (selection-store, etc.)
- **Business Logic**: Centralize in Domain Services layer

**Reason**:
The UI Services layer had unclear responsibilities and actually functioned as an intermediate layer between UI state management and business logic.
A clear 3-layer architecture (Components → Domain Services → Backend/Store) clarifies the responsibilities of each layer.

**Migration Path**:
```typescript
// ❌ Old: Via UI Services
TaskDetailService.openTaskDetail(taskId); // UI state + business logic mixed

// ✅ New: Directly manage in Components layer
// Components layer (*.svelte)
async function openTaskDetail(taskId: string) {
  // 1. Business logic: Call Domain Service
  await TaskService.getTask(taskId);

  // 2. UI logic: Judge and execute in Components layer
  if (viewStore.isMobile) {
    viewStore.openDrawer('task-detail');
  }

  // 3. UI state: Manage with selection-store, etc.
  selectionStore.selectTask(taskId);
}
```

**Important Principles**:
- ❌ **Domain Services should NOT reference UI state stores (selection-store, etc.)**
  - Reason: Domain layer handles only business logic, should not depend on UI state
- ✅ **Components layer coordinates UI state and business logic**
  - Components layer calls Domain Services and updates UI state based on results

## Inter-layer Dependencies

```
┌─────────────────────────────────────────────┐
│ Components Layer (Svelte)                   │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ 📌 Responsibility: UI Logic + UI State Mgmt │
│ ✅ Read values from stores/*                │
│ ✅ Invoke domain services/*                 │
│ ✅ Operate UI state stores (selection, etc.)│
│ ❌ Prohibited to import from infrastructure/*│
│ ❌ Prohibited to directly update domain stores│
└─────────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│ Services Layer (Business Logic + Bridge)   │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ ├─ composite/   (Cross-cutting operations) │
│ └─ domain/      (Single entity)            │
│                                             │
│ 📌 Responsibility: Business Logic Only      │
│ ✅ OK to reference Infrastructure (persist) │
│ ✅ OK to reference domain model Stores      │
│ ❌ Prohibited UI state stores (selection, etc.)│
│ ❌ Prohibited to reference Components layer │
└─────────────────────────────────────────────┘
         ↙                     ↘
┌──────────────────┐    ┌──────────────────┐
│ Infrastructure   │    │ Stores Layer     │
│ ━━━━━━━━━━━━━━━ │    │ ━━━━━━━━━━━━━━━ │
│ backends/        │    │ Domain model:    │
│ ├─ tauri/        │    │ ├─ tasks         │
│ ├─ web/          │    │ ├─ tags          │
│ └─ cloud/        │    │ └─ settings      │
│                  │    │ UI state:        │
│ 📌 External comm │    │ └─ selection     │
│ ❌ No Store ref  │    │                  │
│                  │    │ 📌 State only    │
│                  │    │ ❌ No Infra ref  │
└──────────────────┘    └──────────────────┘
         ↓                     ↓
┌─────────────────────────────────────────────┐
│ Utils/Types Layer (Available from all layers)│
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ ├─ utils/       (Pure functions)             │
│ └─ types/       (Type definitions)           │
│                                             │
│ 📌 Pure functions & type definitions only   │
│ ❌ Prohibited to reference stores/services/infrastructure│
└─────────────────────────────────────────────┘
```

### Detailed Dependency Rules

| From → To | Infrastructure | Domain Services | Composite Services | UI Services | Stores | Utils/Types | Components |
|-----------|---------------|-----------------|-------------------|-------------|--------|-------------|------------|
| **Components** | ❌ Prohibited | ✅ Invoke OK | ✅ Invoke OK | ✅ Invoke OK | ✅ Read only | ✅ OK | - |
| **Stores** | ❌ Prohibited | ❌ Prohibited | ❌ Prohibited | ❌ Prohibited | ⚠️ Minimal | ✅ OK | ❌ Prohibited |
| **UI Services** | ✅ OK | ✅ OK | ✅ OK | ⚠️ Same level caution | ✅ OK | ✅ OK | ❌ Prohibited |
| **Composite Services** | ✅ OK | ✅ OK | ⚠️ Same level caution | ❌ Prohibited | ✅ OK | ✅ OK | ❌ Prohibited |
| **Domain Services** | ✅ OK | ⚠️ Same level caution | ❌ Prohibited | ❌ Prohibited | ✅ OK | ✅ OK | ❌ Prohibited |
| **Utils/Types** | ❌ Prohibited | ❌ Prohibited | ❌ Prohibited | ❌ Prohibited | ❌ Prohibited | - | ❌ Prohibited |
| **Infrastructure** | - | ❌ Prohibited | ❌ Prohibited | ❌ Prohibited | ❌ Prohibited | ✅ OK | ❌ Prohibited |

#### Legend
- ✅ OK: Recommended dependencies
- ⚠️ Caution: Allowed but be careful (watch for circular dependencies)
- ❌ Prohibited: ESLint violation detection

### Circular Dependency Prevention Rules

**🔴 Absolutely Prohibited (Circular Dependencies & Responsibility Separation)**:
- ❌ `stores` → `services (domain/ui/composite)`
  - Reason: Circular dependency since services reference stores
- ❌ `stores` → `infrastructure`
  - Reason: Stores layer handles only state management, persistence delegated to Services layer
- ❌ `stores` → `components`
  - Reason: Stores layer handles only state management, should not depend on UI components
- ❌ `services (domain/ui/composite)` → `components`
  - Reason: Services layer handles only business logic, should not depend on UI components
- ❌ `domain services` → `ui services`
  - Reason: Prohibited to depend from lower to upper layers
- ❌ `domain services` → `composite services`
  - Reason: Prohibited to depend from lower to upper layers
- ❌ `composite services` → `ui services`
  - Reason: Prohibited to depend from lower to upper layers
- ❌ `infrastructure` → `services`
  - Reason: Infrastructure layer is bottom layer, should not depend on upper layers
- ❌ `infrastructure` → `stores`
  - Reason: Infrastructure layer handles only pure backend communication
- ❌ `infrastructure` → `components`
  - Reason: Infrastructure layer handles only pure backend communication
- ❌ `utils/types` → `stores/services/infrastructure/components`
  - Reason: Pure function/type definition layer should not depend on other layers

**🟡 Svelte 5 Special Allowable Patterns**:
- ✅ `services (domain/ui/composite)` → `stores` (Allowed due to Svelte runes constraints)
  - Reason: `$state` works only in `.svelte.ts`, so state is centralized in stores
  - Condition: **No reverse dependency (stores → services) exists**
- ✅ `components` → `stores` (read only)
  - Reason: UI components need to display state
  - Restriction: **Store method calls prohibited, value reading only**

**⚠️ Patterns Requiring Caution**:
- ⚠️ Mutual references between `stores`
  - Allowed: When clear dependency direction exists (e.g., `task-store` → `project-store`)
  - Prohibited: When mutually referencing (circular dependency)
- ⚠️ Same-level `services` references
  - Allowed: When dependency is unidirectional only
  - Prohibited: When mutually referencing (circular dependency)

**🟢 Recommended Patterns (Clear Responsibility Separation)**:
- ✅ `components` → `services` → `infrastructure` (persistence)
- ✅ `components` → `services` → `stores` (state updates)
- ✅ `components` → `stores` (read only)
- ✅ `services (ui → composite → domain)` (hierarchy compliance)

**Data Flow**:
```
Component
    ↓ Invoke
Service (Business Logic)
    ├→ Infrastructure (Persistence: Create/Update/Delete)
    └→ Store (State Updates)
```

## Circular Dependency Check (ESLint)

Circular dependencies are **automatically detected by ESLint**. The following rules are configured in `eslint.config.ts`:

### ESLint Configuration

```typescript
// eslint.config.ts

// 1. Prohibit Stores layer from referencing Services/Infrastructure (Responsibility Separation)
{
  files: ['src/lib/stores/**/*.{ts,svelte.ts}'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['$lib/services/domain/**', '**/services/domain/**'],
            message: '❌ Prohibited to reference Domain Services from Stores layer (circular dependency).'
          },
          {
            group: ['$lib/services/ui/**', '**/services/ui/**'],
            message: '❌ Prohibited to reference UI Services from Stores layer (circular dependency).'
          },
          {
            group: ['$lib/services/composite/**', '**/services/composite/**'],
            message: '❌ Prohibited to reference Composite Services from Stores layer (circular dependency).'
          },
          {
            group: ['$lib/infrastructure/**', '**/infrastructure/**'],
            message: '❌ Prohibited to reference Infrastructure layer from Stores layer. Stores layer handles only state management. Please use via Services layer.'
          }
        ]
      }
    ]
  }
},

// 2. Prohibit Domain Services from referencing UI/Composite Services
{
  files: ['src/lib/services/domain/**/*.ts'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['$lib/services/ui/**', '**/services/ui/**'],
            message: '❌ Prohibited to reference UI Services from Domain Services (lower layer → upper layer).'
          },
          {
            group: ['$lib/services/composite/**', '**/services/composite/**'],
            message: '❌ Prohibited to reference Composite Services from Domain Services (lower layer → upper layer).'
          }
        ]
      }
    ]
  }
},

// 3. Prohibit Composite Services from referencing UI Services
{
  files: ['src/lib/services/composite/**/*.ts'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['$lib/services/ui/**', '**/services/ui/**'],
            message: '❌ Prohibited to reference UI Services from Composite Services (lower layer → upper layer).'
          }
        ]
      }
    ]
  }
},

// 4. Prohibit Utils/Types layer from referencing Stores/Services/Infrastructure
{
  files: ['src/lib/utils/**/*.ts', 'src/lib/types/**/*.ts'],
  ignores: ['src/lib/types/bindings.ts'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['$lib/stores/**', '**/stores/**'],
            message: '❌ Prohibited to reference Stores from Utils/Types layer. Please keep only pure functions/type definitions.'
          },
          {
            group: ['$lib/services/**', '**/services/**'],
            message: '❌ Prohibited to reference Services from Utils/Types layer. Please keep only pure functions/type definitions.'
          },
          {
            group: ['$lib/infrastructure/**', '**/infrastructure/**'],
            message: '❌ Prohibited to reference Infrastructure from Utils/Types layer. Please keep only pure functions/type definitions.'
          }
        ]
      }
    ]
  }
},

// 5. Prohibit Infrastructure layer from referencing Services/Stores
{
  files: ['src/lib/infrastructure/**/*.ts'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['$lib/services/**', '**/services/**'],
            message: '❌ Prohibited to reference Services from Infrastructure layer. Infrastructure layer is used only from Stores layer.'
          },
          {
            group: ['$lib/stores/**', '**/stores/**'],
            message: '❌ Prohibited to reference Stores from Infrastructure layer. Infrastructure layer handles only pure backend communication.'
          }
        ]
      }
    ]
  }
},

// 6. Prohibit Services layer from referencing Components layer
{
  files: ['src/lib/services/**/*.{ts,svelte.ts}'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['$lib/components/**', '**/components/**'],
            message: '❌ Prohibited to reference Components layer from Services layer. Services layer handles only business logic.'
          }
        ]
      }
    ]
  }
},

// 7. Prohibit Stores layer from referencing Components layer
{
  files: ['src/lib/stores/**/*.{ts,svelte.ts}'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['$lib/components/**', '**/components/**'],
            message: '❌ Prohibited to reference Components layer from Stores layer. Stores layer handles only state management.'
          }
        ]
      }
    ]
  }
}
```

### Execution Method

```bash
# Lint check (automatic circular dependency detection)
bun run lint

# Automatic check during development
bun run dev  # Auto-display in ESLint-integrated editor
```

### Error Examples

```bash
# 1. stores → services violation example
src/lib/stores/tasks.svelte.ts
  2:1  error  '$lib/services/domain/task' import is restricted from being used by a pattern.
              ❌ Prohibited to reference Domain Services from Stores layer (circular dependency).

# 1-2. stores → infrastructure violation example (new rule)
src/lib/stores/tasks.svelte.ts
  3:1  error  '$lib/infrastructure/backends' import is restricted from being used by a pattern.
              ❌ Prohibited to reference Infrastructure layer from Stores layer. Stores layer handles only state management. Please use via Services layer.

# 2. domain services → ui services violation example
src/lib/services/domain/task.ts
  3:1  error  '$lib/services/ui/task-detail' import is restricted from being used by a pattern.
              ❌ Prohibited to reference UI Services from Domain Services (lower layer → upper layer).

# 3. composite services → ui services violation example
src/lib/services/composite/task-composite.ts
  4:1  error  '$lib/services/ui/layout' import is restricted from being used by a pattern.
              ❌ Prohibited to reference UI Services from Composite Services (lower layer → upper layer).

# 4. utils → services violation example
src/lib/utils/date-utils.ts
  2:1  error  '$lib/services/domain/settings' import is restricted from being used by a pattern.
              ❌ Prohibited to reference Services from Utils/Types layer. Please keep only pure functions/type definitions.

# 5. infrastructure → services violation example
src/lib/infrastructure/backends/tauri/project.ts
  3:1  error  '$lib/services/domain/project' import is restricted from being used by a pattern.
              ❌ Prohibited to reference Services from Infrastructure layer. Infrastructure layer is used only from Stores layer.

# 6. infrastructure → stores violation example
src/lib/infrastructure/backends/tauri/task.ts
  4:1  error  '$lib/stores/tasks.svelte' import is restricted from being used by a pattern.
              ❌ Prohibited to reference Stores from Infrastructure layer. Infrastructure layer handles only pure backend communication.

# 7. services → components violation example
src/lib/services/domain/task.ts
  5:1  error  '$lib/components/task/TaskDetail.svelte' import is restricted from being used by a pattern.
              ❌ Prohibited to reference Components layer from Services layer. Services layer handles only business logic.

# 8. stores → components violation example
src/lib/stores/tasks.svelte.ts
  6:1  error  '$lib/components/task/TaskList.svelte' import is restricted from being used by a pattern.
              ❌ Prohibited to reference Components layer from Stores layer. Stores layer handles only state management.
```

### CI/CD Integration

```json
// package.json
{
  "scripts": {
    "lint": "eslint .",
    "precommit": "bun run lint && bun check",
    "ci": "bun run lint && bun run test && bun check"
  }
}
```

---

## Technical Enforcement

### 1. ESLint Rules

```javascript
// .eslintrc.cjs
module.exports = {
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['**/infrastructure/**'],
            message: '❌ Direct access to Infrastructure layer is prohibited. Please use services/.'
          }
        ]
      }
    ]
  }
};
```

### 2. Public API Management (`services/index.ts`)

```typescript
// src/lib/services/index.ts

// ✅ Domain Services (public)
export * from './domain/project.service';
export * from './domain/task.service';
export * from './domain/subtask.service';
export * from './domain/tag.service';
export * from './domain/settings.service';

// ✅ Composite Services (public)
export * from './composite/project-composite.service';
export * from './composite/task-composite.service';
export * from './composite/recurrence-composite.service';

// ✅ UI Services (public)
export * from './ui/task-detail.service';
export * from './ui/view.service';
export * from './ui/layout.service';

// ❌ Do not export infrastructure (cannot be used externally)
```

### 3. TypeScript Paths Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "$lib/services": ["./src/lib/services/index.ts"],
      "$lib/services/*": ["./src/lib/services/*"]
    }
  }
}
```

## Usage from Components

### ✅ Correct Usage

```typescript
// src/lib/components/task/TaskList.svelte
<script lang="ts">
  import { TaskService } from '$lib/services';

  async function handleUpdate(taskId: string, updates: Partial<Task>) {
    await TaskService.updateTask(taskId, updates);
  }
</script>
```

### ❌ Incorrect Usage

```typescript
// ❌ NG: Direct access to Infrastructure layer
import { TauriBackend } from '$lib/infrastructure/backends/tauri';

// ESLint Error: Direct access to Infrastructure layer is prohibited
```

## Adding New Backends

When adding new backends (e.g., Firebase):

```
1. Create infrastructure/backends/firebase/ folder
2. Implement BackendService interface
3. Add to selection logic in infrastructure/backends/index.ts
```

**Important**: Services layer requires no changes!

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

## Components Layer and Store Relationship

There are strict rules between Components layer (`src/lib/components/`) and Store (`src/lib/stores/`):

### Store Reading
- ✅ **OK to read directly from Components layer**
  ```typescript
  // ✅ OK: Value reading
  import { taskStore } from '$lib/stores/tasks.svelte';

  const tasks = taskStore.tasks;
  const selectedTask = taskStore.selectedTask;
  ```

### Store Method Calls
- ❌ **Prohibited to call Store methods from Components layer**
- ✅ **Must go through Services**
  ```typescript
  // ❌ NG: Direct Store method calls from Components layer
  await taskStore.updateTask(taskId, updates);

  // ✅ OK: Via Services
  import { TaskService } from '$lib/services/domain/task';
  await TaskService.updateTask(taskId, updates);
  ```

**Reason**:
- Business rules and validation may be needed in Store update logic, centralized in Services layer
- Easy to adapt to future changes via Services layer
- Improved testability (easy to mock Services layer)

**Note**:
- ESLint cannot distinguish between Store method calls and value reading, so code review is needed
- Using Services even for simple operations ensures consistent code

## Summary

### Design Principles

1. **Clear 3-Layer Architecture**
   - **Components layer**: UI logic + UI state management
   - **Services layer**: Business logic + bridge between Store and Infrastructure
   - **Infrastructure/Stores layer**: Persistence and domain model state management

2. **Each Layer's Responsibilities**
   - **Components layer**: UI logic, UI state (selection, etc.) management, Domain Services invocation
   - **Domain Services layer**: Business logic only, bridge between domain model Store and Infrastructure
   - **Stores layer**: State management only (separate domain model + UI state management)
   - **Infrastructure layer**: External interaction only (backend communication)

3. **Important: Separation of Domain Services and UI State**
   - ❌ Domain Services do NOT reference UI state stores (selection-store, etc.)
   - ✅ Components layer calls Domain Services and updates UI state based on results
   - Reason: Domain layer handles only business logic, should not depend on UI state

4. **Infrastructure layer used only from Services layer**
   - Direct invocation from Components layer/Stores layer prohibited

5. **Stores layer focuses only on state management**
   - Do not reference Services/Infrastructure/Components
   - Delegate all persistence and business logic to Services layer
   - Separate management of domain model Stores and UI state Stores

6. **Services layer operates Infrastructure and domain model Store**
   - Persistence via Infrastructure layer
   - State updates via domain model Store layer
   - Do NOT operate UI state Stores (Components layer's responsibility)

7. **Expanded Components layer responsibilities**
   - Invoke Domain Services only, domain model Store read-only
   - Components layer directly operates UI state stores
   - Implement UI logic (mobile/desktop judgment, etc.) in Components layer

8. **Services layer maintains hierarchy (Composite → Domain)**
   - UI Services layer is deprecated
   - Do not reference Components (business logic only)

9. **Utils/Types layer depends on no other layers (pure functions/type definitions only)**

### Expected Effects

- 🎯 **Improved Maintainability**: Clear responsibilities, limited change locations
- 🔒 **Improved Safety**: Prevent misuse with ESLint
- 🚀 **Improved Extensibility**: Easy addition of new backends
- 🧪 **Improved Testability**: Each layer can be tested independently

### Related Documents

- [Backend Command Implementation](./backend-commands.md)
- [Svelte 5 Patterns](./svelte5-patterns.md)
- [Overall Architecture](../architecture.md)
