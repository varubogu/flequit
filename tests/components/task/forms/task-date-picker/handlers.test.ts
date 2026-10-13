import { beforeEach, describe, expect, it, vi } from 'vitest';

const { updateTask, saveRecurrence, updateSubTask, updateCoreTask } = vi.hoisted(() => ({
  updateTask: vi.fn(async (_taskId: string, _updates: Record<string, unknown>) => undefined),
  saveRecurrence: vi.fn(async () => undefined),
  updateSubTask: vi.fn(),
  updateCoreTask: vi.fn()
}));

vi.mock('$lib/services/domain/task', () => ({
  taskOperations: { updateTask }
}));
vi.mock('$lib/services/domain/recurrence-sync', () => ({
  RecurrenceSyncService: { save: saveRecurrence }
}));
vi.mock('$lib/stores/sub-task-store.svelte', () => ({
  subTaskStore: { updateSubTask }
}));
vi.mock('$lib/stores/task-core-store.svelte', () => ({
  taskCoreStore: { updateTask: updateCoreTask }
}));

import { createTaskDatePickerHandlers } from '$lib/components/task/forms/task-date-picker/handlers.svelte';
import type { SubTask } from '$lib/types/sub-task';
import type { TaskWithSubTasks } from '$lib/types/task';

function task(overrides: Partial<TaskWithSubTasks> = {}): TaskWithSubTasks {
  return {
    id: 'task-1',
    projectId: 'project-1',
    listId: 'list-1',
    title: 'Task',
    status: 'not_started',
    priority: 1,
    orderIndex: 0,
    isArchived: false,
    assignedUserIds: [],
    tagIds: [],
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-02T00:00:00Z'),
    updatedBy: 'user-1',
    subTasks: [],
    tags: [],
    planEndDate: new Date('2024-01-20T00:00:00Z'),
    ...overrides
  } as TaskWithSubTasks;
}

function subTask(overrides: Partial<SubTask> = {}): SubTask {
  return {
    id: 'sub-1',
    taskId: 'task-1',
    title: 'Sub',
    status: 'not_started',
    orderIndex: 0,
    completed: false,
    assignedUserIds: [],
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-02T00:00:00Z'),
    planEndDate: new Date('2024-01-18T00:00:00Z'),
    ...overrides
  };
}

function click(left = 20): MouseEvent {
  const target = document.createElement('button');
  target.getBoundingClientRect = () =>
    ({ left, bottom: 30, top: 0, right: 0, width: 0, height: 0, x: 0, y: 0, toJSON() {} }) as DOMRect;
  const event = new MouseEvent('click');
  Object.defineProperty(event, 'target', { value: target });
  return event;
}

