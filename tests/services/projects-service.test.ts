import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProjectsService } from '$lib/services/domain/project';
import type { Project, ProjectTree } from '$lib/types/project';
import type { TaskList, TaskListWithTasks } from '$lib/types/task-list';

const projectServiceMock = vi.hoisted(() => ({
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn()
}));

const taskListServiceMock = vi.hoisted(() => ({
  createTaskList: vi.fn(),
  updateTaskList: vi.fn(),
  deleteTaskList: vi.fn()
}));

vi.mock('$lib/services/domain/project-service', () => ({
  ProjectService: projectServiceMock
}));

vi.mock('$lib/services/domain/task-list-service', () => ({
  TaskListService: taskListServiceMock
}));

// Mock taskStore
vi.mock('$lib/stores/tasks.svelte', () => ({
  taskStore: {
    projects: [],
    selectedProjectId: null,
    selectedListId: null,
    getTaskProjectAndList: vi.fn()
  }
}));

// Mock selectionStore
vi.mock('$lib/stores/selection-store.svelte', () => ({
  selectionStore: {
    selectProject: vi.fn(),
    selectList: vi.fn()
  }
}));

// Mock projectStore
vi.mock('$lib/stores/project-store.svelte', () => ({
  projectStore: {
    addProject: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
    reorderProjects: vi.fn(),
    moveProjectToPosition: vi.fn()
  }
}));

// Mock taskListStore
vi.mock('$lib/stores/task-list-store.svelte', () => ({
  taskListStore: {
    addTaskList: vi.fn(),
    updateTaskList: vi.fn(),
    deleteTaskList: vi.fn(),
    reorderTaskLists: vi.fn(),
    moveTaskListToProject: vi.fn(),
    moveTaskListToPosition: vi.fn(),
    getProjectIdByListId: vi.fn()
  }
}));

const mockProjectService = projectServiceMock;
const mockTaskListService = taskListServiceMock;
const mockTaskStore = vi.mocked(await import('$lib/stores/tasks.svelte')).taskStore;
const mockSelectionStore = vi.mocked(await import('$lib/stores/selection-store.svelte')).selectionStore;
const mockProjectStore = vi.mocked(await import('$lib/stores/project-store.svelte')).projectStore;
const mockTaskListStore = vi.mocked(await import('$lib/stores/task-list-store.svelte')).taskListStore;

