import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushSync } from 'svelte';
import { runEffectRoot } from '../../helpers/effect-root.svelte';
import type { TaskDetailViewState } from '$lib/stores/task-detail/task-detail-view-state.svelte';
import type { TaskEditActionsGateway } from '$lib/dependencies/task-detail';
import { createEditableView } from './editable-view.svelte';

const updateSubTask = vi.hoisted(() => vi.fn());

vi.mock('$lib/stores/sub-task-store.svelte', () => ({
  subTaskStore: { updateSubTask }
}));

import { TaskEditFormStore } from '$lib/stores/task-detail/task-edit-form-store.svelte';

function mountStore(
  view: ReturnType<typeof createEditableView>,
  gateway: TaskEditActionsGateway
) {
  let store!: TaskEditFormStore;
  const stop = runEffectRoot(() => {
    store = new TaskEditFormStore(view as unknown as TaskDetailViewState, gateway);
  });
  flushSync();
  return { store, stop };
}

describe('TaskEditFormStore', () => {
  let gateway: TaskEditActionsGateway;

  beforeEach(() => {
    vi.useRealTimers();
    updateSubTask.mockReset();
    gateway = {
      updateNewTaskData: vi.fn(),
      updateTask: vi.fn().mockResolvedValue(undefined)
    };
  });

  it('copies the current item into the form once and clears it when the item disappears', () => {
    const view = createEditableView();
    const { store, stop } = mountStore(view, gateway);

    expect(store.editForm.title).toBe('Original');
    expect(store.editForm.description).toBe('notes');
    expect(store.editForm.priority).toBe(2);
    expect(view.lastSyncedTaskId).toBe('task-1');
    expect(store.editFormForUI.recurrenceRule).toBeUndefined();

    view.currentItem = {
      id: 'task-1',
      title: 'Ignored because the id is already synced',
      description: 'notes',
      priority: 2
    };
    flushSync();
    expect(store.editForm.title).toBe('Original');

    view.currentItem = null;
    flushSync();
    expect(view.lastSyncedTaskId).toBeUndefined();

    view.currentItem = { id: 'task-2', title: 'Next', priority: 0 };
    flushSync();
    expect(store.editForm.title).toBe('Next');
    expect(store.editForm.description).toBe('');
    expect(store.editForm.priority).toBe(0);
    expect(store.editForm.is_range_date).toBe(false);
    expect(view.lastSyncedTaskId).toBe('task-2');
    stop();
  });

  it('debounces text edits into one save and drops a pending save on dispose', () => {
    vi.useFakeTimers();
    const view = createEditableView();
    const { store, stop } = mountStore(view, gateway);

    store.handleTitleChange('First');
    store.handleDescriptionChange('');
    store.handlePriorityChange(1);
    vi.advanceTimersByTime(499);
    expect(gateway.updateTask).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);

    expect(gateway.updateTask).toHaveBeenCalledTimes(1);
    expect(gateway.updateTask).toHaveBeenCalledWith('task-1', {
      title: 'First',
      description: undefined,
      priority: 1,
      planStartDate: undefined,
      planEndDate: undefined,
      isRangeDate: false,
      recurrenceRule: undefined
    });

    store.handleTitleChange('Second');
    store.dispose();
    vi.advanceTimersByTime(500);
    expect(gateway.updateTask).toHaveBeenCalledTimes(1);
    stop();
  });

  it('saves a new task, a subtask, or nothing when no item is selected', () => {
    const newTask = createEditableView();
    newTask.isNewTaskMode = true;
    const { store: newStore, stop: stopNew } = mountStore(newTask, gateway);
    newStore.handleDescriptionChange('draft');
    newStore.saveImmediately();
    expect(gateway.updateNewTaskData).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Original', description: 'draft' })
    );

    const subtask = createEditableView({ id: 'sub-1', title: 'Child' });
    subtask.isSubTask = true;
    const { store: subStore, stop: stopSub } = mountStore(subtask, gateway);
    subStore.saveImmediately();
    expect(updateSubTask).toHaveBeenCalledWith(
      'sub-1',
      expect.objectContaining({ title: 'Child' })
    );

    const empty = createEditableView(null);
    const { store: emptyStore, stop: stopEmpty } = mountStore(empty, gateway);
    emptyStore.queueSave();
    emptyStore.saveImmediately();
    expect(gateway.updateTask).not.toHaveBeenCalled();
    expect(gateway.updateNewTaskData).toHaveBeenCalledTimes(1);
    stopNew();
    stopSub();
    stopEmpty();
  });

  it('writes ranged dates, a single date, a cleared date, and a recurrence rule immediately', () => {
    const view = createEditableView();
    const { store, stop } = mountStore(view, gateway);
    const rule = { unit: 'week', interval: 1 } as const;

    store.updateDates({ start: '2024-03-01', end: '2024-03-05', isRange: true });
    expect(store.editForm.is_range_date).toBe(true);
    expect(store.editForm.plan_start_date?.toISOString().slice(0, 10)).toBe('2024-03-01');
    expect(store.editForm.plan_end_date?.toISOString().slice(0, 10)).toBe('2024-03-05');

    store.updateDates({ isRange: true });
    expect(store.editForm.plan_start_date).toBeUndefined();
    expect(store.editForm.plan_end_date).toBeUndefined();

    store.updateDates({ end: '2024-04-02', isRange: false });
    expect(store.editForm.is_range_date).toBe(false);
    expect(store.editForm.plan_start_date).toBeUndefined();
    expect(store.editForm.plan_end_date?.toISOString().slice(0, 10)).toBe('2024-04-02');

    store.updateDates({ isRange: false });
    expect(store.editForm.plan_end_date).toBeUndefined();

    store.clearDates();
    expect(store.editForm).toMatchObject({
      plan_start_date: undefined,
      plan_end_date: undefined,
      is_range_date: false
    });

    store.updateRecurrence(rule);
    expect(store.editForm.recurrenceRule).toEqual(rule);
    expect(gateway.updateTask).toHaveBeenLastCalledWith(
      'task-1',
      expect.objectContaining({ recurrenceRule: rule })
    );

    store.updateRecurrence(null);
    expect(store.editForm.recurrenceRule).toBeUndefined();
    expect(gateway.updateTask).toHaveBeenLastCalledWith(
      'task-1',
      expect.objectContaining({ recurrenceRule: undefined })
    );
    stop();
  });
});
