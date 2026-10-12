import { beforeEach, describe, expect, it, vi } from 'vitest';

const { subTaskStore, taskCoreStore } = vi.hoisted(() => ({
  subTaskStore: { updateSubTask: vi.fn() },
  taskCoreStore: { updateTask: vi.fn() }
}));

vi.mock('$lib/stores/sub-task-store.svelte', () => ({ subTaskStore }));
vi.mock('$lib/stores/task-core-store.svelte', () => ({ taskCoreStore }));

import {
  handleRecurrenceChangeImpl,
  handleRecurrenceDialogCloseImpl,
  handleRecurrenceDialogOpenImpl
} from '$lib/services/ui/task-detail/task-detail-recurrence-handlers';
import type { TaskDetailRecurrenceActions } from '$lib/stores/task-detail/task-detail-types';
import type { TaskDetailViewStore } from '$lib/stores/task-detail-view-store.svelte';

function createStore(overrides: Record<string, unknown> = {}) {
  return {
    currentItem: { id: 'task-1', listId: 'list-1', subTasks: [], updatedBy: 'user-1' },
    isNewTaskMode: false,
    projectInfo: { project: { id: 'project-1' } },
    dialogs: {
      openRecurrenceDialog: vi.fn(),
      closeRecurrenceDialog: vi.fn()
    },
    ...overrides
  } as unknown as TaskDetailViewStore;
}

describe('task detail recurrence handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('opens or closes the dialog from an explicit boolean and defaults to close', () => {
    const store = createStore();

    handleRecurrenceDialogCloseImpl(store, true);
    handleRecurrenceDialogCloseImpl(store, false);
    handleRecurrenceDialogCloseImpl(store);
    handleRecurrenceDialogOpenImpl(store);

    expect(store.dialogs.openRecurrenceDialog).toHaveBeenCalledTimes(2);
    expect(store.dialogs.closeRecurrenceDialog).toHaveBeenCalledTimes(2);
  });

  it('returns early when there is no item, the form is new, or ids are missing', async () => {
    const recurrence = { save: vi.fn() } as unknown as TaskDetailRecurrenceActions;

    await handleRecurrenceChangeImpl(createStore({ currentItem: null }), recurrence, null);
    await handleRecurrenceChangeImpl(createStore({ isNewTaskMode: true }), recurrence, null);
    await handleRecurrenceChangeImpl(createStore({ projectInfo: null }), recurrence, null);
    await handleRecurrenceChangeImpl(
      createStore({ currentItem: { id: 'task-1', listId: 'list-1', subTasks: [] } }),
      recurrence,
      null
    );

    expect(recurrence.save).not.toHaveBeenCalled();
  });

  it('saves a task rule and writes it back to the task store', async () => {
    const store = createStore();
    const recurrence = { save: vi.fn().mockResolvedValue(undefined) } as unknown as TaskDetailRecurrenceActions;
    const rule = { unit: 'week', interval: 1 };

    await handleRecurrenceChangeImpl(store, recurrence, rule as never);

    expect(recurrence.save).toHaveBeenCalledWith({
      projectId: 'project-1',
      itemId: 'task-1',
      isSubTask: false,
      rule,
      userId: 'user-1'
    });
    expect(taskCoreStore.updateTask).toHaveBeenCalledWith('task-1', { recurrenceRule: rule });
    expect(store.dialogs.closeRecurrenceDialog).toHaveBeenCalled();
  });

  it('clears a subtask rule when the saved rule is null', async () => {
    const store = createStore({
      currentItem: { id: 'sub-1', taskId: 'task-1', updatedBy: 'user-1' }
    });
    const recurrence = { save: vi.fn().mockResolvedValue(undefined) } as unknown as TaskDetailRecurrenceActions;

    await handleRecurrenceChangeImpl(store, recurrence, null);

    expect(recurrence.save).toHaveBeenCalledWith(expect.objectContaining({ isSubTask: true, itemId: 'sub-1' }));
    expect(subTaskStore.updateSubTask).toHaveBeenCalledWith('sub-1', { recurrenceRule: undefined });
    expect(store.dialogs.closeRecurrenceDialog).toHaveBeenCalled();
  });

  it('keeps the dialog open when saving fails', async () => {
    const store = createStore();
    const recurrence = {
      save: vi.fn().mockRejectedValue(new Error('save failed'))
    } as unknown as TaskDetailRecurrenceActions;

    await handleRecurrenceChangeImpl(store, recurrence, null);

    expect(store.dialogs.closeRecurrenceDialog).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });
});
