import { flushSync } from 'svelte';
import { runEffectRoot } from '../../helpers/effect-root.svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TaskDetailDialogsStore } from '$lib/stores/task-detail/task-detail-dialogs-store.svelte';
import { TaskDetailViewState } from '$lib/stores/task-detail/task-detail-view-state.svelte';
import { taskStore } from '$lib/stores/tasks.svelte';
import { selectionStore } from '$lib/stores/selection-store.svelte';
import type { TaskWithSubTasks } from '$lib/types/task';

function actions() {
  return {
    selectTask: vi.fn(),
    selectSubTask: vi.fn(),
    forceSelectTask: vi.fn(),
    forceSelectSubTask: vi.fn(),
    changeTaskStatus: vi.fn(),
    changeSubTaskStatus: vi.fn(),
    deleteTask: vi.fn(),
    deleteSubTask: vi.fn(),
    toggleSubTaskStatus: vi.fn(),
    addSubTask: vi.fn(),
    moveTaskToList: vi.fn()
  };
}

function mount(dialogActions = actions()) {
  let store!: TaskDetailDialogsStore;
  const stop = runEffectRoot(() => {
    store = new TaskDetailDialogsStore(new TaskDetailViewState(), dialogActions);
  });
  flushSync();
  return { store, stop, dialogActions };
}

describe('TaskDetailDialogsStore', () => {
  afterEach(() => {
    taskStore.clearPendingSelections();
    taskStore.draft.isNewTaskMode = false;
    taskStore.draft.newTaskDraft = null;
  });

  it('applies a pending task or subtask selection immediately when nothing is being drafted', () => {
    selectionStore.pendingTaskSelection = 'task-9';
    const first = mount();
    expect(first.dialogActions.forceSelectTask).toHaveBeenCalledWith('task-9');
    expect(first.store.showConfirmationDialog).toBe(false);
    first.stop();

    selectionStore.pendingSubTaskSelection = 'sub-9';
    const second = mount();
    expect(second.dialogActions.forceSelectSubTask).toHaveBeenCalledWith('sub-9');
    second.stop();
  });

  it('asks before discarding a titled draft, and runs an empty draft immediately', () => {
    taskStore.draft.isNewTaskMode = true;
    taskStore.draft.newTaskDraft = { id: 'draft', title: '  Buy milk  ' } as TaskWithSubTasks;
    const { store, stop } = mount();
    const keep = vi.fn();
    const replace = vi.fn();

    expect(store.showConfirmationIfNeeded(keep)).toBe(false);
    expect(keep).not.toHaveBeenCalled();
    expect(store.showConfirmationDialog).toBe(true);
    store.confirmDiscard();
    expect(keep).toHaveBeenCalledOnce();
    expect(store.pendingAction).toBeNull();

    store.showConfirmationIfNeeded(replace);
    store.cancelDiscard();
    expect(replace).not.toHaveBeenCalled();
    expect(store.showConfirmationDialog).toBe(false);

    taskStore.draft.newTaskDraft = { id: 'draft', title: '   ' } as TaskWithSubTasks;
    flushSync();
    const blank = vi.fn();
    expect(store.showConfirmationIfNeeded(blank)).toBe(true);
    expect(blank).toHaveBeenCalledOnce();
    stop();
  });

  it('prepares a task or subtask delete and confirms only the pending action', () => {
    const { store, stop, dialogActions } = mount();

    store.openDeleteDialog(true, 'sub-1');
    expect(store.deleteDialogTitle).toBe('delete_subtask_title');
    expect(store.showDeleteDialog).toBe(true);
    store.confirmDelete();
    expect(dialogActions.deleteSubTask).toHaveBeenCalledWith('sub-1');
    expect(store.pendingDeleteAction).toBeNull();

    store.openDeleteDialog(false, 'task-1');
    expect(store.deleteDialogTitle).toBe('delete_task_title');
    store.cancelDelete();
    expect(dialogActions.deleteTask).not.toHaveBeenCalled();
    expect(store.showDeleteDialog).toBe(false);
    stop();
  });
});