describe('ProjectsService', () => {
  let mockProject: Project;
  let mockTaskList: TaskList;
  let mockTaskListWithTasks: TaskListWithTasks;
  let mockProjectWithLists: ProjectTree;

  beforeEach(() => {
    mockProject = {
      id: 'project-123',
      name: 'Test Project',
      description: 'Test Description',
      color: '#FF5733',
      orderIndex: 0,
      isArchived: false,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z')
    };

    mockTaskList = {
      id: 'list-123',
      projectId: 'project-123',
      name: 'Test List',
      description: 'Test List Description',
      color: '#00FF00',
      orderIndex: 0,
      isArchived: false,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z')
    };

    mockTaskListWithTasks = {
      ...mockTaskList,
      tasks: []
    };

    mockProjectWithLists = {
      ...mockProject,
      taskLists: [mockTaskListWithTasks]
    };

    vi.clearAllMocks();
    mockTaskStore.projects = [];
    mockTaskStore.selectedProjectId = null;
    mockTaskStore.selectedListId = null;
    mockTaskListStore.getProjectIdByListId.mockReturnValue('project-123');
  });

  describe('createProject', () => {
    it('should successfully create a project', async () => {
      const projectData = {
        name: 'New Project',
        description: 'New Description',
        color: '#FF0000'
      };

    mockProjectService.createProject.mockResolvedValue(mockProject);
    mockProjectStore.addProject.mockResolvedValue(mockProjectWithLists);

      const result = await ProjectsService.createProject(projectData);

    expect(mockProjectService.createProject).toHaveBeenCalledWith(projectData);
    expect(mockProjectStore.addProject).toHaveBeenCalledWith(projectData);
      expect(result).toEqual(mockProject);
    });

    it('should return null when creation fails', async () => {
      const projectData = { name: 'Failed Project' };

    mockProjectService.createProject.mockRejectedValue(new Error('Creation failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await ProjectsService.createProject(projectData);

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to create project:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('updateProject', () => {
    it('should successfully update a project', async () => {
      const updates = { name: 'Updated Project', isArchived: true };

    mockProjectService.updateProject.mockResolvedValue({ ...mockProject, ...updates });
    mockProjectStore.updateProject.mockResolvedValue({ ...mockProject, ...updates });

      const result = await ProjectsService.updateProject('project-123', updates);

    expect(mockProjectService.updateProject).toHaveBeenCalledWith('project-123', updates);
    expect(mockProjectStore.updateProject).toHaveBeenCalledWith('project-123', updates);
      expect(result).toEqual({ ...mockProject, ...updates });
    });

    it('should return null when update fails in project service', async () => {
      const updates = { name: 'Updated Project' };

      mockProjectService.updateProject.mockResolvedValue(null);

      const result = await ProjectsService.updateProject('project-123', updates);

      expect(result).toBeNull();
      expect(mockProjectStore.updateProject).not.toHaveBeenCalled();
    });

    it('should return null when update throws error', async () => {
      const updates = { name: 'Updated Project' };

      mockProjectService.updateProject.mockRejectedValue(new Error('Update failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await ProjectsService.updateProject('project-123', updates);

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to update project:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('deleteProject', () => {
    it('should successfully delete a project', async () => {
      mockProjectService.deleteProject.mockResolvedValue(true);
      mockProjectStore.deleteProject.mockResolvedValue(true);

      const result = await ProjectsService.deleteProject('project-123');

      expect(mockProjectService.deleteProject).toHaveBeenCalledWith('project-123');
      expect(mockProjectStore.deleteProject).toHaveBeenCalledWith('project-123');
      expect(result).toBe(true);
    });

    it('should return false when deletion fails in project service', async () => {
      mockProjectService.deleteProject.mockResolvedValue(false);

      const result = await ProjectsService.deleteProject('project-123');

      expect(result).toBe(false);
      expect(mockProjectStore.deleteProject).not.toHaveBeenCalled();
    });

    it('should return false when deletion throws error', async () => {
      mockProjectService.deleteProject.mockRejectedValue(new Error('Deletion failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await ProjectsService.deleteProject('project-123');

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to delete project:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('selectProject', () => {
    it('should select a project', () => {
      ProjectsService.selectProject('project-123');

      expect(mockSelectionStore.selectProject).toHaveBeenCalledWith('project-123');
    });

    it('should handle null project selection', () => {
      ProjectsService.selectProject(null);

      expect(mockSelectionStore.selectProject).toHaveBeenCalledWith(null);
    });
  });

  describe('getProjectIdByName', () => {
    it('should find project by name', () => {
      mockTaskStore.projects = [mockProjectWithLists];

      const result = ProjectsService.getProjectIdByName('Test Project');

      expect(result).toBe('project-123');
    });

    it('should return null when project not found', () => {
      mockTaskStore.projects = [mockProjectWithLists];

      const result = ProjectsService.getProjectIdByName('Non-existent Project');

      expect(result).toBeNull();
    });

    it('should return null when no projects exist', () => {
      mockTaskStore.projects = [];

      const result = ProjectsService.getProjectIdByName('Any Project');

      expect(result).toBeNull();
    });
  });

  describe('getProjectById', () => {
    it('should find project by ID', () => {
      mockTaskStore.projects = [mockProjectWithLists];

      const result = ProjectsService.getProjectById('project-123');

      expect(result).toEqual(mockProjectWithLists);
    });

    it('should return null when project not found', () => {
      mockTaskStore.projects = [mockProjectWithLists];

      const result = ProjectsService.getProjectById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getProjectWithListsById', () => {
    it('should find project with task lists', () => {
      mockTaskStore.projects = [mockProjectWithLists];

      const result = ProjectsService.getProjectWithListsById('project-123');

      expect(result).toEqual({
        ...mockProject,
        taskLists: [mockTaskList]
      });
    });

    it('should return null when project not found', () => {
      mockTaskStore.projects = [];

      const result = ProjectsService.getProjectWithListsById('project-123');

      expect(result).toBeNull();
    });
  });

  describe('getAllProjects', () => {
    it('should return all projects', () => {
      const projects = [
        mockProjectWithLists,
        { ...mockProjectWithLists, id: 'project-456', name: 'Project 2' }
      ];
      mockTaskStore.projects = projects;

      const result = ProjectsService.getAllProjects();

      const expectedProjects = [
        mockProject,
        { ...mockProject, id: 'project-456', name: 'Project 2' }
      ];
      expect(result).toEqual(expectedProjects);
    });

    it('should return empty array when no projects', () => {
      mockTaskStore.projects = [];

      const result = ProjectsService.getAllProjects();

      expect(result).toEqual([]);
    });
  });

  describe('searchProjectsByName', () => {
    it('should find projects by name substring', () => {
      const projects = [
        mockProjectWithLists,
        {
          ...mockProjectWithLists,
          id: 'project-456',
          name: 'Another Test',
          description: 'Different project'
        }
      ];
      mockTaskStore.projects = projects;

      const result = ProjectsService.searchProjectsByName('Test');

      expect(result).toHaveLength(2);
    });

    it('should find projects by description substring', () => {
      const projectWithDescription = {
        ...mockProjectWithLists,
        id: 'project-456',
        name: 'Different Name',
        description: 'Contains Test keyword'
      };
      mockTaskStore.projects = [mockProjectWithLists, projectWithDescription];

      const result = ProjectsService.searchProjectsByName('Test');

      expect(result).toHaveLength(2);
    });

    it('should be case insensitive', () => {
      mockTaskStore.projects = [mockProjectWithLists];

      const result = ProjectsService.searchProjectsByName('test');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockProject);
    });

    it('should return empty array when no matches', () => {
      mockTaskStore.projects = [mockProjectWithLists];

      const result = ProjectsService.searchProjectsByName('NoMatch');

      expect(result).toEqual([]);
    });
  });

  describe('createTaskList', () => {
    it('should successfully create a task list', async () => {
      const taskListData = {
        name: 'New Task List',
        description: 'New Description',
        color: '#00FF00'
      };

      mockTaskListService.createTaskList.mockResolvedValue(mockTaskList);
      mockTaskListStore.addTaskList.mockResolvedValue(mockTaskListWithTasks);

      const result = await ProjectsService.createTaskList('project-123', taskListData);

      expect(mockTaskListService.createTaskList).toHaveBeenCalledWith(
        'project-123',
        taskListData
      );
      expect(mockTaskListStore.addTaskList).toHaveBeenCalledWith(
        'project-123',
        taskListData
      );
      expect(result).toEqual(mockTaskList);
    });

    it('should return null when creation fails', async () => {
      const taskListData = { name: 'Failed List' };

      mockTaskListService.createTaskList.mockRejectedValue(new Error('Creation failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await ProjectsService.createTaskList('project-123', taskListData);

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to create task list:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('updateTaskList', () => {
    it('should successfully update a task list', async () => {
      const updates = { name: 'Updated List' };

      mockTaskListService.updateTaskList.mockResolvedValue({ ...mockTaskList, ...updates });
      mockTaskListStore.updateTaskList.mockResolvedValue({ ...mockTaskList, ...updates });

      const result = await ProjectsService.updateTaskList('list-123', updates);

      expect(mockTaskListService.updateTaskList).toHaveBeenCalledWith(
        'project-123',
        'list-123',
        updates
      );
      expect(mockTaskListStore.updateTaskList).toHaveBeenCalledWith('list-123', updates);
      expect(result).toEqual({ ...mockTaskList, ...updates });
    });

    it('should return null when update fails in task list service', async () => {
      const updates = { name: 'Updated List' };

      mockTaskListService.updateTaskList.mockResolvedValue(null);

      const result = await ProjectsService.updateTaskList('list-123', updates);

      expect(result).toBeNull();
      expect(mockTaskListStore.updateTaskList).not.toHaveBeenCalled();
    });

    it('should return null when update throws error', async () => {
      const updates = { name: 'Updated List' };

      mockTaskListService.updateTaskList.mockRejectedValue(new Error('Update failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await ProjectsService.updateTaskList('list-123', updates);

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to update task list:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('deleteTaskList', () => {
    it('should successfully delete a task list', async () => {
      mockTaskListService.deleteTaskList.mockResolvedValue(true);
      mockTaskListStore.deleteTaskList.mockResolvedValue(true);

      const result = await ProjectsService.deleteTaskList('list-123');

      expect(mockTaskListService.deleteTaskList).toHaveBeenCalledWith('project-123', 'list-123');
      expect(mockTaskListStore.deleteTaskList).toHaveBeenCalledWith('list-123');
      expect(result).toBe(true);
    });

    it('should return false when deletion fails in task list service', async () => {
      mockTaskListService.deleteTaskList.mockResolvedValue(false);

      const result = await ProjectsService.deleteTaskList('list-123');

      expect(result).toBe(false);
      expect(mockTaskListStore.deleteTaskList).not.toHaveBeenCalled();
    });

    it('should return false when deletion throws error', async () => {
      mockTaskListService.deleteTaskList.mockRejectedValue(new Error('Deletion failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await ProjectsService.deleteTaskList('list-123');

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to delete task list:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });
});
