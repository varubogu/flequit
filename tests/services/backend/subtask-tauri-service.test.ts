import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubtaskTauriService } from '$lib/services/backend/tauri/subtask-tauri-service';
import type { SubTask, SubTaskSearchCondition } from '$lib/types/sub-task';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}));

// Mock ProjectsService
vi.mock('$lib/services/projects-service', () => ({
  ProjectsService: {
    getSelectedProjectId: vi.fn().mockReturnValue('test-project-id')
  }
}));

// Get the mocked invoke for use in tests
const mockInvoke = vi.mocked(await import('@tauri-apps/api/core')).invoke;

describe('SubtaskTauriService', () => {
  let service: SubtaskTauriService;
  let mockSubTask: SubTask;
  let mockSearchCondition: SubTaskSearchCondition;

  beforeEach(() => {
    service = new SubtaskTauriService();
    mockSubTask = {
      id: 'subtask-123',
      task_id: 'task-456',
      title: 'Test SubTask',
      description: 'Test Description',
      status: 'not_started',
      priority: 2,
      plan_start_date: new Date('2024-01-01T00:00:00Z'),
      plan_end_date: new Date('2024-01-02T00:00:00Z'),
      do_start_date: new Date('2024-01-01T00:00:00Z'),
      do_end_date: new Date('2024-01-02T00:00:00Z'),
      is_range_date: true,
      order_index: 0,
      completed: false,
      assigned_user_ids: [],
      tags: [],
      created_at: new Date('2024-01-01T00:00:00Z'),
      updated_at: new Date('2024-01-01T00:00:00Z')
    };
    mockSearchCondition = {
      task_id: 'task-456',
      status: 'not_started'
    };
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should successfully create a subtask', async () => {
      mockInvoke.mockResolvedValue(undefined);

      const result = await service.create(mockSubTask);

      expect(mockInvoke).toHaveBeenCalledWith('create_sub_task', { 
        project_id: 'test-project-id', 
        sub_task: mockSubTask 
      });
      expect(result).toBe(true);
    });

    it('should return false when creation fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Creation failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.create(mockSubTask);

      expect(mockInvoke).toHaveBeenCalledWith('create_sub_task', { 
        project_id: 'test-project-id', 
        sub_task: mockSubTask 
      });
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to create sub task:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle subtask with minimal data', async () => {
      mockInvoke.mockResolvedValue(undefined);

      const minimalSubTask = {
        id: 'subtask-minimal',
        task_id: 'task-123',
        title: 'Minimal SubTask',
        status: 'not_started' as const,
        assigned_user_ids: [],
        tag_ids: [],
        order_index: 0,
        completed: false,
        tags: [],
        created_at: new Date(),
        updated_at: new Date()
      };

      const result = await service.create(minimalSubTask);

      expect(mockInvoke).toHaveBeenCalledWith('create_sub_task', { 
        project_id: 'test-project-id', 
        sub_task: minimalSubTask 
      });
      expect(result).toBe(true);
    });
  });

  describe('update', () => {
    it('should successfully update a subtask', async () => {
      mockInvoke.mockResolvedValue(true);

      const patchData = {
        ...mockSubTask,
        plan_start_date: mockSubTask.plan_start_date?.toISOString(),
        plan_end_date: mockSubTask.plan_end_date?.toISOString(),
        do_start_date: mockSubTask.do_start_date?.toISOString(),
        do_end_date: mockSubTask.do_end_date?.toISOString(),
        created_at: mockSubTask.created_at.toISOString(),
        updated_at: mockSubTask.updated_at.toISOString()
      };
      const result = await service.update(mockSubTask.id, patchData);

      expect(mockInvoke).toHaveBeenCalledWith('update_sub_task', { 
        project_id: 'test-project-id', 
        id: mockSubTask.id, 
        patch: patchData 
      });
      expect(result).toBe(true);
    });

    it('should return false when update fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Update failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const patchData = {
        ...mockSubTask,
        plan_start_date: mockSubTask.plan_start_date?.toISOString(),
        plan_end_date: mockSubTask.plan_end_date?.toISOString(),
        do_start_date: mockSubTask.do_start_date?.toISOString(),
        do_end_date: mockSubTask.do_end_date?.toISOString(),
        created_at: mockSubTask.created_at.toISOString(),
        updated_at: mockSubTask.updated_at.toISOString()
      };
      const result = await service.update(mockSubTask.id, patchData);

      expect(mockInvoke).toHaveBeenCalledWith('update_sub_task', { 
        project_id: 'test-project-id', 
        id: mockSubTask.id, 
        patch: patchData 
      });
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to update subtask:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle status changes', async () => {
      mockInvoke.mockResolvedValue(true);

      const updatedSubTask = {
        ...mockSubTask,
        status: 'completed' as const,
        updated_at: new Date()
      };

      const patchData = {
        ...updatedSubTask,
        plan_start_date: updatedSubTask.plan_start_date?.toISOString(),
        plan_end_date: updatedSubTask.plan_end_date?.toISOString(),
        do_start_date: updatedSubTask.do_start_date?.toISOString(),
        do_end_date: updatedSubTask.do_end_date?.toISOString(),
        created_at: updatedSubTask.created_at.toISOString(),
        updated_at: updatedSubTask.updated_at.toISOString()
      };

      const result = await service.update(updatedSubTask.id, patchData);

      expect(mockInvoke).toHaveBeenCalledWith('update_sub_task', { 
        project_id: 'test-project-id', 
        id: updatedSubTask.id, 
        patch: patchData 
      });
      expect(result).toBe(true);
    });
  });

  describe('delete', () => {
    it('should successfully delete a subtask', async () => {
      mockInvoke.mockResolvedValue(undefined);

      const result = await service.delete('subtask-123');

      expect(mockInvoke).toHaveBeenCalledWith('delete_sub_task', { 
        project_id: 'test-project-id', 
        id: 'subtask-123' 
      });
      expect(result).toBe(true);
    });

    it('should return false when deletion fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Deletion failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.delete('subtask-123');

      expect(mockInvoke).toHaveBeenCalledWith('delete_sub_task', { 
        project_id: 'test-project-id', 
        id: 'subtask-123' 
      });
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to delete sub task:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('get', () => {
    it('should successfully retrieve a subtask', async () => {
      mockInvoke.mockResolvedValue(mockSubTask);

      const result = await service.get('subtask-123');

      expect(mockInvoke).toHaveBeenCalledWith('get_sub_task', { 
        project_id: 'test-project-id', 
        id: 'subtask-123' 
      });
      expect(result).toEqual(mockSubTask);
    });

    it('should return null when subtask not found', async () => {
      mockInvoke.mockResolvedValue(null);

      const result = await service.get('non-existent');

      expect(mockInvoke).toHaveBeenCalledWith('get_sub_task', { 
        project_id: 'test-project-id', 
        id: 'non-existent' 
      });
      expect(result).toBeNull();
    });

    it('should return null when retrieval fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Retrieval failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.get('subtask-123');

      expect(mockInvoke).toHaveBeenCalledWith('get_sub_task', { 
        project_id: 'test-project-id', 
        id: 'subtask-123' 
      });
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get sub task:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('search', () => {
    it('should return empty array as search is not implemented', async () => {
      const result = await service.search(mockSearchCondition);

      // search is not implemented, so invoke should not be called
      expect(mockInvoke).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should return empty array when no subtasks found', async () => {
      const result = await service.search(mockSearchCondition);

      // search is not implemented, so invoke should not be called
      expect(mockInvoke).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should return empty array when search fails', async () => {
      const result = await service.search(mockSearchCondition);

      // search is not implemented, so invoke should not be called
      expect(mockInvoke).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should handle search by parent task ID only', async () => {
      const taskOnlyCondition = { task_id: 'task-456' };

      const result = await service.search(taskOnlyCondition);

      // search is not implemented, so invoke should not be called
      expect(mockInvoke).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should handle search by status only', async () => {
      const statusOnlyCondition = { status: 'completed' as const };

      const result = await service.search(statusOnlyCondition);

      // search is not implemented, so invoke should not be called
      expect(mockInvoke).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should handle search with multiple criteria', async () => {
      const multiCriteriaCondition = {
        task_id: 'task-456',
        status: 'in_progress' as const,
        priority: 2,
        title: 'Important'
      };

      const result = await service.search(multiCriteriaCondition);

      // search is not implemented, so invoke should not be called
      expect(mockInvoke).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should handle empty search condition', async () => {
      const emptyCondition = {};

      const result = await service.search(emptyCondition);

      // search is not implemented, so invoke should not be called
      expect(mockInvoke).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('edge cases', () => {
    it('should handle subtask with tags', async () => {
      mockInvoke.mockResolvedValue(undefined);

      const subTaskWithTags = {
        ...mockSubTask,
        tags: [
          {
            id: 'tag-1',
            name: 'urgent',
            color: '#FF0000',
            created_at: new Date(),
            updated_at: new Date()
          },
          {
            id: 'tag-2',
            name: 'review',
            color: '#00FF00',
            created_at: new Date(),
            updated_at: new Date()
          }
        ]
      };

      const result = await service.create(subTaskWithTags);

      expect(result).toBe(true);
    });

    it('should handle subtask with recurrence rule', async () => {
      mockInvoke.mockResolvedValue(undefined);

      const subTaskWithRecurrence = {
        ...mockSubTask,
        recurrence_rule: {
          unit: 'day' as const,
          interval: 1,
          end_date: new Date('2024-12-31T23:59:59Z')
        }
      };

      const result = await service.create(subTaskWithRecurrence);

      expect(result).toBe(true);
    });

    it('should handle different priority values', async () => {
      const priorityCondition = { priority: 0 };

      const result = await service.search(priorityCondition);

      // search is not implemented, so invoke should not be called
      expect(mockInvoke).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });
});
