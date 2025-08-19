import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProjectsService } from '$lib/services/projects-service';
import type { Project, ProjectWithLists } from '$lib/types/project';
import type { TaskList } from '$lib/types/task-list';

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
  let mockProjectWithLists: any;

  beforeEach(() => {
    mockProject = {
      id: 'project-123',
      name: 'Test Project',
      description: 'Test Description',
      color: '#FF5733',
      order_index: 0,
      is_archived: false,
      created_at: new Date('2024-01-01T00:00:00Z'),
      updated_at: new Date('2024-01-01T00:00:00Z')
    };

    mockTaskList = {
      id: 'list-123',
      project_id: 'project-123',
      name: 'Test List',
      description: 'Test List Description',
      color: '#00FF00',
      order_index: 0,
      is_archived: false,
      created_at: new Date('2024-01-01T00:00:00Z'),
      updated_at: new Date('2024-01-01T00:00:00Z')
    };

    // Add task_lists to mockProject to match ProjectTree interface
    (mockProject as any).task_lists = [];

    mockProjectWithLists = {
      ...mockProject,
      task_lists: [mockTaskList]
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

      (mockDataService.createProject as any).mockResolvedValue(mockProject);
      (mockTaskStore.addProject as any).mockResolvedValue(undefined);

      const result = await ProjectsService.createProject(projectData);

      expect(mockDataService.createProject).toHaveBeenCalledWith(projectData);
      expect(mockTaskStore.addProject).toHaveBeenCalledWith(projectData);
      expect(result).toEqual(mockProject);
    });

    it('should return null when creation fails', async () => {
      const projectData = { name: 'Failed Project' };

      (mockDataService.createProject as any).mockRejectedValue(new Error('Creation failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await ProjectsService.createProject(projectData);

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to create project:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('updateProject', () => {
    it('should successfully update a project', async () => {
      const updates = { name: 'Updated Project', is_archived: true };

      (mockDataService.updateProject as any).mockResolvedValue({ ...mockProject, ...updates });
      (mockTaskStore.updateProject as any).mockResolvedValue(undefined);

      const result = await ProjectsService.updateProject('project-123', updates);

      expect(mockDataService.updateProject).toHaveBeenCalledWith('project-123', updates);
      expect(mockTaskStore.updateProject).toHaveBeenCalledWith('project-123', updates);
      expect(result).toEqual({ ...mockProject, ...updates });
    });

    it('should return null when update fails in dataService', async () => {
      const updates = { name: 'Updated Project' };

      (mockDataService.updateProject as any).mockResolvedValue(null);

      const result = await ProjectsService.updateProject('project-123', updates);

      expect(result).toBeNull();
      expect(mockTaskStore.updateProject).not.toHaveBeenCalled();
    });

    it('should return null when update throws error', async () => {
      const updates = { name: 'Updated Project' };

      (mockDataService.updateProject as any).mockRejectedValue(new Error('Update failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await ProjectsService.updateProject('project-123', updates);

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to update project:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('deleteProject', () => {
    it('should successfully delete a project', async () => {
      (mockDataService.deleteProject as any).mockResolvedValue(true);
      (mockTaskStore.deleteProject as any).mockResolvedValue(undefined);

      const result = await ProjectsService.deleteProject('project-123');

      expect(mockDataService.deleteProject).toHaveBeenCalledWith('project-123');
      expect(mockTaskStore.deleteProject).toHaveBeenCalledWith('project-123');
      expect(result).toBe(true);
    });

    it('should return false when deletion fails in dataService', async () => {
      (mockDataService.deleteProject as any).mockResolvedValue(false);

      const result = await ProjectsService.deleteProject('project-123');

      expect(result).toBe(false);
      expect(mockTaskStore.deleteProject).not.toHaveBeenCalled();
    });

    it('should return false when deletion throws error', async () => {
      (mockDataService.deleteProject as any).mockRejectedValue(new Error('Deletion failed'));
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

      expect(mockTaskStore.selectProject).toHaveBeenCalledWith('project-123');
    });

    it('should handle null project selection', () => {
      ProjectsService.selectProject(null);

      expect(mockTaskStore.selectProject).toHaveBeenCalledWith(null);
    });
  });

  describe('getProjectIdByName', () => {
    it('should find project by name', () => {
      mockTaskStore.projects = [mockProject as any];

      const result = ProjectsService.getProjectIdByName('Test Project');

      expect(result).toBe('project-123');
    });

    it('should return null when project not found', () => {
      mockTaskStore.projects = [mockProject as any];

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
      mockTaskStore.projects = [mockProject as any];

      const result = ProjectsService.getProjectById('project-123');

      expect(result).toEqual(mockProject);
    });

    it('should return null when project not found', () => {
      mockTaskStore.projects = [mockProject as any];

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
        task_lists: [mockTaskList]
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
      const projects = [mockProject, { ...mockProject, id: 'project-456', name: 'Project 2' }] as any[];
      mockTaskStore.projects = projects;

      const result = ProjectsService.getAllProjects();

      expect(result).toEqual(projects);
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
        mockProject,
        { ...mockProject, id: 'project-456', name: 'Another Test', description: 'Different project' }
      ] as any[];
      mockTaskStore.projects = projects;

      const result = ProjectsService.searchProjectsByName('Test');

      expect(result).toHaveLength(2);
    });

    it('should find projects by description substring', () => {
      const projectWithDescription = {
        ...mockProject,
        id: 'project-456',
        name: 'Different Name',
        description: 'Contains Test keyword'
      };
      mockTaskStore.projects = [mockProject, projectWithDescription] as any[];

      const result = ProjectsService.searchProjectsByName('Test');

      expect(result).toHaveLength(2);
    });

    it('should be case insensitive', () => {
      mockTaskStore.projects = [mockProject as any];

      const result = ProjectsService.searchProjectsByName('test');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockProject);
    });

    it('should return empty array when no matches', () => {
      mockTaskStore.projects = [mockProject as any];

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

      (mockDataService.createTaskList as any).mockResolvedValue(mockTaskList);
      (mockTaskStore.addTaskList as any).mockResolvedValue(undefined);

      const result = await ProjectsService.createTaskList('project-123', taskListData);

      expect(mockDataService.createTaskList).toHaveBeenCalledWith('project-123', taskListData);
      expect(mockTaskStore.addTaskList).toHaveBeenCalledWith('project-123', taskListData);
      expect(result).toEqual(mockTaskList);
    });

    it('should return null when creation fails', async () => {
      const taskListData = { name: 'Failed List' };

      (mockDataService.createTaskList as any).mockRejectedValue(new Error('Creation failed'));
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
        mockProject,
        { ...mockProject, id: 'project-456', is_archived: true },
        { ...mockProject, id: 'project-789', is_archived: false }
      ] as any[];
      mockTaskStore.projects = projects;

      const result = ProjectsService.getActiveProjects();

      expect(result).toHaveLength(2);
      expect(result.every(p => !p.is_archived)).toBe(true);
    });

    it('should return empty array when all projects are archived', () => {
      const projects = [
        { ...mockProject, is_archived: true },
        { ...mockProject, id: 'project-456', is_archived: true }
      ] as any[];
      mockTaskStore.projects = projects;

      const result = ProjectsService.getActiveProjects();

      expect(result).toEqual([]);
    });
  });

  describe('archiveProject', () => {
    it('should successfully archive a project', async () => {
      (mockDataService.updateProject as any).mockResolvedValue({ ...mockProject, is_archived: true });
      (mockTaskStore.updateProject as any).mockResolvedValue(undefined);

      const result = await ProjectsService.archiveProject('project-123', true);

      expect(mockDataService.updateProject).toHaveBeenCalledWith('project-123', { is_archived: true });
      expect(result).toBe(true);
    });

    it('should return false when archiving fails', async () => {
      (mockDataService.updateProject as any).mockResolvedValue(null);

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

      (mockDataService.createProject as any).mockResolvedValue(mockProject);
      (mockTaskStore.addProject as any).mockResolvedValue(undefined);

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
      mockTaskStore.projects = [mockProject as any];

      const result = ProjectsService.searchProjectsByName('');

      expect(result).toEqual([mockProject]);
    });
  });
});