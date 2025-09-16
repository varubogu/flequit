import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TasklistTauriService } from '$lib/services/backend/tauri/tasklist-tauri-service';
import type { TaskList, TaskListSearchCondition } from '$lib/types/task-list';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}));

// Get the mocked invoke for use in tests
const mockInvoke = vi.mocked(await import('@tauri-apps/api/core')).invoke;

describe('TasklistTauriService', () => {
  let service: TasklistTauriService;
  let mockTaskList: TaskList;
  let mockSearchCondition: TaskListSearchCondition;

  beforeEach(() => {
    service = new TasklistTauriService();
    mockTaskList = {
      id: 'tasklist-123',
      projectId: 'project-456',
      name: 'Development Tasks',
      description: 'Tasks related to development work',
      color: '#3498DB',
      orderIndex: 0,
      isArchived: false,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z')
    };
    mockSearchCondition = {
      projectId: 'project-456',
      isArchived: false
    };
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should successfully create a task list', async () => {
      mockInvoke.mockResolvedValue(undefined);

      const result = await service.create('test-project-id', mockTaskList);

      expect(mockInvoke).toHaveBeenCalledWith('create_task_list', { task_list: mockTaskList });
      expect(result).toBe(true);
    });

    it('should return false when creation fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Creation failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.create('test-project-id', mockTaskList);

      expect(mockInvoke).toHaveBeenCalledWith('create_task_list', { task_list: mockTaskList });
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to create task list:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle task list with minimal data', async () => {
      mockInvoke.mockResolvedValue(undefined);

      const minimalTaskList = {
        id: 'tasklist-minimal',
        project_id: 'project-123',
        name: 'Basic List',
        order_index: 0,
        is_archived: false,
        created_at: new Date(),
        updated_at: new Date()
      };

      const result = await service.create('test-project-id', minimalTaskList);

      expect(mockInvoke).toHaveBeenCalledWith('create_task_list', { task_list: minimalTaskList });
      expect(result).toBe(true);
    });

    it('should handle task list with all optional fields', async () => {
      mockInvoke.mockResolvedValue(undefined);

      const fullTaskList = {
        id: 'tasklist-full',
        project_id: 'project-789',
        name: 'Complete List',
        description: 'Full description with details',
        color: '#E74C3C',
        order_index: 5,
        is_archived: false,
        created_at: new Date(),
        updated_at: new Date()
      };

      const result = await service.create('test-project-id', fullTaskList);

      expect(mockInvoke).toHaveBeenCalledWith('create_task_list', { task_list: fullTaskList });
      expect(result).toBe(true);
    });
  });

  describe('update', () => {
    it('should successfully update a task list', async () => {
      mockInvoke.mockResolvedValue(true);

      const result = await service.update('test-project-id', mockTaskList.id, mockTaskList);

      expect(mockInvoke).toHaveBeenCalledWith('update_task_list', { project_id: 'test-project-id', id: mockTaskList.id, patch: mockTaskList });
      expect(result).toBe(true);
    });

    it('should return false when update fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Update failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.update('test-project-id', mockTaskList.id, mockTaskList);

      expect(mockInvoke).toHaveBeenCalledWith('update_task_list', { project_id: 'test-project-id', id: mockTaskList.id, patch: mockTaskList });
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to update task list:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle name change', async () => {
      mockInvoke.mockResolvedValue(true);

      const renamedTaskList = {
        ...mockTaskList,
        name: 'Updated Development Tasks',
        updated_at: new Date()
      };

      const result = await service.update('test-project-id', renamedTaskList.id, renamedTaskList);

      expect(mockInvoke).toHaveBeenCalledWith('update_task_list', { project_id: 'test-project-id', id: renamedTaskList.id, patch: renamedTaskList });
      expect(result).toBe(true);
    });

    it('should handle archive status change', async () => {
      mockInvoke.mockResolvedValue(true);

      const archivedTaskList = {
        ...mockTaskList,
        is_archived: true,
        updated_at: new Date()
      };

      const result = await service.update('test-project-id', archivedTaskList.id, archivedTaskList);

      expect(mockInvoke).toHaveBeenCalledWith('update_task_list', { project_id: 'test-project-id', id: archivedTaskList.id, patch: archivedTaskList });
      expect(result).toBe(true);
    });

    it('should handle order index change', async () => {
      mockInvoke.mockResolvedValue(true);

      const reorderedTaskList = {
        ...mockTaskList,
        order_index: 10,
        updated_at: new Date()
      };

      const result = await service.update('test-project-id', reorderedTaskList.id, reorderedTaskList);

      expect(mockInvoke).toHaveBeenCalledWith('update_task_list', { project_id: 'test-project-id', id: reorderedTaskList.id, patch: reorderedTaskList });
      expect(result).toBe(true);
    });
  });

  describe('delete', () => {
    it('should successfully delete a task list', async () => {
      mockInvoke.mockResolvedValue(undefined);

      const result = await service.delete('test-project-id', 'tasklist-123');

      expect(mockInvoke).toHaveBeenCalledWith('delete_task_list', { project_id: 'test-project-id', id: 'tasklist-123' });
      expect(result).toBe(true);
    });

    it('should return false when deletion fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Deletion failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.delete('test-project-id', 'tasklist-123');

      expect(mockInvoke).toHaveBeenCalledWith('delete_task_list', { project_id: 'test-project-id', id: 'tasklist-123' });
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to delete task list:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('get', () => {
    it('should successfully retrieve a task list', async () => {
      mockInvoke.mockResolvedValue(mockTaskList);

      const result = await service.get('test-project-id', 'tasklist-123');

      expect(mockInvoke).toHaveBeenCalledWith('get_task_list', { project_id: 'test-project-id', id: 'tasklist-123' });
      expect(result).toEqual(mockTaskList);
    });

    it('should return null when task list not found', async () => {
      mockInvoke.mockResolvedValue(null);

      const result = await service.get('test-project-id', 'non-existent');

      expect(mockInvoke).toHaveBeenCalledWith('get_task_list', { project_id: 'test-project-id', id: 'non-existent' });
      expect(result).toBeNull();
    });

    it('should return null when retrieval fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Retrieval failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.get('test-project-id', 'tasklist-123');

      expect(mockInvoke).toHaveBeenCalledWith('get_task_list', { project_id: 'test-project-id', id: 'tasklist-123' });
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get task list:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('search', () => {
    it('should return empty array as mock implementation', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await service.search('test-project-id', mockSearchCondition);

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('search_task_lists is not implemented on Tauri side - using mock implementation');

      consoleSpy.mockRestore();
    });

    it('should handle search with empty condition', async () => {
      const emptyCondition = {};
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await service.search('test-project-id', emptyCondition);

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('search_task_lists is not implemented on Tauri side - using mock implementation');

      consoleSpy.mockRestore();
    });
  });

  describe('edge cases', () => {
    it('should handle task list with special characters in name', async () => {
      mockInvoke.mockResolvedValue(undefined);

      const specialCharTaskList = {
        ...mockTaskList,
        name: 'タスクリスト！@#$% & Special chars',
        description: 'Description with émojis 🚀 and ünïcödé'
      };

      const result = await service.create('test-project-id', specialCharTaskList);

      expect(result).toBe(true);
    });

    it('should handle task list with various order indices', async () => {
      mockInvoke.mockResolvedValue(undefined);

      const orderIndices = [0, 1, 10, 100, -1];

      for (const orderIndex of orderIndices) {
        const orderTaskList = {
          ...mockTaskList,
          id: `tasklist-order-${orderIndex}`,
          order_index: orderIndex
        };

        const result = await service.create('test-project-id', orderTaskList);
        expect(result).toBe(true);
      }
    });

    it('should handle task list with different color formats', async () => {
      mockInvoke.mockResolvedValue(undefined);

      const colorFormats = [
        '#FF0000',
        '#00FF00',
        '#0000FF',
        '#FFFFFF',
        '#000000',
        '#FF5733',
        undefined // No color
      ];

      for (const color of colorFormats) {
        const colorTaskList = {
          ...mockTaskList,
          id: `tasklist-color-${color || 'none'}`,
          color
        };

        const result = await service.create('test-project-id', colorTaskList);
        expect(result).toBe(true);
      }
    });

    it('should handle search with order index criteria', async () => {
      const orderCondition = { order_index: 5 };
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await service.search('test-project-id', orderCondition);

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('search_task_lists is not implemented on Tauri side - using mock implementation');

      consoleSpy.mockRestore();
    });

    it('should handle task list with very long names and descriptions', async () => {
      mockInvoke.mockResolvedValue(undefined);

      const longTaskList = {
        ...mockTaskList,
        name: 'A'.repeat(1000), // Very long name
        description: 'B'.repeat(5000) // Very long description
      };

      const result = await service.create('test-project-id', longTaskList);

      expect(result).toBe(true);
    });
  });
});
