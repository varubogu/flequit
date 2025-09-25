import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProjectsService } from '$lib/services/projects-service';
import type { Project, ProjectTree } from '$lib/types/project';
import type { TaskList, TaskListWithTasks } from '$lib/types/task-list';

// Mock dataService
vi.mock('$lib/services/data-service', () => ({
  dataService: {
    createProject: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
    createTaskList: vi.fn(),
    updateTaskList: vi.fn(),
    deleteTaskList: vi.fn()
  }
}));

// Mock taskStore
vi.mock('$lib/stores/tasks.svelte', () => ({
  taskStore: {
    projects: [],
    selectedProjectId: null,
    selectedListId: null,
    addProject: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
    selectProject: vi.fn(),
    addTaskList: vi.fn(),
    updateTaskList: vi.fn(),
    deleteTaskList: vi.fn(),
    selectList: vi.fn(),
    reorderProjects: vi.fn(),
    moveProjectToPosition: vi.fn(),
    reorderTaskLists: vi.fn(),
    moveTaskListToProject: vi.fn(),
    moveTaskListToPosition: vi.fn(),
    getTaskProjectAndList: vi.fn()
  }
}));

// Get mocked instances for use in tests
const mockDataService = vi.mocked(await import('$lib/services/data-service')).dataService;
const mockTaskStore = vi.mocked(await import('$lib/stores/tasks.svelte')).taskStore;

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
    // Reset mock store state
    mockTaskStore.projects = [];
    mockTaskStore.selectedProjectId = null;
    mockTaskStore.selectedListId = null;
  });

  describe('createProject', () => {
    it('should successfully create a project', async () => {
      const projectData = {
        name: 'New Project',
        description: 'New Description',
        color: '#FF0000'
      };

      vi.mocked(mockDataService.createProject).mockResolvedValue(mockProject);
      vi.mocked(mockTaskStore.addProject).mockResolvedValue(mockProjectWithLists);

      const result = await ProjectsService.createProject(projectData);

      expect(vi.mocked(mockDataService.createProject)).toHaveBeenCalledWith(projectData);
      expect(vi.mocked(mockTaskStore.addProject)).toHaveBeenCalledWith(projectData);
      expect(result).toEqual(mockProject);
    });

    it('should return null when creation fails', async () => {
      const projectData = { name: 'Failed Project' };

      vi.mocked(mockDataService.createProject).mockRejectedValue(new Error('Creation failed'));
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

      vi.mocked(mockDataService.updateProject).mockResolvedValue({ ...mockProject, ...updates });
      vi.mocked(mockTaskStore.updateProject).mockResolvedValue({ ...mockProject, ...updates });

      const result = await ProjectsService.updateProject('project-123', updates);

      expect(vi.mocked(mockDataService.updateProject)).toHaveBeenCalledWith('project-123', updates);
      expect(vi.mocked(mockTaskStore.updateProject)).toHaveBeenCalledWith('project-123', updates);
      expect(result).toEqual({ ...mockProject, ...updates });
    });

    it('should return null when update fails in dataService', async () => {
      const updates = { name: 'Updated Project' };

      vi.mocked(mockDataService.updateProject).mockResolvedValue(null);

      const result = await ProjectsService.updateProject('project-123', updates);

      expect(result).toBeNull();
      expect(vi.mocked(mockTaskStore.updateProject)).not.toHaveBeenCalled();
    });

    it('should return null when update throws error', async () => {
      const updates = { name: 'Updated Project' };

      vi.mocked(mockDataService.updateProject).mockRejectedValue(new Error('Update failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await ProjectsService.updateProject('project-123', updates);

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to update project:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('deleteProject', () => {
    it('should successfully delete a project', async () => {
      vi.mocked(mockDataService.deleteProject).mockResolvedValue(true);
      vi.mocked(mockTaskStore.deleteProject).mockResolvedValue(true);

      const result = await ProjectsService.deleteProject('project-123');

      expect(vi.mocked(mockDataService.deleteProject)).toHaveBeenCalledWith('project-123');
      expect(vi.mocked(mockTaskStore.deleteProject)).toHaveBeenCalledWith('project-123');
      expect(result).toBe(true);
    });

    it('should return false when deletion fails in dataService', async () => {
      vi.mocked(mockDataService.deleteProject).mockResolvedValue(false);

      const result = await ProjectsService.deleteProject('project-123');

      expect(result).toBe(false);
      expect(vi.mocked(mockTaskStore.deleteProject)).not.toHaveBeenCalled();
    });

    it('should return false when deletion throws error', async () => {
      vi.mocked(mockDataService.deleteProject).mockRejectedValue(new Error('Deletion failed'));
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

      expect(vi.mocked(mockTaskStore.selectProject)).toHaveBeenCalledWith('project-123');
    });

    it('should handle null project selection', () => {
      ProjectsService.selectProject(null);

      expect(vi.mocked(mockTaskStore.selectProject)).toHaveBeenCalledWith(null);
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

      // getAllProjects returns Project[] (without taskLists)
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

      vi.mocked(mockDataService.createTaskList).mockResolvedValue(mockTaskList);
      vi.mocked(mockTaskStore.addTaskList).mockResolvedValue(mockTaskListWithTasks);

      const result = await ProjectsService.createTaskList('project-123', taskListData);

      expect(vi.mocked(mockDataService.createTaskList)).toHaveBeenCalledWith(
        'project-123',
        taskListData
      );
      expect(vi.mocked(mockTaskStore.addTaskList)).toHaveBeenCalledWith(
        'project-123',
        taskListData
      );
      expect(result).toEqual(mockTaskList);
    });

    it('should return null when creation fails', async () => {
      const taskListData = { name: 'Failed List' };

      vi.mocked(mockDataService.createTaskList).mockRejectedValue(new Error('Creation failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await ProjectsService.createTaskList('project-123', taskListData);

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to create task list:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('getSelectedProjectId', () => {
    it('should return selected project ID', () => {
      mockTaskStore.selectedProjectId = 'project-123';

      const result = ProjectsService.getSelectedProjectId();

      expect(result).toBe('project-123');
    });

    it('should return null when no project selected', () => {
      mockTaskStore.selectedProjectId = null;

      const result = ProjectsService.getSelectedProjectId();

      expect(result).toBeNull();
    });
  });

  describe('getSelectedTaskListId', () => {
    it('should return selected task list ID', () => {
      mockTaskStore.selectedListId = 'list-123';

      const result = ProjectsService.getSelectedTaskListId();

      expect(result).toBe('list-123');
    });

    it('should return null when no task list selected', () => {
      mockTaskStore.selectedListId = null;

      const result = ProjectsService.getSelectedTaskListId();

      expect(result).toBeNull();
    });
  });

  describe('getActiveProjects', () => {
    it('should return only non-archived projects', () => {
      const projects = [
        mockProjectWithLists,
        { ...mockProjectWithLists, id: 'project-456', isArchived: true },
        { ...mockProjectWithLists, id: 'project-789', isArchived: false }
      ];
      mockTaskStore.projects = projects;

      const result = ProjectsService.getActiveProjects();

      expect(result).toHaveLength(2);
      expect(result.every((p) => !p.isArchived)).toBe(true);
    });

    it('should return empty array when all projects are archived', () => {
      const projects = [
        { ...mockProjectWithLists, isArchived: true },
        { ...mockProjectWithLists, id: 'project-456', isArchived: true }
      ];
      mockTaskStore.projects = projects;

      const result = ProjectsService.getActiveProjects();

      expect(result).toEqual([]);
    });
  });

  describe('archiveProject', () => {
    it('should successfully archive a project', async () => {
      vi.mocked(mockDataService.updateProject).mockResolvedValue({
        ...mockProject,
        isArchived: true
      });
      vi.mocked(mockTaskStore.updateProject).mockResolvedValue({
        ...mockProject,
        isArchived: true
      });

      const result = await ProjectsService.archiveProject('project-123', true);

      expect(vi.mocked(mockDataService.updateProject)).toHaveBeenCalledWith('project-123', {
        is_archived: true
      });
      expect(result).toBe(true);
    });

    it('should return false when archiving fails', async () => {
      vi.mocked(mockDataService.updateProject).mockResolvedValue(null);

      const result = await ProjectsService.archiveProject('project-123', true);

      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle project operations with special characters', async () => {
      const specialProject = {
        name: 'プロジェクト with émojis 🚀',
        description: 'Special chars @#$%'
      };

      vi.mocked(mockDataService.createProject).mockResolvedValue(mockProject);
      vi.mocked(mockTaskStore.addProject).mockResolvedValue(mockProjectWithLists);

      const result = await ProjectsService.createProject(specialProject);

      expect(result).toEqual(mockProject);
    });

    it('should handle empty project arrays gracefully', () => {
      mockTaskStore.projects = [];

      expect(ProjectsService.getAllProjects()).toEqual([]);
      expect(ProjectsService.getActiveProjects()).toEqual([]);
      expect(ProjectsService.searchProjectsByName('test')).toEqual([]);
    });

    it('should handle undefined/null search terms', () => {
      mockTaskStore.projects = [mockProjectWithLists];

      const result = ProjectsService.searchProjectsByName('');

      expect(result).toEqual([mockProject]);
    });
  });
});
