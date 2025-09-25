import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskRecurrenceTauriService } from '$lib/services/backend/tauri/task-recurrence-tauri-service';
import type { TaskRecurrence, TaskRecurrenceSearchCondition } from '$lib/types/task-recurrence';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}));

// Get the mocked invoke for use in tests
const mockInvoke = vi.mocked(await import('@tauri-apps/api/core')).invoke;

describe('TaskRecurrenceTauriService', () => {
  let service: TaskRecurrenceTauriService;
  let mockTaskRecurrence: TaskRecurrence;
  let mockSearchCondition: TaskRecurrenceSearchCondition;

  beforeEach(() => {
    service = new TaskRecurrenceTauriService();
    mockTaskRecurrence = {
      taskId: 'task-123',
      recurrenceRuleId: 'rule-456'
    };
    mockSearchCondition = {
      taskId: 'task-123'
    };
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should successfully create a task recurrence', async () => {
      mockInvoke.mockResolvedValue(true);

      const result = await service.create(mockTaskRecurrence);

      expect(mockInvoke).toHaveBeenCalledWith('create_task_recurrence', {
        taskRecurrence: mockTaskRecurrence
      });
      expect(result).toBe(true);
    });

    it('should return false when creation fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Creation failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.create(mockTaskRecurrence);

      expect(mockInvoke).toHaveBeenCalledWith('create_task_recurrence', {
        taskRecurrence: mockTaskRecurrence
      });
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to create task recurrence:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle different task and rule combinations', async () => {
      mockInvoke.mockResolvedValue(true);

      const testCases = [
        { taskId: 'task-1', recurrenceRuleId: 'rule-1' },
        { taskId: 'task-2', recurrenceRuleId: 'rule-2' },
        { taskId: 'task-3', recurrenceRuleId: 'rule-1' }
      ];

      for (const testCase of testCases) {
        const result = await service.create(testCase);
        expect(result).toBe(true);
        expect(mockInvoke).toHaveBeenCalledWith('create_task_recurrence', {
          taskRecurrence: testCase
        });
      }
    });
  });

  describe('getByTaskId', () => {
    it('should successfully retrieve a task recurrence by task ID', async () => {
      mockInvoke.mockResolvedValue(mockTaskRecurrence);

      const result = await service.getByTaskId('task-123');

      expect(mockInvoke).toHaveBeenCalledWith('get_task_recurrence_by_task_id', {
        taskId: 'task-123'
      });
      expect(result).toEqual(mockTaskRecurrence);
    });

    it('should return null when task recurrence not found', async () => {
      mockInvoke.mockResolvedValue(null);

      const result = await service.getByTaskId('non-existent');

      expect(mockInvoke).toHaveBeenCalledWith('get_task_recurrence_by_task_id', {
        taskId: 'non-existent'
      });
      expect(result).toBeNull();
    });

    it('should return null when retrieval fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Retrieval failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.getByTaskId('task-123');

      expect(mockInvoke).toHaveBeenCalledWith('get_task_recurrence_by_task_id', {
        taskId: 'task-123'
      });
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get task recurrence by task ID:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle various task ID formats', async () => {
      mockInvoke.mockResolvedValue(mockTaskRecurrence);

      const taskIds = ['task-123', 'TASK_456', 'task.789', 'task@abc'];

      for (const taskId of taskIds) {
        const result = await service.getByTaskId(taskId);
        expect(mockInvoke).toHaveBeenCalledWith('get_task_recurrence_by_task_id', {
          taskId
        });
        expect(result).toEqual(mockTaskRecurrence);
      }
    });
  });

  describe('delete', () => {
    it('should successfully delete a task recurrence', async () => {
      mockInvoke.mockResolvedValue(true);

      const result = await service.delete('task-123');

      expect(mockInvoke).toHaveBeenCalledWith('delete_task_recurrence', {
        taskId: 'task-123'
      });
      expect(result).toBe(true);
    });

    it('should return false when deletion fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Deletion failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.delete('task-123');

      expect(mockInvoke).toHaveBeenCalledWith('delete_task_recurrence', {
        taskId: 'task-123'
      });
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to delete task recurrence:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle deletion of non-existent task recurrence', async () => {
      mockInvoke.mockResolvedValue(false);

      const result = await service.delete('non-existent');

      expect(mockInvoke).toHaveBeenCalledWith('delete_task_recurrence', {
        taskId: 'non-existent'
      });
      expect(result).toBe(false);
    });
  });

  describe('search', () => {
    it('should return empty array as search is not implemented', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await service.search(mockSearchCondition);

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('search_task_recurrences is not implemented - using mock implementation');

      consoleSpy.mockRestore();
    });

    it('should handle search with empty condition', async () => {
      const emptyCondition = {};
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await service.search(emptyCondition);

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('search_task_recurrences is not implemented - using mock implementation');

      consoleSpy.mockRestore();
    });

    it('should handle search with task_id condition', async () => {
      const condition = { task_id: 'task-123' };
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await service.search(condition);

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('search_task_recurrences is not implemented - using mock implementation');

      consoleSpy.mockRestore();
    });

    it('should handle search with recurrence_rule_id condition', async () => {
      const condition = { recurrence_rule_id: 'rule-456' };
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await service.search(condition);

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('search_task_recurrences is not implemented - using mock implementation');

      consoleSpy.mockRestore();
    });
  });

  describe('edge cases', () => {
    it('should handle empty string task IDs', async () => {
      mockInvoke.mockResolvedValue(null);

      const result = await service.getByTaskId('');

      expect(mockInvoke).toHaveBeenCalledWith('get_task_recurrence_by_task_id', {
        taskId: ''
      });
      expect(result).toBeNull();
    });

    it('should handle task recurrence with long IDs', async () => {
      mockInvoke.mockResolvedValue(true);

      const longTaskRecurrence = {
        task_id: 'task-' + 'a'.repeat(100),
        recurrence_rule_id: 'rule-' + 'b'.repeat(100)
      };

      const result = await service.create(longTaskRecurrence);

      expect(result).toBe(true);
    });

    it('should handle concurrent operations', async () => {
      mockInvoke.mockResolvedValue(true);

      const operations = [
        service.create({ taskId: 'task-1', recurrenceRuleId: 'rule-1' }),
        service.create({ taskId: 'task-2', recurrenceRuleId: 'rule-2' }),
        service.getByTaskId('task-3'),
        service.delete('task-4')
      ];

      const results = await Promise.all(operations);

      expect(results[0]).toBe(true);  // create 1
      expect(results[1]).toBe(true);  // create 2
      expect(results[2]).toBe(true);  // get (returns true from mock)
      expect(results[3]).toBe(true);  // delete
    });
  });
});
