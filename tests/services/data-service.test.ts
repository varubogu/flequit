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
      },
      initialization: {
        loadProjectData: vi.fn().mockResolvedValue([])
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
    test('loadProjectData should return project data from backend', async () => {
      const mockProjectData = [
        { id: '1', name: 'Project 1', task_lists: [] },
        { id: '2', name: 'Project 2', task_lists: [] }
      ];
      mockBackendService.initialization.loadProjectData.mockResolvedValue(mockProjectData);

      const result = await dataService.loadProjectData();

      expect(result).toEqual(mockProjectData);
      expect(mockBackendService.initialization.loadProjectData).toHaveBeenCalledOnce();
    });

    test('initializeAll should call backend initialization', async () => {
      mockBackendService.initialization.initializeAll = vi.fn().mockResolvedValue(undefined);

      await dataService.initializeAll();

      expect(mockBackendService.initialization.initializeAll).toHaveBeenCalledOnce();
    });
  });

  describe('Update operations with failure cases', () => {
    test('updateProject should handle backend failure', async () => {
      mockBackendService.project.update.mockResolvedValue(false);

      const result = await dataService.updateProject('test-id', { name: 'Updated Name' });

      expect(result).toBeNull();
    });

    test('updateTaskList should handle backend failure', async () => {
      mockBackendService.tasklist.update.mockResolvedValue(false);

      const result = await dataService.updateTaskList('list-id', { name: 'Updated Name' });

      expect(result).toBeNull();
    });

    test('updateTask should handle backend failure', async () => {
      mockBackendService.task.update.mockResolvedValue(false);

      const result = await dataService.updateTask('task-id', { title: 'Updated Title' });

      expect(result).toBeNull();
    });

    test('updateSubTask should handle backend failure', async () => {
      mockBackendService.subtask.update.mockResolvedValue(false);

      const result = await dataService.updateSubTask('subtask-id', { title: 'Updated Title' });

      expect(result).toBeNull();
    });

    test('updateTag should handle backend failure', async () => {
      mockBackendService.tag.update.mockResolvedValue(false);

      const result = await dataService.updateTag('tag-id', { name: 'Updated Tag' });

      expect(result).toBeNull();
    });
  });

  describe('Complex tag operations', () => {
    test('addTagToSubTask should add tag to existing subtask', async () => {
      const mockSubTask = {
        id: 'subtask-id',
        task_id: 'task-id',
        title: 'Test SubTask',
        tags: [],
        created_at: new Date(),
        updated_at: new Date()
      };
      const mockTag = {
        id: 'tag-id',
        name: 'Test Tag',
        color: '#FF0000',
        created_at: new Date(),
        updated_at: new Date()
      };

      mockBackendService.subtask.get.mockResolvedValue(mockSubTask);
      mockBackendService.tag.get.mockResolvedValue(mockTag);

      await dataService.addTagToSubTask('subtask-id', 'tag-id');

      expect(mockBackendService.subtask.update).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: [mockTag]
        })
      );
    });

    test('addTagToSubTask should not add duplicate tag', async () => {
      const mockTag = {
        id: 'tag-id',
        name: 'Test Tag',
        color: '#FF0000',
        created_at: new Date(),
        updated_at: new Date()
      };
      const mockSubTask = {
        id: 'subtask-id',
        task_id: 'task-id',
        title: 'Test SubTask',
        tags: [mockTag],
        created_at: new Date(),
        updated_at: new Date()
      };

      mockBackendService.subtask.get.mockResolvedValue(mockSubTask);
      mockBackendService.tag.get.mockResolvedValue(mockTag);

      await dataService.addTagToSubTask('subtask-id', 'tag-id');

      expect(mockBackendService.subtask.update).not.toHaveBeenCalled();
    });

    test('addTagToSubTask should handle missing subtask (Web environment)', async () => {
      const mockTag = {
        id: 'tag-id',
        name: 'Test Tag',
        color: '#FF0000',
        created_at: new Date(),
        updated_at: new Date()
      };

      mockBackendService.subtask.get.mockResolvedValue(null);
      mockBackendService.tag.get.mockResolvedValue(mockTag);

      await dataService.addTagToSubTask('subtask-id', 'tag-id');

      expect(mockBackendService.subtask.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'subtask-id',
          tags: [mockTag]
        })
      );
    });

    test('addTagToSubTask should handle missing tag by creating fallback', async () => {
      mockBackendService.subtask.get.mockResolvedValue(null);
      mockBackendService.tag.get.mockResolvedValue(null);

      await dataService.addTagToSubTask('subtask-id', 'tag-id');

      expect(mockBackendService.subtask.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'subtask-id',
          tags: [
            expect.objectContaining({
              id: 'tag-id',
              name: 'Tag-tag-id'
            })
          ]
        })
      );
    });

    test('addTagToSubTask should handle missing tag with existing subtask', async () => {
      const mockSubTask = {
        id: 'subtask-id',
        task_id: 'task-id',
        title: 'Test SubTask',
        tags: [],
        created_at: new Date(),
        updated_at: new Date()
      };

      mockBackendService.subtask.get.mockResolvedValue(mockSubTask);
      mockBackendService.tag.get.mockResolvedValue(null);

      await dataService.addTagToSubTask('subtask-id', 'tag-id');

      expect(mockBackendService.subtask.update).not.toHaveBeenCalled();
    });

    test('removeTagFromSubTask should remove tag from subtask', async () => {
      const mockTag = {
        id: 'tag-id',
        name: 'Test Tag',
        color: '#FF0000',
        created_at: new Date(),
        updated_at: new Date()
      };
      const mockSubTask = {
        id: 'subtask-id',
        task_id: 'task-id',
        title: 'Test SubTask',
        tags: [mockTag],
        created_at: new Date(),
        updated_at: new Date()
      };

      mockBackendService.subtask.get.mockResolvedValue(mockSubTask);

      await dataService.removeTagFromSubTask('subtask-id', 'tag-id');

      expect(mockBackendService.subtask.update).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: []
        })
      );
    });

    test('removeTagFromSubTask should handle missing subtask (Web environment)', async () => {
      mockBackendService.subtask.get.mockResolvedValue(null);

      await dataService.removeTagFromSubTask('subtask-id', 'tag-id');

      expect(mockBackendService.subtask.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'subtask-id',
          tags: []
        })
      );
    });

    test('removeTagFromSubTask should not update if tag does not exist', async () => {
      const mockSubTask = {
        id: 'subtask-id',
        task_id: 'task-id',
        title: 'Test SubTask',
        tags: [],
        created_at: new Date(),
        updated_at: new Date()
      };

      mockBackendService.subtask.get.mockResolvedValue(mockSubTask);

      await dataService.removeTagFromSubTask('subtask-id', 'tag-id');

      expect(mockBackendService.subtask.update).not.toHaveBeenCalled();
    });
  });

  describe('Complex task operations', () => {
    test('createTaskWithSubTasks should create task', async () => {
      const mockTask = {
        id: 'task-id',
        list_id: 'list-id',
        title: 'Test Task',
        status: 'not_started' as const,
        priority: 1,
        order_index: 0,
        tags: [],
        sub_tasks: [],
        is_archived: false,
        created_at: new Date(),
        updated_at: new Date()
      };

      await dataService.createTaskWithSubTasks('list-id', mockTask);

      expect(mockBackendService.task.create).toHaveBeenCalledWith(mockTask);
    });

    test('deleteTaskWithSubTasks should delete task', async () => {
      mockBackendService.task.delete.mockResolvedValue(true);

      await dataService.deleteTaskWithSubTasks('task-id');

      expect(mockBackendService.task.delete).toHaveBeenCalledWith('task-id');
    });
  });

  describe('Default values handling', () => {
    test('createProject should use default order_index if not provided', async () => {
      const projectData = { name: 'Test Project' };

      const result = await dataService.createProject(projectData);

      expect(result.order_index).toBe(0);
      expect(result.is_archived).toBe(false);
    });

    test('createTaskList should use default order_index if not provided', async () => {
      const taskListData = { name: 'Test List' };

      const result = await dataService.createTaskList('project-id', taskListData);

      expect(result.order_index).toBe(0);
      expect(result.is_archived).toBe(false);
    });

    test('createSubTask should use default status if not provided', async () => {
      const subTaskData = { title: 'Test SubTask' };

      const result = await dataService.createSubTask('task-id', subTaskData);

      expect(result.status).toBe('not_started');
      expect(result.order_index).toBe(0);
      expect(result.tags).toEqual([]);
    });

    test('createTag should use default order_index if not provided', async () => {
      const tagData = { name: 'Test Tag' };

      const result = await dataService.createTag(tagData);

      expect(result.order_index).toBe(0);
    });
  });
});
