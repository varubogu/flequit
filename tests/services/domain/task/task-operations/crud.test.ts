import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Project } from '$lib/types/project';
import type { TaskWithSubTasks } from '$lib/types/task';
import type { TaskList } from '$lib/types/task-list';
import type {
  TaskMoveContext,
  TaskRemovalContext
} from '$lib/stores/task-core/task-core-operations.svelte';

const backend = vi.hoisted(() => ({
  createTaskWithSubTasks: vi.fn(),
  updateTaskWithSubTasks: vi.fn(),
  deleteTaskWithSubTasks: vi.fn()
}));

vi.mock('$lib/services/domain/task/task-backend', () => ({
  TaskBackend: backend
}));

vi.mock('$lib/services/domain/current-user-id', () => ({
  getCurrentUserId: () => 'user-1'
}));

import { TaskCrudOperations } from '$lib/services/domain/task/task-operations/crud';

function task(overrides: Partial<TaskWithSubTasks> = {}): TaskWithSubTasks {
  return {
    id: 'task-1',
    projectId: 'project-1',
    listId: 'list-1',
    title: 'Sample',
    status: 'not_started',
    priority: 2,
    orderIndex: 0,
    isArchived: false,
    assignedUserIds: [],
    tagIds: [],
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    deleted: false,
    updatedBy: 'user-1',
    subTasks: [],
    tags: [],
    ...overrides
  };
}

function createHarness() {
  const stored = task();
  const taskStore = {
    selectedTaskId: null as string | null,
    getTaskById: vi.fn((): TaskWithSubTasks | null => stored),
    getTaskProjectAndList: vi.fn((): { project: Project; taskList: TaskList } | null => ({
      project: { id: 'project-1' },
      taskList: { id: 'list-1' }
    }) as { project: Project; taskList: TaskList }),
    attachTagToTask: vi.fn(),
    detachTagFromTask: vi.fn(() => null)
  };
  const taskCoreStore = {
    insertTask: vi.fn(
      (_listId: string, created: TaskWithSubTasks): TaskWithSubTasks | null => created
    ),
    removeTask: vi.fn(
      (): TaskRemovalContext | null =>
        ({
          project: { id: 'project-1' },
          taskList: { id: 'list-1', tasks: [] },
          task: stored,
          index: 0
        }) as unknown as TaskRemovalContext
    ),
    restoreTask: vi.fn(),
    applyTaskUpdate: vi.fn((_taskId: string, updater: (item: TaskWithSubTasks) => void) => {
      updater(stored);
      return true;
    }),
    updateTask: vi.fn(() => false),
    moveTaskBetweenLists: vi.fn((): TaskMoveContext | null => null),
    restoreTaskMove: vi.fn()
  };
  const taskListStore = {
    getProjectIdByListId: vi.fn(() => 'project-1' as string | null)
  };
  const errorHandler = { addSyncError: vi.fn() };
  const operations = new TaskCrudOperations({
    taskStore,
    taskCoreStore,
    taskListStore,
    tagStore: { tags: [], addTagWithId: vi.fn() },
    errorHandler
  });

  return { operations, taskStore, taskCoreStore, taskListStore, errorHandler, stored };
}

