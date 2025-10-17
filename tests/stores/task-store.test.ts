import { describe, test, expect, beforeEach, vi } from 'vitest';
import { TaskStore } from '../../src/lib/stores/tasks.svelte';
import { selectionStore } from '../../src/lib/stores/selection-store.svelte';
import { projectStore } from '../../src/lib/stores/project-store.svelte';
import { taskListStore } from '../../src/lib/stores/task-list-store.svelte';
import { subTaskStore } from '../../src/lib/stores/sub-task-store.svelte';
import { taskCoreStore } from '$lib/stores/task-core-store.svelte';
import { TaskMutations } from '$lib/services/domain/task/task-mutations';
import type { ProjectTree } from '$lib/types/project';

function createTaskMutations(store: TaskStore) {
  return new TaskMutations({
    taskStore: store as any,
    taskCoreStore,
    taskListStore,
    tagStore: { tags: [] } as any,
    taggingService: {
      createTaskTag: vi.fn(),
      deleteTaskTag: vi.fn()
    } as any,
    errorHandler: {
      addSyncError: vi.fn()
    } as any,
    taskService: {
      createTaskWithSubTasks: vi.fn().mockResolvedValue(undefined),
      updateTaskWithSubTasks: vi.fn().mockResolvedValue(undefined),
      deleteTaskWithSubTasks: vi.fn().mockResolvedValue(true),
      updateTask: vi.fn().mockResolvedValue(undefined)
    } as any,
    recurrenceService: {
      scheduleNextOccurrence: vi.fn()
    } as any
  } as any);
}

