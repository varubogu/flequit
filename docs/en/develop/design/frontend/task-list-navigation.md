# Task Detail Navigation Design

Design for navigating between tasks and subtasks from the task detail screen.

> Canonical implementation sources are `src/lib/stores/task-list/` and `src/lib/services/ui/task/`.

## Requirements

### Navigation When Clicking a Subtask

When a subtask is clicked in task detail (task view):

1. Select the subtask in the task list
2. Display the subtask in the task detail view
3. Expand the parent task if it is collapsed
4. Optionally auto-scroll if the subtask is outside the viewport

### "Go to Parent Task" Button

When "Go to parent task" is clicked in task detail (subtask view):

1. Select the parent task in the task list
2. Display the parent task in the task detail view
3. If the parent task is itself a subtask of another task, expand the upper task
4. Optionally auto-scroll if the parent task is outside the viewport

## Architecture

### New Store: `TaskListUIState`

Dedicated store that manages UI state for the task list, including accordion expansion state.

Implementation reference: `src/lib/stores/task-list/task-list-ui-state.svelte.ts`

Main API:

- `isTaskExpanded(taskId): boolean` - checks whether a task is expanded
- `toggleTaskExpansion(taskId)` - toggles expansion
- `expandTask(taskId)` / `collapseTask(taskId)` - explicit expand/collapse
- `reset()` - clears all expansion state (for tests)

Implementation points:

- Use `SvelteSet<string>` (automatic reactivity + O(1) lookup)
- Initialize with `$state<SvelteSet<string>>(new SvelteSet())`
- No reassignment required (`SvelteSet` updates automatically on `add` / `delete`)

### Component Updates

Replace local `showSubTasks` state in `task-item.svelte` with store-driven `$derived(taskListUIState.isTaskExpanded(task.id))`. Toggle operations call `taskListUIState.toggleTaskExpansion(task.id)`.

### Service Layer Updates

Update the following in `task-detail-actions.ts`:

- `handleSubTaskClick(subTaskId)`: get parent task ID -> `taskListUIState.expandTask(parentTaskId)` -> `selectionStore.selectSubTask(subTaskId)`
- `handleGoToParentTask()`: get the current subtask's `taskId` -> `selectionStore.selectTask(parentTaskId)` (if the model later allows a parent task to be a subtask of another task, add logic to expand the grandparent task)

## Data Flow

### When Clicking a Subtask

```
User clicks a subtask in task detail
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
  - Subtask is displayed in task detail
```

### When Going to Parent Task

```
Click "Go to parent task"
    ↓
handleGoToParentTask()
    ↓
1. Get current subtask's parent task ID
2. selectionStore.selectTask(parentTaskId)
    ↓
Task list updates:
  - Parent task is highlighted
  - Parent task is displayed in task detail
```

## Important Implementation Notes

### Context Binding

When passing store methods to domain actions, **do not pass methods directly** because they lose their `this` context. Always wrap them in arrow functions:

- Bad: `selectTask: selectionStore.selectTask` (loses `this`)
- Good: `selectTask: (taskId) => selectionStore.selectTask(taskId)`

JavaScript method references lose their `this` binding when passed as standalone functions. Arrow-function wrappers preserve the correct context.

## Dependencies

```
TaskListUIState (new)
  ↓
TaskItem component
  - Uses: isTaskExpanded(taskId)
  - Calls: toggleTaskExpansion(taskId)

TaskDetailActions service
  - Calls: expandTask(taskId)
```

## Test Strategy

### Unit Tests (TaskListUIState)

- `isTaskExpanded` returns the correct state
- `toggleTaskExpansion` toggles state
- `expandTask` / `collapseTask` perform explicit operations
- `reset` clears all state

### Integration Tests

- **Subtask click**: collapsed state -> click in detail -> list expands + subtask selected
- **Go to parent task**: subtask is shown in detail -> button click -> parent task selected + shown in detail

### E2E

- Complete subtask navigation flow (create -> collapse -> click -> confirm expansion)
- Complete parent-task navigation flow

## Migration and Compatibility

- **Breaking changes**: none (pure feature addition)
- **Deprecated**: none
- **Backward compatibility**: fully compatible (UI state store is newly added; existing APIs are unchanged)

## Performance

- Automatic reactivity and minimal rerendering with `SvelteSet`
- O(1) lookup
- Expansion state stores only expanded tasks, minimizing memory impact
- No manual reassignment required

## Future Extensions

- **State persistence**: store expansion state in localStorage and preserve it after restart
- **Bulk operations**: add `expandAll()` / `collapseAll()`
- **Animation**: smooth expand/collapse
- **Keyboard navigation**: expand/collapse shortcuts
- **Auto-scroll**: automatically scroll to the selected task/subtask

## Related

- [Store & Service Architecture](./store-and-service-architecture.md)
- [Svelte 5 Patterns](./svelte5-patterns.md)