describe('TaskCrudOperations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    backend.createTaskWithSubTasks.mockResolvedValue(undefined);
    backend.updateTaskWithSubTasks.mockResolvedValue(undefined);
    backend.deleteTaskWithSubTasks.mockResolvedValue(true);
    vi.stubGlobal('crypto', { randomUUID: () => 'created-task' });
  });

  it('returns null when the list does not belong to a project', async () => {
    const { operations, taskListStore, taskCoreStore } = createHarness();
    taskListStore.getProjectIdByListId.mockReturnValue(null);

    await expect(operations.addTask('missing', { title: 'Nope' })).resolves.toBeNull();
    expect(taskCoreStore.insertTask).not.toHaveBeenCalled();
  });

  it('creates a task with defaults, explicit values, and copied children', async () => {
    const { operations, taskCoreStore } = createHarness();
    const subTasks = [{ id: 'sub-1', title: 'Child' }] as TaskWithSubTasks['subTasks'];
    const tags = [{ id: 'tag-1', name: 'milk' }] as TaskWithSubTasks['tags'];

    const created = await operations.addTask('list-1', {
      title: '  Buy milk  ',
      status: 'waiting',
      priority: 1,
      orderIndex: 4,
      isArchived: true,
      planEndDate: new Date('2024-05-01T00:00:00Z'),
      isRangeDate: true,
      subTasks,
      tags
    });

    expect(created).toMatchObject({
      id: 'created-task',
      projectId: 'project-1',
      listId: 'list-1',
      title: 'Buy milk',
      status: 'waiting',
      priority: 1,
      orderIndex: 4,
      isArchived: true,
      isRangeDate: true,
      updatedBy: 'user-1',
      deleted: false
    });
    expect(created?.planEndDate).toEqual(new Date('2024-05-01T00:00:00Z'));
    expect(created?.subTasks).toEqual(subTasks);
    expect(created?.subTasks).not.toBe(subTasks);
    expect(created?.tags).toEqual(tags);
    expect(taskCoreStore.insertTask).toHaveBeenCalledWith('list-1', created);
    expect(backend.createTaskWithSubTasks).toHaveBeenCalledWith('list-1', created);
  });

  it('defaults a blank task to today at 23:59:59 and rolls back a failed insert', async () => {
    const { operations, taskCoreStore, errorHandler } = createHarness();
    const created = await operations.addTask('list-1', {});
    expect(created?.title).toBe('');
    expect(created?.status).toBe('not_started');
    expect(created?.priority).toBe(2);
    expect(created?.orderIndex).toBe(0);
    expect(created?.planEndDate?.getHours()).toBe(23);
    expect(created?.planEndDate?.getMinutes()).toBe(59);
    expect(created?.subTasks).toEqual([]);
    expect(created?.tags).toEqual([]);

    taskCoreStore.insertTask.mockReturnValueOnce(null);
    await expect(operations.addTask('list-1', { title: 'Lost' })).resolves.toBeNull();
    expect(backend.createTaskWithSubTasks).toHaveBeenCalledTimes(1);

    const failure = new Error('create failed');
    backend.createTaskWithSubTasks.mockRejectedValueOnce(failure);
    await expect(operations.addTask('list-1', { title: 'Retry' })).resolves.toBeNull();
    expect(taskCoreStore.removeTask).toHaveBeenCalledWith('created-task');
    expect(errorHandler.addSyncError).toHaveBeenCalledWith(
      'タスク作成',
      'task',
      'created-task',
      failure
    );
  });

  it('stops an update when the task context, task, or local apply is missing', async () => {
    const { operations, taskStore, taskCoreStore } = createHarness();
    taskStore.getTaskProjectAndList.mockReturnValueOnce(null);
    await operations.updateTask('task-1', { title: 'A' });
    expect(taskStore.getTaskById).not.toHaveBeenCalled();

    taskStore.getTaskById.mockReturnValueOnce(null);
    await operations.updateTask('task-1', { title: 'B' });
    expect(taskCoreStore.applyTaskUpdate).not.toHaveBeenCalled();

    taskCoreStore.applyTaskUpdate.mockReturnValueOnce(false);
    await operations.updateTask('task-1', { title: 'C' });
    expect(backend.updateTaskWithSubTasks).not.toHaveBeenCalled();
  });

  it('updates the backend and restores the snapshot when persistence fails', async () => {
    const { operations, stored, errorHandler } = createHarness();
    stored.title = 'Before';

    await operations.updateTask('task-1', { title: 'After' });
    expect(stored.title).toBe('After');
    expect(backend.updateTaskWithSubTasks).toHaveBeenCalledWith('project-1', 'task-1', {
      title: 'After'
    });

    stored.title = 'Before';
    const failure = new Error('update failed');
    backend.updateTaskWithSubTasks.mockRejectedValueOnce(failure);
    await operations.updateTask('task-1', { title: 'Broken' });
    expect(stored.title).toBe('Before');
    expect(errorHandler.addSyncError).toHaveBeenCalledWith('タスク更新', 'task', 'task-1', failure);
  });

  it('maps form fields and treats an empty description as absent', async () => {
    const { operations } = createHarness();
    const start = new Date('2024-06-01T00:00:00Z');
    const end = new Date('2024-06-02T00:00:00Z');

    await operations.updateTaskFromForm('task-1', {
      title: 'Form',
      description: '',
      priority: 3
    });
    expect(backend.updateTaskWithSubTasks).toHaveBeenLastCalledWith('project-1', 'task-1', {
      title: 'Form',
      description: undefined,
      priority: 3,
      planStartDate: undefined,
      planEndDate: undefined,
      isRangeDate: false
    });

    await operations.updateTaskFromForm('task-1', {
      title: 'Range',
      description: 'notes',
      priority: 1,
      planStartDate: start,
      planEndDate: end,
      isRangeDate: true
    });
    expect(backend.updateTaskWithSubTasks).toHaveBeenLastCalledWith(
      'project-1',
      'task-1',
      expect.objectContaining({
        description: 'notes',
        planStartDate: start,
        planEndDate: end,
        isRangeDate: true
      })
    );
  });

  it('clears selection only for the deleted task and restores it when delete fails', async () => {
    const { operations, taskStore, taskCoreStore, errorHandler } = createHarness();
    taskStore.selectedTaskId = 'other';
    await operations.deleteTask('task-1');
    expect(taskStore.selectedTaskId).toBe('other');
    expect(backend.deleteTaskWithSubTasks).toHaveBeenCalledWith('project-1', 'task-1');

    taskCoreStore.removeTask.mockReturnValueOnce(null);
    await operations.deleteTask('task-1');
    expect(backend.deleteTaskWithSubTasks).toHaveBeenCalledTimes(1);

    taskStore.selectedTaskId = 'task-1';
    const failure = new Error('delete failed');
    backend.deleteTaskWithSubTasks.mockRejectedValueOnce(failure);
    await operations.deleteTask('task-1');
    expect(taskStore.selectedTaskId).toBeNull();
    expect(taskCoreStore.restoreTask).toHaveBeenCalled();
    expect(errorHandler.addSyncError).toHaveBeenCalledWith('タスク削除', 'task', 'task-1', failure);
  });

  it('moves the due date to the view horizon and ignores unknown views', async () => {
    const { operations } = createHarness();
    const today = new Date();

    await operations.updateTaskDueDateForView('task-1', 'unknown');
    expect(backend.updateTaskWithSubTasks).not.toHaveBeenCalled();

    await operations.updateTaskDueDateForView('task-1', 'today');
    const todayDue = backend.updateTaskWithSubTasks.mock.calls[0][2].planEndDate as Date;
    expect(todayDue.toDateString()).toBe(today.toDateString());

    await operations.updateTaskDueDateForView('task-1', 'tomorrow');
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    expect(
      (backend.updateTaskWithSubTasks.mock.calls[1][2].planEndDate as Date).toDateString()
    ).toBe(tomorrow.toDateString());

    await operations.updateTaskDueDateForView('task-1', 'next3days');
    const inThreeDays = new Date(today);
    inThreeDays.setDate(today.getDate() + 3);
    expect(
      (backend.updateTaskWithSubTasks.mock.calls[2][2].planEndDate as Date).toDateString()
    ).toBe(inThreeDays.toDateString());

    await operations.updateTaskDueDateForView('task-1', 'nextweek');
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    expect(
      (backend.updateTaskWithSubTasks.mock.calls[3][2].planEndDate as Date).toDateString()
    ).toBe(nextWeek.toDateString());

    await operations.updateTaskDueDateForView('task-1', 'thismonth');
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    expect(
      (backend.updateTaskWithSubTasks.mock.calls[4][2].planEndDate as Date).toDateString()
    ).toBe(endOfMonth.toDateString());
  });
});
