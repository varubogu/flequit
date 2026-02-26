import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskRecurrenceTauriService } from '$lib/infrastructure/backends/tauri/task-recurrence-tauri-service';
import type {
  TaskRecurrence,
  TaskRecurrenceSearchCondition
} from '$lib/types/recurrence-reference';

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

      const result = await service.create('test-project', mockTaskRecurrence, 'test-user-id');

      expect(mockInvoke).toHaveBeenCalledWith('create_task_recurrence', {
        projectId: 'test-project',
        taskRecurrence: mockTaskRecurrence,
        userId: 'test-user-id'
      });
      expect(result).toBe(true);
    });

    it('should return false when creation fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Creation failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.create('test-project', mockTaskRecurrence, 'test-user-id');

      expect(mockInvoke).toHaveBeenCalledWith('create_task_recurrence', {
        projectId: 'test-project',
        taskRecurrence: mockTaskRecurrence,
        userId: 'test-user-id'
      });
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to create task recurrence:',
        expect.any(Error)
      );

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
        const result = await service.create('test-project', testCase, 'test-user-id');
        expect(result).toBe(true);
        expect(mockInvoke).toHaveBeenCalledWith('create_task_recurrence', {
          projectId: 'test-project',
          taskRecurrence: testCase,
          userId: 'test-user-id'
        });
      }
    });
  });

  describe('getByTaskId', () => {
    it('should successfully retrieve a task recurrence by task ID', async () => {
      mockInvoke.mockResolvedValue(mockTaskRecurrence);

      const result = await service.getByTaskId('test-project', 'task-123', 'test-user-id');

      expect(mockInvoke).toHaveBeenCalledWith('get_task_recurrence_by_task_id', {
        projectId: 'test-project',
        taskId: 'task-123',
        userId: 'test-user-id'
      });
      expect(result).toEqual(mockTaskRecurrence);
    });

    it('should return null when task recurrence not found', async () => {
      mockInvoke.mockResolvedValue(null);

      const result = await service.getByTaskId('test-project', 'non-existent', 'test-user-id');

      expect(mockInvoke).toHaveBeenCalledWith('get_task_recurrence_by_task_id', {
        projectId: 'test-project',
        taskId: 'non-existent',
        userId: 'test-user-id'
      });
      expect(result).toBeNull();
    });

    it('should return null when retrieval fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Retrieval failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.getByTaskId('test-project', 'task-123', 'test-user-id');

      expect(mockInvoke).toHaveBeenCalledWith('get_task_recurrence_by_task_id', {
        projectId: 'test-project',
        taskId: 'task-123',
        userId: 'test-user-id'
      });
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to get task recurrence by task ID:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should handle various task ID formats', async () => {
      mockInvoke.mockResolvedValue(mockTaskRecurrence);

      const taskIds = ['task-123', 'TASK_456', 'task.789', 'task@abc'];

      for (const taskId of taskIds) {
        const result = await service.getByTaskId('test-project', taskId, 'test-user-id');
        expect(mockInvoke).toHaveBeenCalledWith('get_task_recurrence_by_task_id', {
          projectId: 'test-project',
          taskId,
          userId: 'test-user-id'
        });
        expect(result).toEqual(mockTaskRecurrence);
      }
    });
  });

  describe('delete', () => {
    it('should successfully delete a task recurrence', async () => {
      mockInvoke.mockResolvedValue(true);

      const result = await service.delete('test-project', 'task-123', 'test-user-id');

      expect(mockInvoke).toHaveBeenCalledWith('delete_task_recurrence', {
        projectId: 'test-project',
        taskId: 'task-123',
        userId: 'test-user-id'
      });
      expect(result).toBe(true);
    });

    it('should return false when deletion fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Deletion failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.delete('test-project', 'task-123', 'test-user-id');

      expect(mockInvoke).toHaveBeenCalledWith('delete_task_recurrence', {
        projectId: 'test-project',
        taskId: 'task-123',
        userId: 'test-user-id'
      });
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to delete task recurrence:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should handle deletion of non-existent task recurrence', async () => {
      mockInvoke.mockResolvedValue(false);

      const result = await service.delete('test-project', 'non-existent', 'test-user-id');

      expect(mockInvoke).toHaveBeenCalledWith('delete_task_recurrence', {
        projectId: 'test-project',
        taskId: 'non-existent',
        userId: 'test-user-id'
      });
      expect(result).toBe(false);
    });
  });

  describe('search', () => {
    it('should return empty array as search is not implemented', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await service.search('test-project', mockSearchCondition);

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        'search_task_recurrences is not implemented - using mock implementation'
      );

      consoleSpy.mockRestore();
    });

    it('should handle search with empty condition', async () => {
      const emptyCondition = {};
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await service.search('test-project', emptyCondition);

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        'search_task_recurrences is not implemented - using mock implementation'
      );

      consoleSpy.mockRestore();
    });

    it('should handle search with task_id condition', async () => {
      const condition = { taskId: 'task-123' };
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await service.search('test-project', condition);

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        'search_task_recurrences is not implemented - using mock implementation'
      );

      consoleSpy.mockRestore();
    });

    it('should handle search with recurrence_rule_id condition', async () => {
      const condition = { recurrenceRuleId: 'rule-456' };
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await service.search('test-project', condition);

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        'search_task_recurrences is not implemented - using mock implementation'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('edge cases', () => {
    it('should handle empty string task IDs', async () => {
      mockInvoke.mockResolvedValue(null);

      const result = await service.getByTaskId('test-project', '', 'test-user-id');

      expect(mockInvoke).toHaveBeenCalledWith('get_task_recurrence_by_task_id', {
        projectId: 'test-project',
        taskId: '',
        userId: 'test-user-id'
      });
      expect(result).toBeNull();
    });

    it('should handle task recurrence with long IDs', async () => {
      mockInvoke.mockResolvedValue(true);

      const longTaskRecurrence = {
        taskId: 'task-' + 'a'.repeat(100),
        recurrenceRuleId: 'rule-' + 'b'.repeat(100)
      };

      const result = await service.create('test-project', longTaskRecurrence, 'test-user-id');

      expect(result).toBe(true);
    });

    it('should handle concurrent operations', async () => {
      mockInvoke.mockResolvedValue(true);

      const operations = [
        service.create(
          'test-project',
          { taskId: 'task-1', recurrenceRuleId: 'rule-1' },
          'test-user-id'
        ),
        service.create(
          'test-project',
          { taskId: 'task-2', recurrenceRuleId: 'rule-2' },
          'test-user-id'
        ),
        service.getByTaskId('test-project', 'task-3', 'test-user-id'),
        service.delete('test-project', 'task-4', 'test-user-id')
      ];

      const results = await Promise.all(operations);

      expect(results[0]).toBe(true); // create 1
      expect(results[1]).toBe(true); // create 2
      expect(results[2]).toBe(true); // get (returns true from mock)
      expect(results[3]).toBe(true); // delete
    });
  });
});
