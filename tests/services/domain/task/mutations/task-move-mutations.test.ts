/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { TaskMoveMutations } from '$lib/services/domain/task/mutations/task-move-mutations';
import type { TaskWithSubTasks } from '$lib/types/task';

const sampleTask = (): TaskWithSubTasks => ({
  id: 'task-1',
  projectId: 'project-1',
  listId: 'list-1',
  title: 'Sample',
  status: 'not_started',
  priority: 0,
  orderIndex: 0,
  isArchived: false,
  assignedUserIds: [],
  tagIds: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  subTasks: [],
  tags: []
});

const createDeps = () => {
  const task = sampleTask();
  const taskCoreStore = {
    moveTaskBetweenLists: vi.fn().mockReturnValue({
      task,
      sourceProject: { id: 'project-1' },
      sourceTaskList: { id: 'list-1', tasks: [] },
      sourceIndex: 0,
      targetProject: { id: 'project-2' },
      targetTaskList: { id: 'list-2', tasks: [] },
      targetIndex: 0
    }),
    restoreTaskMove: vi.fn()
  };

  const errorHandler = {
    addSyncError: vi.fn()
  };

  const taskService = {
    updateTask: vi.fn().mockResolvedValue(undefined)
  };

  return {
    taskCoreStore,
    errorHandler,
    taskService
  };
};

describe('TaskMoveMutations', () => {
  let deps: ReturnType<typeof createDeps>;
  let service: TaskMoveMutations;

  beforeEach(() => {
    deps = createDeps();
    service = new TaskMoveMutations(deps as any);
  });

  describe('moveTaskToList', () => {
    test('moves task to new list and syncs', async () => {
      await service.moveTaskToList('task-1', 'list-2');

      expect(deps.taskCoreStore.moveTaskBetweenLists).toHaveBeenCalledWith('task-1', 'list-2');
      expect(deps.taskService.updateTask).toHaveBeenCalledWith('project-2', 'task-1', {
        listId: 'list-2'
      });
    });

    test('restores move on sync failure', async () => {
      const moveContext = {
        task: sampleTask(),
        sourceProject: { id: 'project-1' },
        sourceTaskList: { id: 'list-1', tasks: [] },
        sourceIndex: 0,
        targetProject: { id: 'project-2' },
        targetTaskList: { id: 'list-2', tasks: [] },
        targetIndex: 0
      };
      deps.taskCoreStore.moveTaskBetweenLists.mockReturnValue(moveContext);
      const error = new Error('Sync failed');
      deps.taskService.updateTask.mockRejectedValue(error);

      await service.moveTaskToList('task-1', 'list-2');

      expect(deps.taskCoreStore.restoreTaskMove).toHaveBeenCalledWith(moveContext);
      expect(deps.errorHandler.addSyncError).toHaveBeenCalledWith(
        'タスク移動',
        'task',
        'task-1',
        error
      );
    });

    test('does nothing if move context is null', async () => {
      deps.taskCoreStore.moveTaskBetweenLists.mockReturnValue(null);

      await service.moveTaskToList('task-1', 'list-2');

      expect(deps.taskService.updateTask).not.toHaveBeenCalled();
    });

    test('updates task with correct project ID from target', async () => {
      const moveContext = {
        task: sampleTask(),
        sourceProject: { id: 'project-1' },
        sourceTaskList: { id: 'list-1', tasks: [] },
        sourceIndex: 0,
        targetProject: { id: 'project-3' },
        targetTaskList: { id: 'list-3', tasks: [] },
        targetIndex: 0
      };
      deps.taskCoreStore.moveTaskBetweenLists.mockReturnValue(moveContext);

      await service.moveTaskToList('task-1', 'list-3');

      expect(deps.taskService.updateTask).toHaveBeenCalledWith('project-3', 'task-1', {
        listId: 'list-3'
      });
    });
  });
});
