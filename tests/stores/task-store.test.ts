import { describe, test, expect, beforeEach } from 'vitest';
import { TaskStore } from '../../src/lib/stores/tasks.svelte';
import type { ProjectTree } from '$lib/types/project';

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
    store = new TaskStore();
  });

  describe('initialization', () => {
    test('should initialize with empty state', () => {
      expect(store.projects).toEqual([]);
      expect(store.selectedTaskId).toBeNull();
      expect(store.selectedSubTaskId).toBeNull();
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

    test('overdueTasks should not include completed tasks', () => {
      // Complete the overdue task
      store.updateTask('task-2', { status: 'completed' });

      const overdueTasks = store.overdueTasks;
      expect(overdueTasks).toHaveLength(0);
    });

    test('selectedTask should return the selected task', () => {
      store.selectTask('task-1');

      const selectedTask = store.selectedTask;
      expect(selectedTask?.id).toBe('task-1');
      expect(selectedTask?.title).toBe('Test Task 1');
    });

    test('selectedTask should return null when no task is selected', () => {
      expect(store.selectedTask).toBeNull();
    });

    test('selectedSubTask should return the selected subtask', () => {
      store.selectSubTask('subtask-1');

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
      store.selectedSubTaskId = 'subtask-1';

      store.selectTask('task-1');

      expect(store.selectedTaskId).toBe('task-1');
      expect(store.selectedSubTaskId).toBeNull();
    });

    test('selectSubTask should set selectedSubTaskId and clear selectedTaskId', () => {
      store.selectedTaskId = 'task-1';

      store.selectSubTask('subtask-1');

      expect(store.selectedSubTaskId).toBe('subtask-1');
      expect(store.selectedTaskId).toBeNull();
    });

    test('selectProject should set selectedProjectId', () => {
      store.selectProject('project-1');

      expect(store.selectedProjectId).toBe('project-1');
    });

    test('selectList should set selectedListId', () => {
      store.selectList('list-1');

      expect(store.selectedListId).toBe('list-1');
    });
  });

  describe('task operations', () => {
    beforeEach(() => {
      store.setProjects([createMockProject()]);
    });

    test('updateTask should update task properties', () => {
      const updateTime = new Date();

      store.updateTask('task-1', { title: 'Updated Task', status: 'completed' });

      const updatedTask = store.allTasks.find((t) => t.id === 'task-1');
      expect(updatedTask?.title).toBe('Updated Task');
      expect(updatedTask?.status).toBe('completed');
      expect(updatedTask?.updatedAt.getTime()).toBeGreaterThanOrEqual(updateTime.getTime());
    });

    test('toggleTaskStatus should toggle between completed and not_started', () => {
      // Toggle to completed
      store.toggleTaskStatus('task-1');
      let task = store.allTasks.find((t) => t.id === 'task-1');
      expect(task?.status).toBe('completed');

      // Toggle back to not_started
      store.toggleTaskStatus('task-1');
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

      const newTask = await store.addTask('list-1', newTaskData);

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
      const result = await store.addTask('non-existent-list', {
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

    test('deleteTask should remove the task and clear selection if selected', () => {
      store.selectTask('task-1');

      store.deleteTask('task-1');

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

      store.updateSubTask('subtask-1', { title: 'Updated SubTask', status: 'completed' });

      const parentTask = store.allTasks.find((t) => t.id === 'task-1');
      const updatedSubTask = parentTask?.subTasks.find((st) => st.id === 'subtask-1');

      expect(updatedSubTask?.title).toBe('Updated SubTask');
      expect(updatedSubTask?.status).toBe('completed');
      expect(updatedSubTask?.updatedAt.getTime()).toBeGreaterThanOrEqual(updateTime.getTime());
    });

    test('addSubTask should create new subtask with backend integration', async () => {
      const initialSubTaskCount =
        store.allTasks.find((t) => t.id === 'task-1')?.subTasks.length || 0;

      const newSubTask = await store.addSubTask('task-1', {
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
      const result = await store.addSubTask('non-existent-task', {
        title: 'Failed SubTask'
      });

      // Web版ではダミーデータが返されるため、タスクが見つからなくてもnullではない
      // しかし、ローカル状態には追加されない
      expect(result).not.toBeNull(); // バックエンドからはダミーデータが返される

      // しかし、実際のタスクリストには追加されていない
      const allTasks = store.allTasks;
      const hasSubTaskInAnyTask = allTasks.some((task) =>
        task.subTasks.some((subTask) => subTask.title === 'Failed SubTask')
      );
      expect(hasSubTaskInAnyTask).toBe(false);
    });

    test('deleteSubTask should remove the subtask and clear selection if selected', () => {
      store.selectSubTask('subtask-1');

      store.deleteSubTask('subtask-1');

      const parentTask = store.allTasks.find((t) => t.id === 'task-1');
      expect(parentTask?.subTasks).toHaveLength(0);
      expect(store.selectedSubTaskId).toBeNull();
    });
  });

  describe('subtask tag management', () => {
    beforeEach(() => {
      store.setProjects([createMockProject()]);
    });

    test('addTagToSubTask should be no-op without backend (graceful)', async () => {
      // First create a subtask
      const newSubTask = await store.addSubTask('task-1', {
        title: 'Tagged SubTask'
      });

      expect(newSubTask).not.toBeNull();

      if (newSubTask) {
        // Add tag to subtask
        await store.addTagToSubTask(newSubTask.id, 'urgent');

        const parentTask = store.allTasks.find((t) => t.id === 'task-1');
        const subTask = parentTask?.subTasks.find((st) => st.id === newSubTask.id);

        // バックエンド未モック時はタグは追加されない
        expect(subTask?.tags).toHaveLength(0);
      }
    });

    test('addTagToSubTask should not add duplicate tags (no-op without backend)', async () => {
      const newSubTask = await store.addSubTask('task-1', {
        title: 'Duplicate Tag Test SubTask'
      });

      if (newSubTask) {
        // Add same tag twice
        await store.addTagToSubTask(newSubTask.id, 'important');
        await store.addTagToSubTask(newSubTask.id, 'important');

        const parentTask = store.allTasks.find((t) => t.id === 'task-1');
        const subTask = parentTask?.subTasks.find((st) => st.id === newSubTask.id);

        // バックエンド未モック時は変化なし
        expect(subTask?.tags).toHaveLength(0);
      }
    });

    test('removeTagFromSubTask should be no-op when tag not present (graceful)', async () => {
      const newSubTask = await store.addSubTask('task-1', {
        title: 'Remove Tag Test SubTask'
      });

      if (newSubTask) {
        // バックエンド未モックのためタグは存在しないが、エラー無く実行できること
        const parentTask = store.allTasks.find((t) => t.id === 'task-1');
        const subTask = parentTask?.subTasks.find((st) => st.id === newSubTask.id);
        expect(subTask?.tags).toHaveLength(0);
        await store.removeTagFromSubTask(newSubTask.id, 'non-existent');
        const parentTaskAfter = store.allTasks.find((t) => t.id === 'task-1');
        const subTaskAfter = parentTaskAfter?.subTasks.find((st) => st.id === newSubTask.id);
        expect(subTaskAfter?.tags).toHaveLength(0);
      }
    });

    test('removeTagFromSubTask should handle non-existent tag gracefully', async () => {
      const newSubTask = await store.addSubTask('task-1', {
        title: 'Non-existent Tag Test SubTask'
      });

      if (newSubTask) {
        // Try to remove non-existent tag
        await store.removeTagFromSubTask(newSubTask.id, 'non-existent-tag-id');

        const parentTask = store.allTasks.find((t) => t.id === 'task-1');
        const subTask = parentTask?.subTasks.find((st) => st.id === newSubTask.id);

        expect(subTask?.tags).toHaveLength(0);
      }
    });

    test('addTagToSubTask should handle non-existent subtask gracefully', async () => {
      // Try to add tag to non-existent subtask
      await store.addTagToSubTask('non-existent-subtask', 'test-tag');

      // No error should be thrown, and existing data should remain unchanged
      const allTasks = store.allTasks;
      expect(allTasks).toHaveLength(3); // Original tasks should remain
    });
  });
});
