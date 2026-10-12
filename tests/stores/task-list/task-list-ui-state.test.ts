import { describe, expect, it } from 'vitest';
import { TaskListUIState } from '$lib/stores/task-list/task-list-ui-state.svelte';

describe('TaskListUIState', () => {
  it('toggles, expands, and collapses a task only when the state actually changes', () => {
    const state = new TaskListUIState();

    expect(state.isTaskExpanded('task-1')).toBe(false);

    state.toggleTaskExpansion('task-1');
    expect(state.isTaskExpanded('task-1')).toBe(true);

    state.toggleTaskExpansion('task-1');
    expect(state.isTaskExpanded('task-1')).toBe(false);

    state.expandTask('task-1');
    state.expandTask('task-1');
    expect(state.isTaskExpanded('task-1')).toBe(true);

    state.collapseTask('task-2');
    expect(state.isTaskExpanded('task-2')).toBe(false);

    state.collapseTask('task-1');
    expect(state.isTaskExpanded('task-1')).toBe(false);

    state.expandAll(['task-1', 'task-2']);
    expect(state.isTaskExpanded('task-1')).toBe(true);
    expect(state.isTaskExpanded('task-2')).toBe(true);

    state.collapseAll();
    expect(state.isTaskExpanded('task-1')).toBe(false);
  });
});