describe('TaskStore', () => {
  let store: TaskStore;

  const createMockProject = (): ProjectTree => ({
    id: 'project-1',
    name: 'Test Project',
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
        tasks: [
          {
            id: 'task-1',
            projectId: 'proj-1',
            listId: 'list-1',
            title: 'Test Task 1',
            status: 'not_started',
            priority: 1,
            assignedUserIds: [],
            tagIds: [],
            orderIndex: 0,
            isArchived: false,
            planEndDate: new Date('2030-12-31'), // Far future date
            createdAt: new Date(),
            updatedAt: new Date(),
            subTasks: [
              {
                id: 'subtask-1',
                taskId: 'task-1',
                title: 'Test SubTask',
                status: 'not_started',
                orderIndex: 0,
                completed: false,
                assignedUserIds: [],
                createdAt: new Date(),
                updatedAt: new Date(),
                tags: []
              }
            ],
            tags: []
          },
          {
            id: 'task-2',
            projectId: 'proj-1',
            listId: 'list-1',
            title: 'Overdue Task',
            status: 'not_started',
            priority: 2,
            assignedUserIds: [],
            tagIds: [],
            orderIndex: 1,
            isArchived: false,
            planEndDate: new Date('2020-01-01'), // Past date
            createdAt: new Date(),
            updatedAt: new Date(),
            subTasks: [],
            tags: []
          },
          {
            id: 'task-3',
            projectId: 'proj-1',
            listId: 'list-1',
            title: 'Today Task',
            status: 'not_started',
            priority: 1,
            assignedUserIds: [],
            tagIds: [],
            orderIndex: 2,
            isArchived: false,
            planEndDate: (() => {
              const today = new Date();
              today.setHours(23, 59, 59, 999); // Set to end of today
              return today;
            })(),
            createdAt: new Date(),
            updatedAt: new Date(),
            subTasks: [],
            tags: []
          }
        ]
      }
    ]
  });

  beforeEach(() => {
    selectionStore.reset(); // SelectionStoreをリセット
    projectStore.reset(); // ProjectStoreをリセット
    taskListStore.reset(); // TaskListStoreをリセット
    subTaskStore.reset(); // SubTaskStoreをリセット
    store = new TaskStore();
  });

  describe('initialization', () => {
    test('should initialize with empty state', () => {
      expect(store.projects).toEqual([]);
      expect(store.selectedTaskId).toBeNull();
      expect(selectionStore.selectedSubTaskId).toBeNull();
      expect(store.selectedProjectId).toBeNull();
      expect(store.selectedListId).toBeNull();
    });
  });

  describe('setProjects', () => {
    test('should set projects correctly', () => {
      const projects = [createMockProject()];
      store.setProjects(projects);

      expect(store.projects).toEqual(projects);
    });

    test('should keep taskCoreStore in sync for new task lists', async () => {
      const projects = [createMockProject()];
      store.setProjects(projects);

      const project = projectStore.projects[0];
      const newListId = 'list-2';
      project.taskLists.push({
        id: newListId,
        projectId: project.id,
        name: 'Additional List',
        orderIndex: 1,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        tasks: []
      });

      const newTask = await taskCoreStore.addTask(newListId, {
        projectId: project.id,
        listId: newListId,
        title: 'Synced Task',
        status: 'not_started',
        priority: 0,
        assignedUserIds: [],
        tagIds: [],
        orderIndex: 0,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      expect(newTask).not.toBeNull();
      expect(taskCoreStore.projects).toBe(projectStore.projects);
    });
  });

  describe('computed values', () => {
    beforeEach(() => {
      store.setProjects([createMockProject()]);
    });

    test('allTasks should return all tasks from all projects', () => {
      const allTasks = store.allTasks;

      expect(allTasks).toHaveLength(3);
      expect(allTasks.map((t) => t.id)).toContain('task-1');
      expect(allTasks.map((t) => t.id)).toContain('task-2');
      expect(allTasks.map((t) => t.id)).toContain('task-3');
    });

    test('todayTasks should return tasks due today', () => {
      const todayTasks = store.todayTasks;

      expect(todayTasks).toHaveLength(1);
      expect(todayTasks[0].id).toBe('task-3');
    });

    test('overdueTasks should return overdue incomplete tasks', () => {
      const overdueTasks = store.overdueTasks;

      expect(overdueTasks).toHaveLength(1);
      expect(overdueTasks[0].id).toBe('task-2');
    });

    test('overdueTasks should not include completed tasks', async () => {
      // Complete the overdue task
      await taskCoreStore.updateTask('task-2', { status: 'completed' });

      const overdueTasks = store.overdueTasks;
      expect(overdueTasks).toHaveLength(0);
    });

    test('selectedTask should return the selected task', () => {
      selectionStore.selectTask('task-1');

      const selectedTask = store.selectedTask;
      expect(selectedTask?.id).toBe('task-1');
      expect(selectedTask?.title).toBe('Test Task 1');
    });

    test('selectedTask should return null when no task is selected', () => {
      expect(store.selectedTask).toBeNull();
    });

    test('selectedSubTask should return the selected subtask', () => {
      selectionStore.selectSubTask('subtask-1');

      const selectedSubTask = store.selectedSubTask;
      expect(selectedSubTask?.id).toBe('subtask-1');
      expect(selectedSubTask?.title).toBe('Test SubTask');
    });

    test('selectedSubTask should return null when no subtask is selected', () => {
      expect(store.selectedSubTask).toBeNull();
    });
  });

  describe('selection methods', () => {
    test('selectTask should set selectedTaskId and clear selectedSubTaskId', () => {
      selectionStore.selectedSubTaskId = 'subtask-1';

      selectionStore.selectTask('task-1');

      expect(store.selectedTaskId).toBe('task-1');
      expect(store.selectedSubTaskId).toBeNull();
    });

    test('selectSubTask should set selectedSubTaskId and clear selectedTaskId', () => {
      selectionStore.selectedTaskId = 'task-1';

      selectionStore.selectSubTask('subtask-1');

      expect(store.selectedSubTaskId).toBe('subtask-1');
      expect(store.selectedTaskId).toBeNull();
    });

    test('selectProject should set selectedProjectId', () => {
      selectionStore.selectProject('project-1');

      expect(store.selectedProjectId).toBe('project-1');
    });

    test('selectList should set selectedListId', () => {
      selectionStore.selectList('list-1');

      expect(store.selectedListId).toBe('list-1');
    });
  });

  describe('task operations', () => {
    beforeEach(() => {
      store.setProjects([createMockProject()]);
    });

    test('updateTask should update task properties', async () => {
      const updateTime = new Date();

      await taskCoreStore.updateTask('task-1', { title: 'Updated Task', status: 'completed' });

      const updatedTask = store.allTasks.find((t) => t.id === 'task-1');
      expect(updatedTask?.title).toBe('Updated Task');
      expect(updatedTask?.status).toBe('completed');
      expect(updatedTask?.updatedAt.getTime()).toBeGreaterThanOrEqual(updateTime.getTime());
    });

    test('toggleTaskStatus should toggle between completed and not_started', async () => {
      // Toggle to completed
      await taskCoreStore.toggleTaskStatus('task-1');
      let task = store.allTasks.find((t) => t.id === 'task-1');
      expect(task?.status).toBe('completed');

      // Toggle back to not_started
      await taskCoreStore.toggleTaskStatus('task-1');
      task = store.allTasks.find((t) => t.id === 'task-1');
      expect(task?.status).toBe('not_started');
    });

    test('addTask should add a new task to the specified list', async () => {
      const newTaskData = {
        projectId: 'proj-1',
        listId: 'list-1',
        title: 'New Task',
        status: 'not_started' as const,
        priority: 1,
        assignedUserIds: [],
        tagIds: [],
        orderIndex: 3,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const newTask = await taskCoreStore.addTask('list-1', newTaskData);

      expect(newTask).not.toBeNull();
      expect(newTask?.title).toBe('New Task');
      expect(newTask?.id).toBeDefined();
      expect(newTask?.createdAt).toBeDefined();
      expect(newTask?.updatedAt).toBeDefined();
      expect(newTask?.subTasks).toEqual([]);
      expect(newTask?.tags).toEqual([]);

      const allTasks = store.allTasks;
      expect(allTasks).toHaveLength(4);
    });

    test('addTask should return null for non-existent list', async () => {
      const result = await taskCoreStore.addTask('non-existent-list', {
        projectId: 'non-existent-proj',
        listId: 'non-existent-list',
        title: 'New Task',
        status: 'not_started',
        priority: 1,
        assignedUserIds: [],
        tagIds: [],
        orderIndex: 0,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      expect(result).toBeNull();
    });

    test('deleteTask should remove the task and clear selection if selected', async () => {
      selectionStore.selectTask('task-1');

      const taskMutations = createTaskMutations(store);
      await taskMutations.deleteTask('task-1');

      const allTasks = store.allTasks;
      expect(allTasks).toHaveLength(2);
      expect(allTasks.find((t) => t.id === 'task-1')).toBeUndefined();
      expect(store.selectedTaskId).toBeNull();
    });
  });

  describe('subtask operations', () => {
    beforeEach(() => {
      store.setProjects([createMockProject()]);
    });

    test('updateSubTask should update subtask properties', () => {
      const updateTime = new Date();

      subTaskStore.updateSubTask('subtask-1', { title: 'Updated SubTask', status: 'completed' });

      const parentTask = store.allTasks.find((t) => t.id === 'task-1');
      const updatedSubTask = parentTask?.subTasks.find((st) => st.id === 'subtask-1');

      expect(updatedSubTask?.title).toBe('Updated SubTask');
      expect(updatedSubTask?.status).toBe('completed');
      expect(updatedSubTask?.updatedAt.getTime()).toBeGreaterThanOrEqual(updateTime.getTime());
    });

    test('addSubTask should create new subtask with backends integration', async () => {
      const initialSubTaskCount =
        store.allTasks.find((t) => t.id === 'task-1')?.subTasks.length || 0;

      const newSubTask = await subTaskStore.addSubTask('task-1', {
        title: 'New SubTask',
        description: 'New subtask description',
        status: 'in_progress',
        priority: 2
      });

      expect(newSubTask).not.toBeNull();

      const parentTask = store.allTasks.find((t) => t.id === 'task-1');
      expect(parentTask?.subTasks).toHaveLength(initialSubTaskCount + 1);

      const addedSubTask = parentTask?.subTasks.find((st) => st.title === 'New SubTask');
      expect(addedSubTask?.title).toBe('New SubTask');
      expect(addedSubTask?.description).toBe('New subtask description');
      expect(addedSubTask?.status).toBe('in_progress');
      expect(addedSubTask?.priority).toBe(2);
      expect(addedSubTask?.id).toBeDefined();
      expect(parentTask?.id).toBe('task-1');
    });

    test('addSubTask should handle creation failure gracefully', async () => {
      const result = await subTaskStore.addSubTask('non-existent-task', {
        title: 'Failed SubTask'
      });

      // 失敗時は null が返され、ローカル状態にも変化がない
      expect(result).toBeNull();

      // 期待通り、実際のタスクリストには追加されていない
      const allTasks = store.allTasks;
      const hasSubTaskInAnyTask = allTasks.some((task) =>
        task.subTasks.some((subTask) => subTask.title === 'Failed SubTask')
      );
      expect(hasSubTaskInAnyTask).toBe(false);
    });

    test('deleteSubTask should remove the subtask and clear selection if selected', () => {
      selectionStore.selectSubTask('subtask-1');

      subTaskStore.deleteSubTask('subtask-1');

      const parentTask = store.allTasks.find((t) => t.id === 'task-1');
      expect(parentTask?.subTasks).toHaveLength(0);
      expect(selectionStore.selectedSubTaskId).toBeNull();
    });
  });

  describe('subtask tag management', () => {
    beforeEach(() => {
      store.setProjects([createMockProject()]);
    });

    test('addTagToSubTask should be no-op without backends (graceful)', async () => {
      // First create a subtask
      const newSubTask = await subTaskStore.addSubTask('task-1', {
        title: 'Tagged SubTask'
      });

      expect(newSubTask).not.toBeNull();

      if (newSubTask) {
        // Add tag to subtask
        await subTaskStore.addTagToSubTask(newSubTask.id, 'urgent');

        const parentTask = store.allTasks.find((t) => t.id === 'task-1');
        const subTask = parentTask?.subTasks.find((st) => st.id === newSubTask.id);

        // バックエンド未モック時はタグは追加されない
        expect(subTask?.tags).toHaveLength(0);
      }
    });

    test('addTagToSubTask should not add duplicate tags (no-op without backends)', async () => {
      const newSubTask = await subTaskStore.addSubTask('task-1', {
        title: 'Duplicate Tag Test SubTask'
      });

      if (newSubTask) {
        // Add same tag twice
        await subTaskStore.addTagToSubTask(newSubTask.id, 'important');
        await subTaskStore.addTagToSubTask(newSubTask.id, 'important');

        const parentTask = store.allTasks.find((t) => t.id === 'task-1');
        const subTask = parentTask?.subTasks.find((st) => st.id === newSubTask.id);

        // バックエンド未モック時は変化なし
        expect(subTask?.tags).toHaveLength(0);
      }
    });

    test('removeTagFromSubTask should be no-op when tag not present (graceful)', async () => {
      const newSubTask = await subTaskStore.addSubTask('task-1', {
        title: 'Remove Tag Test SubTask'
      });

      if (newSubTask) {
        // バックエンド未モックのためタグは存在しないが、エラー無く実行できること
        const parentTask = store.allTasks.find((t) => t.id === 'task-1');
        const subTask = parentTask?.subTasks.find((st) => st.id === newSubTask.id);
        expect(subTask?.tags).toHaveLength(0);
        await subTaskStore.removeTagFromSubTask(newSubTask.id, 'non-existent');
        const parentTaskAfter = store.allTasks.find((t) => t.id === 'task-1');
        const subTaskAfter = parentTaskAfter?.subTasks.find((st) => st.id === newSubTask.id);
        expect(subTaskAfter?.tags).toHaveLength(0);
      }
    });

    test('removeTagFromSubTask should handle non-existent tag gracefully', async () => {
      const newSubTask = await subTaskStore.addSubTask('task-1', {
        title: 'Non-existent Tag Test SubTask'
      });

      if (newSubTask) {
        // Try to remove non-existent tag
        await subTaskStore.removeTagFromSubTask(newSubTask.id, 'non-existent-tag-id');

        const parentTask = store.allTasks.find((t) => t.id === 'task-1');
        const subTask = parentTask?.subTasks.find((st) => st.id === newSubTask.id);

        expect(subTask?.tags).toHaveLength(0);
      }
    });

    test('addTagToSubTask should handle non-existent subtask gracefully', async () => {
      // Try to add tag to non-existent subtask
      await subTaskStore.addTagToSubTask('non-existent-subtask', 'test-tag');

      // No error should be thrown, and existing data should remain unchanged
      const allTasks = store.allTasks;
      expect(allTasks).toHaveLength(3); // Original tasks should remain
    });
  });
});
