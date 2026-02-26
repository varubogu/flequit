# Svelte 5 Design Patterns

## Overview

This document defines the design patterns and best practices for Svelte 5 adopted in the Flequit application. It focuses on design guidelines centered around Svelte 5's new features, particularly runes.

Related documents:

- component-patterns: docs/develop/design/frontend/component-patterns.md
- anti-patterns: docs/develop/design/frontend/anti-patterns.md

Prohibited items (summary):

- No new -logic.svelte.ts format logic classes
- No proliferation of proxy-only service layers (deviating from UI→Store→Backend)
- No type duplication and proliferation of conversion functions for same concepts

## State Management

### $state: Reactive State

Used for basic reactive state management.

```typescript
// stores/task.svelte.ts
export class TaskStore {
  private tasks = $state<Task[]>([]);
  private loading = $state<boolean>(false);

  get allTasks() {
    return this.tasks;
  }

  get isLoading() {
    return this.loading;
  }

  addTask(task: Task) {
    this.tasks.push(task);
  }
}
```

### $derived: Derived State (Computed Properties)

Used for computing values derived from other states.

```typescript
// stores/task.svelte.ts
export class TaskStore {
  private tasks = $state<Task[]>([]);

  get completedTasks() {
    return $derived(this.tasks.filter((task) => task.status === 'completed'));
  }

  get progress() {
    return $derived(this.tasks.length > 0 ? this.completedTasks.length / this.tasks.length : 0);
  }
}
```

### $effect: Side Effect Processing

Used for executing side effects based on state changes.

```typescript
// components/task-list.svelte
<script lang="ts">
  import { taskStore } from '$lib/stores/task.svelte';

  // Save to local storage when tasks change
  $effect(() => {
    localStorage.setItem('tasks', JSON.stringify(taskStore.allTasks));
  });

  // Cleanup when needed
  $effect(() => {
    const interval = setInterval(() => {
      console.log('Current tasks:', taskStore.allTasks.length);
    }, 5000);

    return () => clearInterval(interval);
  });
</script>
```

### Class-based Stores

Use class-based stores for complex state management.

```typescript
// stores/project.svelte.ts
import type { Project, Task } from '$lib/types';

export class ProjectStore {
  private projects = $state<Project[]>([]);
  private currentProject = $state<Project | null>(null);
  private loading = $state<boolean>(false);
  private error = $state<string | null>(null);

  // Getters
  get allProjects() {
    return this.projects;
  }

  get current() {
    return this.currentProject;
  }

  get isLoading() {
    return this.loading;
  }

  get hasError() {
    return this.error !== null;
  }

  // Derived state
  get activeProjects() {
    return $derived(this.projects.filter((project) => !project.isArchived));
  }

  // Actions
  async loadProjects() {
    this.loading = true;
    this.error = null;

    try {
      const projects = await invoke<Project[]>('get_projects');
      this.projects = projects;
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      this.loading = false;
    }
  }

  selectProject(projectId: string) {
    this.currentProject = this.projects.find((p) => p.id === projectId) || null;
  }

  addProject(project: Project) {
    this.projects.push(project);
  }

  updateProject(updatedProject: Project) {
    const index = this.projects.findIndex((p) => p.id === updatedProject.id);
    if (index !== -1) {
      this.projects[index] = updatedProject;
    }
  }

  deleteProject(projectId: string) {
    this.projects = this.projects.filter((p) => p.id !== projectId);
    if (this.currentProject?.id === projectId) {
      this.currentProject = null;
    }
  }
}

// Export as singleton
export const projectStore = new ProjectStore();
```

## Component Design

Note: For detailed recommended/prohibited patterns, refer to component-patterns.md / anti-patterns.md. Here we only cover Svelte 5-specific guidelines.

### Props Definition

Use Svelte 5's props definition patterns.

```typescript
// components/task-item.svelte
<script lang="ts">
  import type { Task } from '$lib/types';

  interface Props {
    task: Task;
    readonly?: boolean;
    onUpdate?: (task: Task) => void;
    onDelete?: (taskId: string) => void;
  }

  let {
    task,
    readonly = false,
    onUpdate = () => {},
    onDelete = () => {}
  }: Props = $props();

  // Local state
  let isEditing = $state<boolean>(false);
  let editedTitle = $state<string>(task.title);

  // Derived state
  const canEdit = $derived(!readonly && !task.isCompleted);

  function handleSave() {
    if (editedTitle.trim()) {
      onUpdate({ ...task, title: editedTitle.trim() });
      isEditing = false;
    }
  }
</script>
```

### Event Handling

Prioritize callback functions, use CustomEvent only when necessary.

```typescript
// Recommended: Callback functions
<script lang="ts">
  interface Props {
    onTaskComplete: (taskId: string) => void;
    onTaskEdit: (task: Task) => void;
  }

  let { onTaskComplete, onTaskEdit }: Props = $props();
</script>

<button onclick={() => onTaskComplete(task.id)}>
  Complete
</button>

<!-- CustomEvent only when necessary -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{
    taskUpdated: { task: Task; changes: Partial<Task> };
  }>();

  function handleUpdate(changes: Partial<Task>) {
    const updatedTask = { ...task, ...changes };
    dispatch('taskUpdated', { task: updatedTask, changes });
  }
</script>
```

