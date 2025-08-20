import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskTauriService } from '$lib/services/backend/tauri/task-tauri-service';
import type { Task, TaskSearchCondition } from '$lib/types/task';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
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
      list_id: 'list-456',
      title: 'Test Task',
      description: 'Test Description',
      status: 'not_started',
      priority: 1,
      start_date: new Date('2024-01-01T00:00:00Z'),
      end_date: new Date('2024-01-02T00:00:00Z'),
      is_range_date: true,
      order_index: 0,
      is_archived: false,
      created_at: new Date('2024-01-01T00:00:00Z'),
      updated_at: new Date('2024-01-01T00:00:00Z')
    };
    mockSearchCondition = {
      list_id: 'list-456',
      status: 'not_started',
      is_archived: false
    };
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should successfully create a task', async () => {
      mockInvoke.mockResolvedValue(undefined);

      const result = await service.create(mockTask);

      expect(mockInvoke).toHaveBeenCalledWith('create_task', { task: mockTask });
      expect(result).toBe(true);
    });

    it('should return false when creation fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Creation failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.create(mockTask);

      expect(mockInvoke).toHaveBeenCalledWith('create_task', { task: mockTask });
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to create task:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('update', () => {
    it('should successfully update a task', async () => {
      mockInvoke.mockResolvedValue(undefined);

      const result = await service.update(mockTask);

      expect(mockInvoke).toHaveBeenCalledWith('update_task', { task: mockTask });
      expect(result).toBe(true);
    });

    it('should return false when update fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Update failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.update(mockTask);

      expect(mockInvoke).toHaveBeenCalledWith('update_task', { task: mockTask });
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to update task:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('delete', () => {
    it('should successfully delete a task', async () => {
      mockInvoke.mockResolvedValue(undefined);

      const result = await service.delete('task-123');

      expect(mockInvoke).toHaveBeenCalledWith('delete_task', { id: 'task-123' });
      expect(result).toBe(true);
    });

    it('should return false when deletion fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Deletion failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.delete('task-123');

      expect(mockInvoke).toHaveBeenCalledWith('delete_task', { id: 'task-123' });
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to delete task:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('get', () => {
    it('should successfully retrieve a task', async () => {
      mockInvoke.mockResolvedValue(mockTask);

      const result = await service.get('task-123');

      expect(mockInvoke).toHaveBeenCalledWith('get_task', { id: 'task-123' });
      expect(result).toEqual(mockTask);
    });

    it('should return null when task not found', async () => {
      mockInvoke.mockResolvedValue(null);

      const result = await service.get('non-existent');

      expect(mockInvoke).toHaveBeenCalledWith('get_task', { id: 'non-existent' });
      expect(result).toBeNull();
    });

    it('should return null when retrieval fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Retrieval failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.get('task-123');

      expect(mockInvoke).toHaveBeenCalledWith('get_task', { id: 'task-123' });
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get task:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('search', () => {
    it('should successfully search tasks', async () => {
      const mockTasks = [mockTask];
      mockInvoke.mockResolvedValue(mockTasks);

      const result = await service.search(mockSearchCondition);

      expect(mockInvoke).toHaveBeenCalledWith('search_tasks', { condition: mockSearchCondition });
      expect(result).toEqual(mockTasks);
    });

    it('should return empty array when no tasks found', async () => {
      mockInvoke.mockResolvedValue([]);

      const result = await service.search(mockSearchCondition);

      expect(mockInvoke).toHaveBeenCalledWith('search_tasks', { condition: mockSearchCondition });
      expect(result).toEqual([]);
    });

    it('should return empty array when search fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Search failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.search(mockSearchCondition);

      expect(mockInvoke).toHaveBeenCalledWith('search_tasks', { condition: mockSearchCondition });
      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to search tasks:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle search with empty condition', async () => {
      const emptyCondition = {};
      const mockTasks = [mockTask];
      mockInvoke.mockResolvedValue(mockTasks);

      const result = await service.search(emptyCondition);

      expect(mockInvoke).toHaveBeenCalledWith('search_tasks', { condition: emptyCondition });
      expect(result).toEqual(mockTasks);
    });
  });
});
