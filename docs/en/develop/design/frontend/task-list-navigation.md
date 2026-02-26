# Task Detail Navigation Design

## Overview

Design document for implementing navigation between tasks and subtasks from the task detail screen.

## Requirements

### 1. Subtask Click Navigation

When a user clicks a subtask in the task detail (task view):

1. Select the subtask in the task list
2. Display the subtask in the task detail view
3. Expand the parent task in the task list if it's collapsed
4. (Optional) Scroll to the subtask if it's outside the viewport

### 2. Go to Parent Task Navigation

When a user clicks "Go to Parent Task" button in the task detail (subtask view):

1. Select the parent task in the task list
2. Display the parent task in the task detail view
3. If the parent task is a subtask of another task, expand that task
4. (Optional) Scroll to the parent task if it's outside the viewport

## Architecture

### State Management

#### Current Implementation

- `showSubTasks` state is managed locally in each `task-item.svelte` component
- No way to control the expansion state from outside the component
- Selection state is managed in `selectionStore`

#### New Implementation

Create a new store to manage task list UI state, including accordion expansion states.

```typescript
// src/lib/stores/task-list/task-list-ui-state.svelte.ts

import { SvelteSet } from 'svelte/reactivity';

export class TaskListUIState {
  // Tracks which tasks have their subtasks expanded
  // Using SvelteSet for automatic reactivity
  private expandedTaskIds = $state<SvelteSet<string>>(new SvelteSet());

  /**
   * Check if a task's subtasks are expanded
   */
  isTaskExpanded(taskId: string): boolean {
    return this.expandedTaskIds.has(taskId);
  }

  /**
   * Toggle expansion state of a task
   */
  toggleTaskExpansion(taskId: string): void {
    if (this.expandedTaskIds.has(taskId)) {
      this.expandedTaskIds.delete(taskId);
    } else {
      this.expandedTaskIds.add(taskId);
    }
    // SvelteSet is automatically reactive, no need to reassign
  }

  /**
   * Expand a task's subtasks
   */
  expandTask(taskId: string): void {
    if (!this.expandedTaskIds.has(taskId)) {
      this.expandedTaskIds.add(taskId);
      // SvelteSet is automatically reactive
    }
  }

  /**
   * Collapse a task's subtasks
   */
  collapseTask(taskId: string): void {
    if (this.expandedTaskIds.has(taskId)) {
      this.expandedTaskIds.delete(taskId);
      // SvelteSet is automatically reactive
    }
  }

  /**
   * Reset all expansion states (for testing)
   */
  reset(): void {
    this.expandedTaskIds.clear();
  }
}

export const taskListUIState = new TaskListUIState();
```

### Component Updates

#### task-item.svelte

Replace local `showSubTasks` state with store-based state:

```typescript
// Before
let showSubTasks = $state(false);

// After
import { taskListUIState } from '$lib/stores/task-list/task-list-ui-state.svelte';

const showSubTasks = $derived(taskListUIState.isTaskExpanded(task.id));

function toggleSubTasksAccordion(event?: Event) {
  event?.stopPropagation();
  taskListUIState.toggleTaskExpansion(task.id);
}
```

### Service Layer Updates

#### task-detail-actions.ts

Update `handleSubTaskClick` to expand parent task:

```typescript
handleSubTaskClick = (subTaskId: string) => {
  // Get parent task ID to expand it in task list
  const parentTaskId = subTaskStore.getTaskIdBySubTaskId(subTaskId);
  if (parentTaskId) {
    // Expand parent task in task list so subtask is visible
    taskListUIState.expandTask(parentTaskId);
  }

  // Select subtask
  this.#domain.selectSubTask(subTaskId);

  // Optional: Scroll to subtask
  // this.scrollToSubTask(subTaskId);
};
```

Update `handleGoToParentTask` to expand grandparent if needed:

```typescript
handleGoToParentTask = () => {
  const current = this.#store.currentItem;
  if (!isSubTask(current)) return;

  const parentTaskId = current.taskId;

  // Check if parent task is itself a subtask
  const parentTask = taskStore.getTaskById(parentTaskId);
  if (!parentTask) return;

  // If parent is a subtask of another task, we need to expand that task
  // Note: In current data model, tasks cannot be nested as subtasks of other tasks
  // This is for future-proofing if the model changes

  // Select parent task
  this.#domain.selectTask(parentTaskId);

  // Optional: Scroll to parent task
  // this.scrollToTask(parentTaskId);
};
```

