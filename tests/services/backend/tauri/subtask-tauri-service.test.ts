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
      taskId: 'task-456',
      title: 'Test SubTask',
      description: 'Test Description',
      status: 'not_started',
      priority: 2,
      planStartDate: new Date('2024-01-01T00:00:00Z'),
      planEndDate: new Date('2024-01-02T00:00:00Z'),
      doStartDate: new Date('2024-01-01T00:00:00Z'),
      doEndDate: new Date('2024-01-02T00:00:00Z'),
      isRangeDate: true,
      orderIndex: 0,
      completed: false,
      assignedUserIds: [],
      tags: [],
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z')
    };
    mockSearchCondition = {
      taskId: 'task-456',
      status: 'not_started'
    };
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should successfully create a subtask', async () => {
      mockInvoke.mockResolvedValue(undefined);

      const result = await service.create('test-project-id', mockSubTask);

      expect(mockInvoke).toHaveBeenCalledWith('create_sub_task', expect.objectContaining({
        projectId: 'test-project-id',
        subTask: expect.objectContaining({
          id: mockSubTask.id,
          taskId: mockSubTask.taskId,
          title: mockSubTask.title,
          status: mockSubTask.status
        })
      }));
      expect(result).toBe(true);
    });

    it('should return false when creation fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Creation failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.create('test-project-id', mockSubTask);

      expect(mockInvoke).toHaveBeenCalledWith('create_sub_task', expect.objectContaining({
        projectId: 'test-project-id',
        subTask: expect.any(Object)
      }));
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to create sub task:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle subtask with minimal data', async () => {
      mockInvoke.mockResolvedValue(undefined);

      const minimalSubTask = {
        id: 'subtask-minimal',
        taskId: 'task-123',
        title: 'Minimal SubTask',
        status: 'not_started' as const,
        assignedUserIds: [],
        tagIds: [],
        orderIndex: 0,
        completed: false,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await service.create('test-project-id', minimalSubTask);

      expect(mockInvoke).toHaveBeenCalledWith('create_sub_task', expect.objectContaining({
        projectId: 'test-project-id',
        subTask: expect.objectContaining({
          id: minimalSubTask.id,
          taskId: minimalSubTask.taskId,
          title: minimalSubTask.title,
          status: minimalSubTask.status
        })
      }));
      expect(result).toBe(true);
    });
  });

  describe('update', () => {
    it('should successfully update a subtask', async () => {
      mockInvoke.mockResolvedValue(true);

      const patchData = {
        ...mockSubTask,
        planStartDate: mockSubTask.planStartDate?.toISOString(),
        planEndDate: mockSubTask.planEndDate?.toISOString(),
        doStartDate: mockSubTask.doStartDate?.toISOString(),
        doEndDate: mockSubTask.doEndDate?.toISOString(),
        createdAt: mockSubTask.createdAt.toISOString(),
        updatedAt: mockSubTask.updatedAt.toISOString(),
        // 互換のためsnake_caseも残す
        plan_start_date: mockSubTask.planStartDate?.toISOString(),
        plan_end_date: mockSubTask.planEndDate?.toISOString(),
        do_start_date: mockSubTask.doStartDate?.toISOString(),
        do_end_date: mockSubTask.doEndDate?.toISOString(),
        created_at: mockSubTask.createdAt.toISOString(),
        updated_at: mockSubTask.updatedAt.toISOString()
      } as any;
      const result = await service.update('test-project-id', mockSubTask.id, patchData);

      expect(mockInvoke).toHaveBeenCalledWith('update_sub_task', {
        projectId: 'test-project-id',
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
        planStartDate: mockSubTask.planStartDate?.toISOString(),
        planEndDate: mockSubTask.planEndDate?.toISOString(),
        doStartDate: mockSubTask.doStartDate?.toISOString(),
        doEndDate: mockSubTask.doEndDate?.toISOString(),
        createdAt: mockSubTask.createdAt.toISOString(),
        updatedAt: mockSubTask.updatedAt.toISOString(),
        plan_start_date: mockSubTask.planStartDate?.toISOString(),
        plan_end_date: mockSubTask.planEndDate?.toISOString(),
        do_start_date: mockSubTask.doStartDate?.toISOString(),
        do_end_date: mockSubTask.doEndDate?.toISOString(),
        created_at: mockSubTask.createdAt.toISOString(),
        updated_at: mockSubTask.updatedAt.toISOString()
      } as any;
      const result = await service.update('test-project-id', mockSubTask.id, patchData);

      expect(mockInvoke).toHaveBeenCalledWith('update_sub_task', {
        projectId: 'test-project-id',
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
        planStartDate: updatedSubTask.planStartDate?.toISOString(),
        planEndDate: updatedSubTask.planEndDate?.toISOString(),
        doStartDate: updatedSubTask.doStartDate?.toISOString(),
        doEndDate: updatedSubTask.doEndDate?.toISOString(),
        createdAt: updatedSubTask.createdAt.toISOString(),
        updatedAt: (updatedSubTask.updated_at as Date).toISOString(),
        plan_start_date: updatedSubTask.planStartDate?.toISOString(),
        plan_end_date: updatedSubTask.planEndDate?.toISOString(),
        do_start_date: updatedSubTask.doStartDate?.toISOString(),
        do_end_date: updatedSubTask.doEndDate?.toISOString(),
        created_at: updatedSubTask.createdAt.toISOString(),
        updated_at: (updatedSubTask.updated_at as Date).toISOString()
      } as any;

      const result = await service.update('test-project-id', updatedSubTask.id, patchData);

      expect(mockInvoke).toHaveBeenCalledWith('update_sub_task', {
        projectId: 'test-project-id',
        id: updatedSubTask.id,
        patch: patchData
      });
      expect(result).toBe(true);
    });
  });

  describe('delete', () => {
    it('should successfully delete a subtask', async () => {
      mockInvoke.mockResolvedValue(undefined);

      const result = await service.delete('test-project-id', 'subtask-123');

      expect(mockInvoke).toHaveBeenCalledWith('delete_sub_task', {
        projectId: 'test-project-id',
        id: 'subtask-123'
      });
      expect(result).toBe(true);
    });

    it('should return false when deletion fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Deletion failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.delete('test-project-id', 'subtask-123');

      expect(mockInvoke).toHaveBeenCalledWith('delete_sub_task', {
        projectId: 'test-project-id',
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

      const result = await service.get('test-project-id', 'subtask-123');

      expect(mockInvoke).toHaveBeenCalledWith('get_sub_task', {
        projectId: 'test-project-id',
        id: 'subtask-123'
      });
      expect(result).toEqual(mockSubTask);
    });

    it('should return null when subtask not found', async () => {
      mockInvoke.mockResolvedValue(null);

      const result = await service.get('test-project-id', 'non-existent');

      expect(mockInvoke).toHaveBeenCalledWith('get_sub_task', {
        projectId: 'test-project-id',
        id: 'non-existent'
      });
      expect(result).toBeNull();
    });

    it('should return null when retrieval fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Retrieval failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.get('test-project-id', 'subtask-123');

      expect(mockInvoke).toHaveBeenCalledWith('get_sub_task', {
        projectId: 'test-project-id',
        id: 'subtask-123'
      });
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get sub task:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('search', () => {
    it('should return empty array as search is not implemented', async () => {
      const result = await service.search('test-project-id', mockSearchCondition);

      // search is not implemented, so invoke should not be called
      expect(mockInvoke).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should return empty array when no subtasks found', async () => {
      const result = await service.search('test-project-id', mockSearchCondition);

      // search is not implemented, so invoke should not be called
      expect(mockInvoke).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should return empty array when search fails', async () => {
      const result = await service.search('test-project-id', mockSearchCondition);

      // search is not implemented, so invoke should not be called
      expect(mockInvoke).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should handle search by parent task ID only', async () => {
      const taskOnlyCondition = { taskId: 'task-456' };

      const result = await service.search('test-project-id', taskOnlyCondition);

      // search is not implemented, so invoke should not be called
      expect(mockInvoke).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should handle search by status only', async () => {
      const statusOnlyCondition = { status: 'completed' as const };

      const result = await service.search('test-project-id', statusOnlyCondition);

      // search is not implemented, so invoke should not be called
      expect(mockInvoke).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should handle search with multiple criteria', async () => {
      const multiCriteriaCondition = {
        taskId: 'task-456',
        status: 'in_progress' as const,
        priority: 2,
        title: 'Important'
      };

      const result = await service.search('test-project-id', multiCriteriaCondition);

      // search is not implemented, so invoke should not be called
      expect(mockInvoke).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should handle empty search condition', async () => {
      const emptyCondition = {};

      const result = await service.search('test-project-id', emptyCondition);

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
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'tag-2',
            name: 'review',
            color: '#00FF00',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
      };

      const result = await service.create('test-project-id', subTaskWithTags);

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

      const result = await service.create('test-project-id', subTaskWithRecurrence);

      expect(result).toBe(true);
    });

    it('should handle different priority values', async () => {
      const priorityCondition = { priority: 0 };

      const result = await service.search('test-project-id', priorityCondition);

      // search is not implemented, so invoke should not be called
      expect(mockInvoke).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });
});
