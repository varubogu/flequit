import { describe, test, expect, beforeEach, vi } from 'vitest';
import { SubTaskStore } from '../../src/lib/stores/sub-task-store.svelte';
import { ProjectStore } from '../../src/lib/stores/project-store.svelte';
import { selectionStore } from '../../src/lib/stores/selection-store.svelte';
import type { ProjectTree } from '$lib/types/project';
import type { TaskWithSubTasks } from '$lib/types/task';
import type { SubTaskWithTags } from '$lib/types/sub-task';

const { createSubTaskMock, updateSubTaskMock, deleteSubTaskMock } = vi.hoisted(() => {
  const createSubTask = vi.fn(
    async (_projectId: string, taskId: string, input: Record<string, unknown>) => ({
      id: `subtask-${crypto.randomUUID()}`,
      taskId,
      title: (input.title as string) ?? '',
      description: (input.description as string) ?? undefined,
      status:
        (input.status as 'not_started' | 'in_progress' | 'waiting' | 'completed' | 'cancelled') ??
        'not_started',
      priority: (input.priority as number | undefined) ?? 0,
      orderIndex: 0,
      completed: false,
      assignedUserIds: [],
      tagIds: [],
      createdAt: new Date(),
      updatedAt: new Date()
    })
  );

  const updateSubTask = vi.fn(async () => ({ success: true }));
  const deleteSubTask = vi.fn(async () => true);

  return {
    createSubTaskMock: createSubTask,
    updateSubTaskMock: updateSubTask,
    deleteSubTaskMock: deleteSubTask
  };
});

vi.mock('$lib/services/domain/subtask', () => {
  const subTaskBackend = {
    createSubTask: createSubTaskMock,
    updateSubTask: updateSubTaskMock,
    deleteSubTask: deleteSubTaskMock
  };

  return {
    SubTaskService: subTaskBackend,
    SubTaskBackend: subTaskBackend
  };
});

