import { describe, test, expect, beforeEach } from 'vitest';
import { TaskStore } from '../../src/lib/stores/tasks.svelte';
import type { ProjectTree } from '../../src/lib/types/task';

describe('TaskStore', () => {
  let store: TaskStore;

  const createMockProject = (): ProjectTree => ({
    id: 'project-1',
    name: 'Test Project',
    order_index: 0,
    is_archived: false,
    created_at: new Date(),
    updated_at: new Date(),
    task_lists: [
      {
        id: 'list-1',
        project_id: 'project-1',
        name: 'Test List',
        order_index: 0,
        is_archived: false,
        created_at: new Date(),
        updated_at: new Date(),
        tasks: [
          {
            id: 'task-1',
            list_id: 'list-1',
            title: 'Test Task 1',
            status: 'not_started',
            priority: 1,
            order_index: 0,
            is_archived: false,
            end_date: new Date('2030-12-31'), // Far future date
            created_at: new Date(),
            updated_at: new Date(),
            sub_tasks: [
              {
                id: 'subtask-1',
                task_id: 'task-1',
                title: 'Test SubTask',
                status: 'not_started',
                order_index: 0,
                created_at: new Date(),
                updated_at: new Date(),
                tags: []
              }
            ],
            tags: []
          },
          {
            id: 'task-2',
            list_id: 'list-1',
            title: 'Overdue Task',
            status: 'not_started',
            priority: 2,
            order_index: 1,
            is_archived: false,
            end_date: new Date('2020-01-01'), // Past date
            created_at: new Date(),
            updated_at: new Date(),
            sub_tasks: [],
            tags: []
          },
          {
            id: 'task-3',
            list_id: 'list-1',
            title: 'Today Task',
            status: 'not_started',
            priority: 1,
            order_index: 2,
            is_archived: false,
            end_date: (() => {
              const today = new Date();
              today.setHours(23, 59, 59, 999); // Set to end of today
              return today;
            })(),
            created_at: new Date(),
            updated_at: new Date(),
            sub_tasks: [],
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
      expect(updatedTask?.updated_at.getTime()).toBeGreaterThanOrEqual(updateTime.getTime());
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

    test('addTask should add a new task to the specified list', () => {
      const newTaskData = {
        list_id: 'list-1',
        title: 'New Task',
        status: 'not_started' as const,
        priority: 1,
        order_index: 3,
        is_archived: false
      };

      const newTask = store.addTask('list-1', newTaskData);

      expect(newTask).not.toBeNull();
      expect(newTask?.title).toBe('New Task');
      expect(newTask?.id).toBeDefined();
      expect(newTask?.created_at).toBeDefined();
      expect(newTask?.updated_at).toBeDefined();
      expect(newTask?.sub_tasks).toEqual([]);
      expect(newTask?.tags).toEqual([]);

      const allTasks = store.allTasks;
      expect(allTasks).toHaveLength(4);
    });

    test('addTask should return null for non-existent list', () => {
      const result = store.addTask('non-existent-list', {
        list_id: 'non-existent-list',
        title: 'New Task',
        status: 'not_started',
        priority: 1,
        order_index: 0,
        is_archived: false
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
      const updatedSubTask = parentTask?.sub_tasks.find((st) => st.id === 'subtask-1');

      expect(updatedSubTask?.title).toBe('Updated SubTask');
      expect(updatedSubTask?.status).toBe('completed');
      expect(updatedSubTask?.updated_at.getTime()).toBeGreaterThanOrEqual(updateTime.getTime());
    });

    test('deleteSubTask should remove the subtask and clear selection if selected', () => {
      store.selectSubTask('subtask-1');

      store.deleteSubTask('subtask-1');

      const parentTask = store.allTasks.find((t) => t.id === 'task-1');
      expect(parentTask?.sub_tasks).toHaveLength(0);
      expect(store.selectedSubTaskId).toBeNull();
    });
  });
});
