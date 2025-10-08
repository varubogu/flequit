import { beforeEach, describe, expect, test, vi } from 'vitest';
import { TaskMutationService } from '$lib/services/task/task-mutation-service';
import type { TaskWithSubTasks } from '$lib/types/task';

const createDeps = () => {
  const mockTaskStore = {
    isNewTaskMode: false,
    pendingTaskSelection: null as string | null,
    pendingSubTaskSelection: null as string | null,
    selectedTaskId: null as string | null,
    getTaskById: vi.fn(),
    getTaskProjectAndList: vi.fn()
  };

  const mockTaskCoreStore = {
    toggleTaskStatus: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    addTask: vi.fn(),
    createRecurringTask: vi.fn()
  };

  const mockSubTaskStore = {
    addSubTask: vi.fn(),
    updateSubTask: vi.fn(),
    deleteSubTask: vi.fn(),
    attachTagToSubTask: vi.fn(),
    detachTagFromSubTask: vi.fn()
  };

  const mockTaskListStore = {
    getProjectIdByListId: vi.fn()
  };

  const mockTagStore = {
    tags: [] as Array<{ id: string; name: string }>
  };

  const mockTaggingService = {
    createTaskTag: vi.fn(),
    deleteTaskTag: vi.fn(),
    createSubtaskTag: vi.fn(),
    deleteSubtaskTag: vi.fn()
  };

  const mockErrorHandler = {
    addSyncError: vi.fn()
  };

  const mockRecurrenceService = {
    scheduleNextOccurrence: vi.fn()
  };

  return {
    taskStore: mockTaskStore,
    taskCoreStore: mockTaskCoreStore,
    subTaskStore: mockSubTaskStore,
    taskListStore: mockTaskListStore,
    tagStore: mockTagStore,
    taggingService: mockTaggingService,
    errorHandler: mockErrorHandler,
    recurrenceService: mockRecurrenceService
  };
};

describe('TaskMutationService with dependency injection', () => {
  let deps: ReturnType<typeof createDeps>;
  let service: TaskMutationService;

  beforeEach(() => {
    vi.useFakeTimers();
    deps = createDeps();
    service = new TaskMutationService(deps);
  });

  test('toggleTaskStatus awaits underlying store call', async () => {
    deps.taskCoreStore.toggleTaskStatus.mockResolvedValueOnce(undefined);

    const promise = service.toggleTaskStatus('task-1');

    await expect(promise).resolves.toBeUndefined();
    expect(deps.taskCoreStore.toggleTaskStatus).toHaveBeenCalledWith('task-1');
  });

  test('deleteTask clears selection and awaits deletion', async () => {
    deps.taskStore.selectedTaskId = 'task-1';
    deps.taskCoreStore.deleteTask.mockResolvedValueOnce(undefined);

    const promise = service.deleteTask('task-1');

    await expect(promise).resolves.toBeUndefined();
    expect(deps.taskStore.selectedTaskId).toBeNull();
    expect(deps.taskCoreStore.deleteTask).toHaveBeenCalledWith('task-1');
  });

  test('changeTaskStatus triggers recurrence scheduling when completed', async () => {
    const task: TaskWithSubTasks = {
      id: 'task-1',
      projectId: 'project-1',
      listId: 'list-1',
      title: 'recurring',
      status: 'not_started',
      priority: 0,
      orderIndex: 0,
      isArchived: false,
      assignedUserIds: [],
      tagIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      subTasks: [],
      tags: [],
      recurrenceRule: {
        unit: 'day',
        interval: 1
      }
    } as TaskWithSubTasks;

    deps.taskStore.getTaskById.mockReturnValue(task);
    deps.taskCoreStore.updateTask.mockResolvedValueOnce(undefined);

    await service.changeTaskStatus('task-1', 'completed');

    expect(deps.recurrenceService.scheduleNextOccurrence).toHaveBeenCalledWith(task);
    expect(deps.taskCoreStore.updateTask).toHaveBeenCalledWith('task-1', { status: 'completed' });
  });

  test('addTask resolves with created task when successful', async () => {
    const returnedTask = { id: 'new-task' } as TaskWithSubTasks;
    deps.taskListStore.getProjectIdByListId.mockReturnValue('project-1');
    deps.taskCoreStore.addTask.mockResolvedValueOnce(returnedTask);

    const result = await service.addTask('list-1', { title: 'New Task' });

    expect(result).toBe(returnedTask);
    expect(deps.taskCoreStore.addTask).toHaveBeenCalled();
  });

  test('addTask returns null when project resolution fails', async () => {
    deps.taskListStore.getProjectIdByListId.mockReturnValue(null);

    const result = await service.addTask('list-1', { title: 'New Task' });

    expect(result).toBeNull();
    expect(deps.taskCoreStore.addTask).not.toHaveBeenCalled();
  });
});
