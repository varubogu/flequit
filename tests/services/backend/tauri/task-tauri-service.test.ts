import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskTauriService } from '$lib/services/backend/tauri/task-tauri-service';
import type { Task, TaskSearchCondition } from '$lib/types/task';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}));

// Mock ProjectsService
vi.mock('$lib/services/projects-service', () => ({
  ProjectsService: {
    getSelectedProjectId: vi.fn(() => 'test-project-id')
  }
}));

// Get the mocked invoke for use in tests
const mockInvoke = vi.mocked(await import('@tauri-apps/api/core')).invoke;

describe('TaskTauriService', () => {
  let service: TaskTauriService;
  let mockTask: Task;
  let mockSearchCondition: TaskSearchCondition;

  beforeEach(() => {
    service = new TaskTauriService();
    mockTask = {
      id: 'task-123',
      projectId: 'proj-1',
      listId: 'list-456',
      title: 'Test Task',
      description: 'Test Description',
      status: 'not_started',
      priority: 1,
      planStartDate: new Date('2024-01-01T00:00:00Z'),
      planEndDate: new Date('2024-01-02T00:00:00Z'),
      isRangeDate: true,
      assignedUserIds: [],
      tagIds: [],
      orderIndex: 0,
      isArchived: false,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z')
    };
    mockSearchCondition = {
      listId: 'list-456',
      status: 'not_started',
      isArchived: false
    };
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should successfully create a task', async () => {
      mockInvoke.mockResolvedValue(undefined);

      const result = await service.create('test-project-id', mockTask);

      expect(mockInvoke).toHaveBeenCalledWith('create_task', { task: expect.objectContaining({
        id: mockTask.id,
        listId: mockTask.listId,
        title: mockTask.title
      }) });
      expect(result).toBe(true);
    });

    it('should return false when creation fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Creation failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.create('test-project-id', mockTask);

      expect(mockInvoke).toHaveBeenCalledWith('create_task', { task: expect.any(Object) });
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to create task:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('update', () => {
    it('should successfully update a task', async () => {
      mockInvoke.mockResolvedValue(true);

      const patchData = {
        title: mockTask.title,
        description: mockTask.description,
        status: mockTask.status,
        priority: mockTask.priority,
        plan_start_date: mockTask.planStartDate?.toISOString(),
        plan_end_date: mockTask.planEndDate?.toISOString(),
        do_start_date: mockTask.doStartDate?.toISOString(),
        do_end_date: mockTask.doEndDate?.toISOString()
      } as any;
      const result = await service.update('test-project-id', mockTask.id, patchData);

      expect(mockInvoke).toHaveBeenCalledWith('update_task', { projectId: 'test-project-id', id: mockTask.id, patch: patchData });
      expect(result).toBe(true);
    });

    it('should return false when update fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Update failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const patchData = {
        title: mockTask.title,
        description: mockTask.description,
        status: mockTask.status,
        priority: mockTask.priority,
        plan_start_date: mockTask.planStartDate?.toISOString(),
        plan_end_date: mockTask.planEndDate?.toISOString(),
        do_start_date: mockTask.doStartDate?.toISOString(),
        do_end_date: mockTask.doEndDate?.toISOString()
      } as any;
      const result = await service.update('test-project-id', mockTask.id, patchData);

      expect(mockInvoke).toHaveBeenCalledWith('update_task', { projectId: 'test-project-id', id: mockTask.id, patch: patchData });
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to update task:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('delete', () => {
    it('should successfully delete a task', async () => {
      mockInvoke.mockResolvedValue(undefined);

      const result = await service.delete('test-project-id', 'task-123');

      expect(mockInvoke).toHaveBeenCalledWith('delete_task', { projectId: 'test-project-id', id: 'task-123' });
      expect(result).toBe(true);
    });

    it('should return false when deletion fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Deletion failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.delete('test-project-id', 'task-123');

      expect(mockInvoke).toHaveBeenCalledWith('delete_task', { projectId: 'test-project-id', id: 'task-123' });
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to delete task:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('get', () => {
    it('should successfully retrieve a task', async () => {
      mockInvoke.mockResolvedValue(mockTask);

      const result = await service.get('test-project-id', 'task-123');

      expect(mockInvoke).toHaveBeenCalledWith('get_task', { projectId: 'test-project-id', id: 'task-123' });
      expect(result).toEqual(mockTask);
    });

    it('should return null when task not found', async () => {
      mockInvoke.mockResolvedValue(null);

      const result = await service.get('test-project-id', 'non-existent');

      expect(mockInvoke).toHaveBeenCalledWith('get_task', { projectId: 'test-project-id', id: 'non-existent' });
      expect(result).toBeNull();
    });

    it('should return null when retrieval fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Retrieval failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.get('test-project-id', 'task-123');

      expect(mockInvoke).toHaveBeenCalledWith('get_task', { projectId: 'test-project-id', id: 'task-123' });
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get task:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('search', () => {
    it('should return empty array as mock implementation', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await service.search('test-project-id', mockSearchCondition);

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('search_tasks is not implemented on Tauri side - using mock implementation');

      consoleSpy.mockRestore();
    });

    it('should handle search with empty condition', async () => {
      const emptyCondition = {};
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await service.search('test-project-id', emptyCondition);

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('search_tasks is not implemented on Tauri side - using mock implementation');

      consoleSpy.mockRestore();
    });
  });
});