describe('task date picker handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(400);
  });

  it('opens and closes the main picker and clamps the position', () => {
    const current = task();
    const mainState = { show: false, position: { x: 0, y: 0 } };
    const subTaskState = { show: true, editingSubTaskId: 'sub-1', position: { x: 0, y: 0 } };
    const handlers = createTaskDatePickerHandlers(() => current, mainState, subTaskState);

    handlers.handleDueDateClick(click(900));

    expect(subTaskState.show).toBe(false);
    expect(subTaskState.editingSubTaskId).toBeNull();
    expect(mainState.show).toBe(true);
    expect(mainState.position).toEqual({ x: 100, y: 38 });

    handlers.handleDatePickerClose();
    expect(mainState.show).toBe(false);
  });

  it('stores a range, a single date, and a range that reuses the current end date', async () => {
    const current = task();
    const handlers = createTaskDatePickerHandlers(
      () => current,
      { show: false, position: { x: 0, y: 0 } },
      { show: false, editingSubTaskId: null, position: { x: 0, y: 0 } }
    );

    await handlers.handleDateChange({
      date: '2024-02-01',
      dateTime: '2024-02-01T00:00:00Z',
      isRangeDate: true,
      range: { start: '2024-02-01T00:00:00Z', end: '2024-02-03T00:00:00Z' }
    });
    expect(updateTask).toHaveBeenCalledWith(
      'task-1',
      expect.objectContaining({ isRangeDate: true })
    );

    await handlers.handleDateChange({
      date: '2024-02-04',
      dateTime: '2024-02-04T00:00:00Z',
      isRangeDate: false
    });
    expect(updateTask).toHaveBeenLastCalledWith(
      'task-1',
      expect.objectContaining({ isRangeDate: false, planStartDate: undefined })
    );

    await handlers.handleDateChange({
      date: '2024-02-05',
      dateTime: '2024-02-05T00:00:00Z',
      isRangeDate: true
    });
    const reused = updateTask.mock.calls.at(-1)?.[1] as unknown as {
      planStartDate: Date;
      planEndDate: Date;
    };
    expect(reused.planStartDate.getTime()).toBe(reused.planEndDate.getTime());
  });

  it('saves a recurrence rule only after the backend accepts it', async () => {
    const current = task();
    const handlers = createTaskDatePickerHandlers(
      () => current,
      { show: false, position: { x: 0, y: 0 } },
      { show: false, editingSubTaskId: null, position: { x: 0, y: 0 } }
    );
    const recurrenceRule = { unit: 'day' as const, interval: 1 };

    saveRecurrence.mockResolvedValueOnce(undefined);
    await handlers.handleDateChange({
      date: '2024-02-01',
      dateTime: '2024-02-01T00:00:00Z',
      isRangeDate: false,
      recurrenceRule
    });
    expect(saveRecurrence).toHaveBeenCalledWith(
      expect.objectContaining({ itemId: 'task-1', isSubTask: false, userId: 'user-1' })
    );
    expect(updateCoreTask).toHaveBeenCalledWith('task-1', { recurrenceRule });

    saveRecurrence.mockRejectedValueOnce(new Error('offline'));
    await handlers.handleDateChange({
      date: '2024-02-01',
      dateTime: '2024-02-01T00:00:00Z',
      isRangeDate: false,
      recurrenceRule: null
    });
    expect(updateCoreTask).toHaveBeenCalledTimes(1);
  });

  it('does not save a recurrence rule without a project or user', async () => {
    const handlers = createTaskDatePickerHandlers(
      () => task({ projectId: '', updatedBy: undefined }),
      { show: false, position: { x: 0, y: 0 } },
      { show: false, editingSubTaskId: null, position: { x: 0, y: 0 } }
    );

    await handlers.handleDateChange({
      date: '2024-02-01',
      dateTime: '2024-02-01T00:00:00Z',
      isRangeDate: false,
      recurrenceRule: null
    });
    expect(saveRecurrence).not.toHaveBeenCalled();

    const withProject = createTaskDatePickerHandlers(
      () => task({ updatedBy: '' }),
      { show: false, position: { x: 0, y: 0 } },
      { show: false, editingSubTaskId: null, position: { x: 0, y: 0 } }
    );
    await withProject.handleDateChange({
      date: '2024-02-01',
      dateTime: '2024-02-01T00:00:00Z',
      isRangeDate: false,
      recurrenceRule: null
    });
    expect(saveRecurrence).not.toHaveBeenCalled();
  });

  it('clears task dates', async () => {
    const handlers = createTaskDatePickerHandlers(
      () => task(),
      { show: true, position: { x: 0, y: 0 } },
      { show: false, editingSubTaskId: null, position: { x: 0, y: 0 } }
    );

    await handlers.handleDateClear();
    expect(updateTask).toHaveBeenCalledWith(
      'task-1',
      expect.objectContaining({ planStartDate: undefined, planEndDate: undefined, isRangeDate: false })
    );
  });

  it('updates the edited subtask and ignores a missing selection', async () => {
    const current = task({ subTasks: [subTask(), subTask({ id: 'sub-2', planEndDate: undefined })] });
    const subTaskState = { show: false, editingSubTaskId: null as string | null, position: { x: 0, y: 0 } };
    const mainState = { show: true, position: { x: 0, y: 0 } };
    const handlers = createTaskDatePickerHandlers(() => current, mainState, subTaskState);

    await handlers.handleSubTaskDateChange({
      date: '2024-03-01',
      dateTime: '2024-03-01T00:00:00Z',
      isRangeDate: false
    });
    handlers.handleSubTaskDateClear();
    expect(updateSubTask).not.toHaveBeenCalled();
    expect(handlers.getEditingSubTask()).toBeNull();

    handlers.handleSubTaskDueDateClick(click(10), 'sub-1');
    expect(mainState.show).toBe(false);
    expect(subTaskState.editingSubTaskId).toBe('sub-1');
    expect(handlers.getEditingSubTask()?.id).toBe('sub-1');

    await handlers.handleSubTaskDateChange({
      date: '2024-03-01',
      dateTime: '2024-03-01T00:00:00Z',
      isRangeDate: true,
      range: { start: '2024-03-01T00:00:00Z', end: '2024-03-02T00:00:00Z' },
      recurrenceRule: { unit: 'week', interval: 1 }
    });
    expect(updateSubTask).toHaveBeenCalledWith('sub-1', expect.objectContaining({ isRangeDate: true }));
    expect(saveRecurrence).toHaveBeenCalledWith(expect.objectContaining({ isSubTask: true, itemId: 'sub-1' }));

    subTaskState.editingSubTaskId = 'missing';
    await handlers.handleSubTaskDateChange({
      date: '2024-03-01',
      dateTime: '2024-03-01T00:00:00Z',
      isRangeDate: false
    });

    subTaskState.editingSubTaskId = 'sub-2';
    await handlers.handleSubTaskDateChange({
      date: '2024-03-03',
      dateTime: '2024-03-03T00:00:00Z',
      isRangeDate: true
    });
    saveRecurrence.mockRejectedValueOnce(new Error('offline'));
    subTaskState.editingSubTaskId = 'sub-1';
    await handlers.handleSubTaskDateChange({
      date: '2024-03-04',
      dateTime: '2024-03-04T00:00:00Z',
      isRangeDate: false,
      recurrenceRule: null
    });

    handlers.handleSubTaskDateClear();
    expect(updateSubTask).toHaveBeenCalledWith('sub-1', {
      planStartDate: undefined,
      planEndDate: undefined,
      isRangeDate: false
    });
    handlers.handleSubTaskDatePickerClose();
    expect(subTaskState.show).toBe(false);
    expect(subTaskState.editingSubTaskId).toBeNull();
  });
});