### Snippets

Use Snippet type for passing child content.

```typescript
// components/modal.svelte
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title: string;
    isOpen: boolean;
    onClose: () => void;
    children: Snippet;
    actions?: Snippet;
  }

  let { title, isOpen, onClose, children, actions }: Props = $props();
</script>

{#if isOpen}
  <div class="modal-overlay" onclick={onClose}>
    <div class="modal-content" onclick={(e) => e.stopPropagation()}>
      <header class="modal-header">
        <h2>{title}</h2>
        <button onclick={onClose}>×</button>
      </header>

      <main class="modal-body">
        {@render children()}
      </main>

      {#if actions}
        <footer class="modal-actions">
          {@render actions()}
        </footer>
      {/if}
    </div>
  </div>
{/if}
```

Usage example:

```svelte
<Modal title="Edit Task" isOpen={isModalOpen} onClose={() => (isModalOpen = false)}>
  <TaskForm task={selectedTask} onSave={handleSave} />

  {#snippet actions()}
    <button onclick={handleCancel}>Cancel</button>
    <button onclick={handleSave}>Save</button>
  {/snippet}
</Modal>
```

## Reactivity Best Practices

### 1. State Minimization

Manage only necessary minimum state with $state, use $derived as much as possible.

```typescript
// Good example
class TaskStore {
  private tasks = $state<Task[]>([]);

  get completedTasks() {
    return $derived(this.tasks.filter((t) => t.status === 'completed'));
  }

  get pendingTasks() {
    return $derived(this.tasks.filter((t) => t.status === 'pending'));
  }
}

// Bad example - Redundant state management
class TaskStore {
  private tasks = $state<Task[]>([]);
  private completedTasks = $state<Task[]>([]);
  private pendingTasks = $state<Task[]>([]);

  // Manual synchronization required - prone to bugs
  addTask(task: Task) {
    this.tasks.push(task);
    if (task.status === 'completed') {
      this.completedTasks.push(task);
    } else {
      this.pendingTasks.push(task);
    }
  }
}
```

### 2. Appropriate $effect Usage

Use $effect only for synchronization with external systems, not for internal state updates.

```typescript
// Good example - External system synchronization
$effect(() => {
  // Synchronization with local storage
  localStorage.setItem('userPreferences', JSON.stringify(preferences));
});

$effect(() => {
  // Synchronization with WebSocket
  if (isConnected) {
    websocket.send(JSON.stringify(currentState));
  }
});

// Bad example - Internal state updates (should use $derived)
let count = $state(0);
let doubledCount = $state(0);

$effect(() => {
  doubledCount = count * 2; // This should be done with $derived
});
```

### 3. Memory Leak Prevention

Always perform cleanup when creating resources in $effect.

```typescript
$effect(() => {
  const eventListener = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      closeModal();
    }
  };

  document.addEventListener('keydown', eventListener);

  // Cleanup
  return () => {
    document.removeEventListener('keydown', eventListener);
  };
});
```

## Performance Optimization

### 1. Computation Optimization

Memoize complex computations with $derived.

```typescript
class DataStore {
  private rawData = $state<DataItem[]>([]);

  // Heavy computations are memoized
  get processedData() {
    return $derived(
      this.rawData
        .filter((item) => item.isActive)
        .map((item) => ({
          ...item,
          computed: heavyComputation(item)
        }))
        .sort((a, b) => a.priority - b.priority)
    );
  }
}
```

### 2. Conditional Rendering

Use appropriate conditional branching to avoid unnecessary rendering.

```svelte
<!-- Good example -->
{#if items.length > 0}
  <ul>
    {#each items as item (item.id)}
      <TaskItem {item} />
    {/each}
  </ul>
{:else}
  <EmptyState />
{/if}

<!-- Bad example - Always rendered -->
<ul class:hidden={items.length === 0}>
  {#each items as item (item.id)}
    <TaskItem {item} />
  {/each}
</ul>
```

## Error Handling

### 1. Store-level Error Management

```typescript
class ApiStore {
  private data = $state<any[]>([]);
  private error = $state<string | null>(null);
  private loading = $state<boolean>(false);

  async fetchData() {
    this.loading = true;
    this.error = null;

    try {
      const result = await api.getData();
      this.data = result;
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to fetch data:', err);
    } finally {
      this.loading = false;
    }
  }

  clearError() {
    this.error = null;
  }
}
```

### 2. Component-level Error Display

```svelte
<script lang="ts">
  import { apiStore } from '$lib/stores/api.svelte';

  $effect(() => {
    apiStore.fetchData();
  });
</script>

{#if apiStore.isLoading}
  <LoadingSpinner />
{:else if apiStore.hasError}
  <ErrorMessage
    message={apiStore.error}
    onRetry={() => apiStore.fetchData()}
    onDismiss={() => apiStore.clearError()}
  />
{:else}
  <DataList items={apiStore.data} />
{/if}
```

By following these patterns, you can build a maintainable, high-performance Svelte 5 application.