## Data Flow

### Subtask Click Flow

```
User clicks subtask in task detail
    ↓
handleSubTaskClick(subTaskId)
    ↓
1. Get subtask and parent task ID
2. taskListUIState.expandTask(parentTaskId)
3. selectionStore.selectSubTask(subTaskId)
    ↓
Task list updates:
  - Parent task accordion expands
  - Subtask is highlighted
  - Task detail shows subtask
```

### Go to Parent Task Flow

```
User clicks "Go to Parent Task" button
    ↓
handleGoToParentTask()
    ↓
1. Get current subtask's parent task ID
2. selectionStore.selectTask(parentTaskId)
    ↓
Task list updates:
  - Parent task is highlighted
  - Task detail shows parent task
```

## Important Implementation Details

### Context Binding Issue

When passing store methods to domain actions, **do not pass methods directly** as this will cause loss of `this` context. Always wrap them in arrow functions:

```typescript
// ❌ INCORRECT - this context will be lost
const domainActions: TaskDetailDomainActions = {
  selectTask: selectionStore.selectTask,
  selectSubTask: selectionStore.selectSubTask
};

// ✅ CORRECT - wrap in arrow functions
const domainActions: TaskDetailDomainActions = {
  selectTask: (taskId: string | null) => selectionStore.selectTask(taskId),
  selectSubTask: (subTaskId: string | null) => selectionStore.selectSubTask(subTaskId)
};
```

This issue occurs because JavaScript method references lose their `this` binding when passed as standalone functions. The arrow function wrapper ensures the method is called with the correct context.

## Store Dependencies

```
TaskListUIState (new)
  ↓
TaskItem (component)
  - Uses: isTaskExpanded(taskId)
  - Calls: toggleTaskExpansion(taskId)

TaskDetailActions (service)
  - Calls: expandTask(taskId)
```

## Testing Strategy

### Unit Tests

1. **TaskListUIState Store**
   - Test `isTaskExpanded` returns correct state
   - Test `toggleTaskExpansion` toggles state correctly
   - Test `expandTask` expands task
   - Test `collapseTask` collapses task
   - Test `reset` clears all state

### Integration Tests

1. **Subtask Click Navigation**
   - Given: Task with subtasks, subtasks collapsed
   - When: User clicks subtask in task detail
   - Then: Subtasks expand in task list, subtask is selected

2. **Go to Parent Task Navigation**
   - Given: Subtask is selected in task detail
   - When: User clicks "Go to Parent Task"
   - Then: Parent task is selected and displayed in task detail

### E2E Tests

1. **Complete Subtask Navigation Flow**
   - Create task with subtasks
   - Collapse subtasks
   - Open task in task detail
   - Click subtask
   - Verify subtasks are expanded in task list
   - Verify subtask is selected and shown in detail

2. **Complete Parent Navigation Flow**
   - Select subtask
   - Open subtask in task detail
   - Click "Go to Parent Task"
   - Verify parent task is selected and shown in detail

## Migration Notes

### Breaking Changes

None - this is a pure addition of functionality.

### Deprecations

None

### Backward Compatibility

Fully backward compatible. The UI state store is a new addition and doesn't change existing APIs.

## Performance Considerations

1. **State Updates**: Using Svelte 5's `$state` with `SvelteSet` ensures automatic reactivity and minimal re-renders
2. **Set Operations**: Using `SvelteSet<string>` for O(1) lookup performance
3. **Memory**: Expansion state is only stored for expanded tasks, minimal memory impact
4. **Reactivity**: `SvelteSet` provides automatic reactivity without manual reassignment, improving performance

## Future Enhancements

1. **State Persistence**: Save expansion state to localStorage for persistence across app restarts
2. **Bulk Operations**: Add `expandAll()` and `collapseAll()` methods
3. **Animation**: Add smooth expand/collapse animations
4. **Keyboard Navigation**: Add keyboard shortcuts for expand/collapse
5. **Auto-scroll**: Implement automatic scrolling to selected task/subtask

## Related Documents

- [Store Architecture](./store-architecture.md)
- [Component Patterns](./component-patterns.md)
- [Svelte 5 Patterns](./svelte5-patterns.md)