describe('SubTaskStore', () => {
  let store: SubTaskStore;
  let projectStore: ProjectStore;

  const createMockSubTask = (
    id: string = 'subtask-1',
    title: string = 'Test SubTask',
    taskId: string = 'task-1'
  ): SubTaskWithTags => ({
    id,
    taskId,
    title,
    description: 'Test Description',
    status: 'not_started',
    orderIndex: 0,
    completed: false,
    assignedUserIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: []
  });

  const createMockTask = (id: string = 'task-1', listId: string = 'list-1'): TaskWithSubTasks => ({
    id,
    projectId: 'project-1',
    listId,
    title: 'Test Task',
    status: 'not_started',
    priority: 1,
    assignedUserIds: [],
    tagIds: [],
    orderIndex: 0,
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    subTasks: [
      createMockSubTask('subtask-1', 'SubTask 1', id),
      createMockSubTask('subtask-2', 'SubTask 2', id)
    ],
    tags: []
  });

  const createMockProject = (): ProjectTree => ({
    id: 'project-1',
    name: 'Test Project',
    description: 'Test Description',
    color: '#FF0000',
    orderIndex: 0,
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    taskLists: [
      {
        id: 'list-1',
        projectId: 'project-1',
        name: 'Test List',
        orderIndex: 0,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        tasks: [createMockTask('task-1', 'list-1'), createMockTask('task-2', 'list-1')]
      }
    ],
    allTags: []
  });

  beforeEach(() => {
    vi.clearAllMocks();
    selectionStore.reset();
    projectStore = new ProjectStore(selectionStore);
    store = new SubTaskStore(projectStore, selectionStore);
  });

  describe('initialization', () => {
    test('should have no selected subtask initially', () => {
      expect(store.selectedSubTask).toBeNull();
    });
  });

  describe('selectedSubTask', () => {
    test('should return selected subtask when ID is set', () => {
      const project = createMockProject();
      projectStore.loadProjects([project]);
      selectionStore.selectSubTask('subtask-1');

      const selected = store.selectedSubTask;
      expect(selected).not.toBeNull();
      expect(selected?.id).toBe('subtask-1');
    });

    test('should return null when no subtask is selected', () => {
      const project = createMockProject();
      projectStore.loadProjects([project]);

      expect(store.selectedSubTask).toBeNull();
    });

    test('should return null when selected subtask does not exist', () => {
      const project = createMockProject();
      projectStore.loadProjects([project]);
      selectionStore.selectSubTask('non-existent');

      expect(store.selectedSubTask).toBeNull();
    });
  });

  describe('getTaskIdBySubTaskId', () => {
    test('should return task ID for existing subtask', () => {
      const project = createMockProject();
      projectStore.loadProjects([project]);

      const taskId = store.getTaskIdBySubTaskId('subtask-1');
      expect(taskId).toBe('task-1');
    });

    test('should return null for non-existent subtask', () => {
      const project = createMockProject();
      projectStore.loadProjects([project]);

      const taskId = store.getTaskIdBySubTaskId('non-existent');
      expect(taskId).toBeNull();
    });

    test('should find subtask across multiple tasks', () => {
      const project = createMockProject();
      // Ensure task-2 has unique subtasks
      project.taskLists[0].tasks[1].subTasks = [
        createMockSubTask('subtask-3', 'SubTask 3', 'task-2'),
        createMockSubTask('subtask-4', 'SubTask 4', 'task-2')
      ];
      projectStore.loadProjects([project]);

      expect(store.getTaskIdBySubTaskId('subtask-1')).toBe('task-1');
      expect(store.getTaskIdBySubTaskId('subtask-3')).toBe('task-2');
    });
  });

  describe('getProjectIdBySubTaskId', () => {
    test('should return project ID for existing subtask', () => {
      const project = createMockProject();
      projectStore.loadProjects([project]);

      const projectId = store.getProjectIdBySubTaskId('subtask-1');
      expect(projectId).toBe('project-1');
    });

    test('should return null for non-existent subtask', () => {
      const project = createMockProject();
      projectStore.loadProjects([project]);

      const projectId = store.getProjectIdBySubTaskId('non-existent');
      expect(projectId).toBeNull();
    });

    test('should traverse project hierarchy correctly', () => {
      const project = createMockProject();
      projectStore.loadProjects([project]);

      // Verify all subtasks return correct project ID
      expect(store.getProjectIdBySubTaskId('subtask-1')).toBe('project-1');
      expect(store.getProjectIdBySubTaskId('subtask-2')).toBe('project-1');
    });
  });

  describe('updateSubTask', () => {
    test('should update subtask properties', async () => {
      const project = createMockProject();
      projectStore.loadProjects([project]);

      await store.updateSubTask('subtask-1', { title: 'Updated Title' });

      const task = projectStore.projects[0].taskLists[0].tasks[0];
      const subtask = task.subTasks.find((st) => st.id === 'subtask-1');
      expect(subtask?.title).toBe('Updated Title');
    });

    test('should update updatedAt timestamp', async () => {
      const project = createMockProject();
      projectStore.loadProjects([project]);

      const originalDate = project.taskLists[0].tasks[0].subTasks[0].updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      await store.updateSubTask('subtask-1', { title: 'New Title' });

      const task = projectStore.projects[0].taskLists[0].tasks[0];
      const subtask = task.subTasks.find((st) => st.id === 'subtask-1');
      expect(subtask?.updatedAt.getTime()).toBeGreaterThan(originalDate.getTime());
    });
  });

  describe('deleteSubTask', () => {
    test('should remove subtask from task', async () => {
      const project = createMockProject();
      projectStore.loadProjects([project]);

      await store.deleteSubTask('subtask-1');

      const task = projectStore.projects[0].taskLists[0].tasks[0];
      expect(task.subTasks).toHaveLength(1);
      expect(task.subTasks.find((st) => st.id === 'subtask-1')).toBeUndefined();
    });

    test('should clear selection when deleting selected subtask', async () => {
      const project = createMockProject();
      projectStore.loadProjects([project]);
      selectionStore.selectSubTask('subtask-1');

      await store.deleteSubTask('subtask-1');

      expect(selectionStore.selectedSubTaskId).toBeNull();
    });

    test('should not affect other subtasks', async () => {
      const project = createMockProject();
      projectStore.loadProjects([project]);

      await store.deleteSubTask('subtask-1');

      const task = projectStore.projects[0].taskLists[0].tasks[0];
      expect(task.subTasks.find((st) => st.id === 'subtask-2')).toBeDefined();
    });
  });

  describe('reset', () => {
    test('should not affect project store data', () => {
      const project = createMockProject();
      projectStore.loadProjects([project]);

      store.reset();

      // SubTaskStore doesn't hold data, so reset() should be no-op
      expect(projectStore.projects).toHaveLength(1);
    });
  });
});
