import { describe, test, expect, beforeEach, vi } from 'vitest';
import { dataService } from '../../src/lib/services/data-service';
import * as backendIndex from '../../src/lib/services/backend/index';

// バックエンドサービスをモック化
vi.mock('../../src/lib/services/backend/index', () => ({
  getBackendService: vi.fn()
}));

describe('DataService', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockBackendService: any;

  beforeEach(() => {
    // DataServiceのbackendキャッシュをリセット
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (dataService as any).backend = null;

    // モックバックエンドサービスの設定
    mockBackendService = {
      project: {
        create: vi.fn().mockResolvedValue(true),
        update: vi.fn().mockResolvedValue(true),
        delete: vi.fn().mockResolvedValue(true),
        get: vi.fn().mockResolvedValue(null),
        search: vi.fn().mockResolvedValue([])
      },
      tasklist: {
        create: vi.fn().mockResolvedValue(true),
        update: vi.fn().mockResolvedValue(true),
        delete: vi.fn().mockResolvedValue(true),
        get: vi.fn().mockResolvedValue(null),
        search: vi.fn().mockResolvedValue([])
      },
      task: {
        create: vi.fn().mockResolvedValue(true),
        update: vi.fn().mockResolvedValue(true),
        delete: vi.fn().mockResolvedValue(true),
        get: vi.fn().mockResolvedValue(null),
        search: vi.fn().mockResolvedValue([])
      },
      subtask: {
        create: vi.fn().mockResolvedValue(true),
        update: vi.fn().mockResolvedValue(true),
        delete: vi.fn().mockResolvedValue(true),
        get: vi.fn().mockResolvedValue(null),
        search: vi.fn().mockResolvedValue([])
      },
      tag: {
        create: vi.fn().mockResolvedValue(true),
        update: vi.fn().mockResolvedValue(true),
        delete: vi.fn().mockResolvedValue(true),
        get: vi.fn().mockResolvedValue(null),
        search: vi.fn().mockResolvedValue([])
      }
    };

    vi.mocked(backendIndex.getBackendService).mockResolvedValue(mockBackendService);
  });

  describe('Project operations', () => {
    test('createProject should create a project and return it', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'Test Description',
        color: '#FF0000'
      };

      const result = await dataService.createProject(projectData);

      expect(result).toBeDefined();
      expect(result.name).toBe(projectData.name);
      expect(result.description).toBe(projectData.description);
      expect(result.color).toBe(projectData.color);
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeDefined();
      expect(result.updated_at).toBeDefined();
      expect(mockBackendService.project.create).toHaveBeenCalledOnce();
    });

    test('createProjectTree should create a project with empty task_lists', async () => {
      const projectData = {
        name: 'Test Project Tree',
        description: 'Test Description'
      };

      const result = await dataService.createProjectTree(projectData);

      expect(result).toBeDefined();
      expect(result.name).toBe(projectData.name);
      expect(result.task_lists).toEqual([]);
      expect(mockBackendService.project.create).toHaveBeenCalledOnce();
    });

    test('updateProject should update an existing project', async () => {
      const mockProject = {
        id: 'test-id',
        name: 'Original Name',
        description: 'Original Description',
        color: '#FF0000',
        order_index: 0,
        is_archived: false,
        created_at: new Date(),
        updated_at: new Date()
      };

      mockBackendService.project.get.mockResolvedValue(mockProject);

      const updates = { name: 'Updated Name' };
      const result = await dataService.updateProject('test-id', updates);

      expect(result).toBeDefined();
      expect(result?.name).toBe(updates.name);
      expect(mockBackendService.project.get).toHaveBeenCalledWith('test-id');
      expect(mockBackendService.project.update).toHaveBeenCalledOnce();
    });

    test('deleteProject should delete a project', async () => {
      const result = await dataService.deleteProject('test-id');

      expect(result).toBe(true);
      expect(mockBackendService.project.delete).toHaveBeenCalledWith('test-id');
    });
  });

  describe('TaskList operations', () => {
    test('createTaskList should create a task list and return it', async () => {
      const taskListData = {
        name: 'Test Task List',
        description: 'Test Description',
        color: '#00FF00'
      };

      const result = await dataService.createTaskList('project-id', taskListData);

      expect(result).toBeDefined();
      expect(result.name).toBe(taskListData.name);
      expect(result.project_id).toBe('project-id');
      expect(mockBackendService.tasklist.create).toHaveBeenCalledOnce();
    });

    test('createTaskListWithTasks should create a task list with empty tasks', async () => {
      const taskListData = {
        name: 'Test Task List With Tasks'
      };

      const result = await dataService.createTaskListWithTasks('project-id', taskListData);

      expect(result).toBeDefined();
      expect(result.name).toBe(taskListData.name);
      expect(result.tasks).toEqual([]);
      expect(mockBackendService.tasklist.create).toHaveBeenCalledOnce();
    });
  });

  describe('Task operations', () => {
    test('createTask should create a task and return it', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test Description',
        status: 'not_started' as const,
        priority: 1,
        order_index: 0,
        is_archived: false
      };

      const result = await dataService.createTask('list-id', taskData);

      expect(result).toBeDefined();
      expect(result.title).toBe(taskData.title);
      expect(result.list_id).toBe('list-id');
      expect(mockBackendService.task.create).toHaveBeenCalledOnce();
    });

    test('updateTaskWithSubTasks should handle updates with tags', async () => {
      const mockTask = {
        id: 'task-id',
        list_id: 'list-id',
        title: 'Test Task',
        status: 'not_started',
        priority: 1,
        order_index: 0,
        is_archived: false,
        created_at: new Date(),
        updated_at: new Date()
      };

      mockBackendService.task.get.mockResolvedValue(mockTask);

      await dataService.updateTaskWithSubTasks('task-id', { tags: [] });

      expect(mockBackendService.task.get).toHaveBeenCalledWith('task-id');
      expect(mockBackendService.task.update).toHaveBeenCalledOnce();
    });
  });

  describe('SubTask operations', () => {
    test('createSubTask should create a subtask and return it', async () => {
      const subTaskData = {
        title: 'Test SubTask',
        description: 'Test Description',
        status: 'not_started',
        priority: 1
      };

      const result = await dataService.createSubTask('task-id', subTaskData);

      expect(result).toBeDefined();
      expect(result.title).toBe(subTaskData.title);
      expect(result.task_id).toBe('task-id');
      expect(mockBackendService.subtask.create).toHaveBeenCalledOnce();
    });
  });

  describe('Tag operations', () => {
    test('createTag should create a tag and return it', async () => {
      const tagData = {
        name: 'Test Tag',
        color: '#0000FF',
        order_index: 0
      };

      const result = await dataService.createTag(tagData);

      expect(result).toBeDefined();
      expect(result.name).toBe(tagData.name);
      expect(result.color).toBe(tagData.color);
      expect(mockBackendService.tag.create).toHaveBeenCalledOnce();
    });
  });

  describe('Data loading', () => {
    test('loadProjectData should return empty array (placeholder)', async () => {
      const result = await dataService.loadProjectData();

      expect(result).toEqual([]);
    });

  });
});
