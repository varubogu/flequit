import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubtaskRecurrenceTauriService } from '$lib/infrastructure/backends/tauri/subtask-recurrence-tauri-service';
import type { SubtaskRecurrence, SubtaskRecurrenceSearchCondition } from '$lib/types/recurrence-reference';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}));

// Get the mocked invoke for use in tests
const mockInvoke = vi.mocked(await import('@tauri-apps/api/core')).invoke;

describe('SubtaskRecurrenceTauriService', () => {
  let service: SubtaskRecurrenceTauriService;
  let mockSubtaskRecurrence: SubtaskRecurrence;
  let mockSearchCondition: SubtaskRecurrenceSearchCondition;

  beforeEach(() => {
    service = new SubtaskRecurrenceTauriService();
    mockSubtaskRecurrence = {
      subtaskId: 'subtask-123',
      recurrenceRuleId: 'rule-456'
    };
    mockSearchCondition = {
      subtaskId: 'subtask-123'
    };
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should successfully create a subtask recurrence', async () => {
      mockInvoke.mockResolvedValue(true);

      const result = await service.create('test-project', mockSubtaskRecurrence, 'test-user-id');

      expect(mockInvoke).toHaveBeenCalledWith('create_subtask_recurrence', {
        projectId: 'test-project', subtaskRecurrence: mockSubtaskRecurrence, userId: 'test-user-id'
      });
      expect(result).toBe(true);
    });

    it('should return false when creation fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Creation failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.create('test-project', mockSubtaskRecurrence, 'test-user-id');

      expect(mockInvoke).toHaveBeenCalledWith('create_subtask_recurrence', {
        projectId: 'test-project', subtaskRecurrence: mockSubtaskRecurrence, userId: 'test-user-id'
      });
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to create subtask recurrence:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle different subtask and rule combinations', async () => {
      mockInvoke.mockResolvedValue(true);

      const testCases = [
        { subtaskId: 'subtask-1', recurrenceRuleId: 'rule-1' },
        { subtaskId: 'subtask-2', recurrenceRuleId: 'rule-2' },
        { subtaskId: 'subtask-3', recurrenceRuleId: 'rule-1' }
      ];

      for (const testCase of testCases) {
        const result = await service.create('test-project', testCase, 'test-user-id');
        expect(result).toBe(true);
        expect(mockInvoke).toHaveBeenCalledWith('create_subtask_recurrence', {
          projectId: 'test-project', subtaskRecurrence: testCase, userId: 'test-user-id'
        });
      }
    });
  });

  describe('getBySubtaskId', () => {
    it('should successfully retrieve a subtask recurrence by subtask ID', async () => {
      mockInvoke.mockResolvedValue(mockSubtaskRecurrence);

      const result = await service.getBySubtaskId('test-project', 'subtask-123', 'test-user-id');

      expect(mockInvoke).toHaveBeenCalledWith('get_subtask_recurrence_by_subtask_id', {
        projectId: 'test-project', subtaskId: 'subtask-123', userId: 'test-user-id'
      });
      expect(result).toEqual(mockSubtaskRecurrence);
    });

    it('should return null when subtask recurrence not found', async () => {
      mockInvoke.mockResolvedValue(null);

      const result = await service.getBySubtaskId('test-project', 'non-existent', 'test-user-id');

      expect(mockInvoke).toHaveBeenCalledWith('get_subtask_recurrence_by_subtask_id', {
        projectId: 'test-project', subtaskId: 'non-existent', userId: 'test-user-id'
      });
      expect(result).toBeNull();
    });

    it('should return null when retrieval fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Retrieval failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.getBySubtaskId('test-project', 'subtask-123', 'test-user-id');

      expect(mockInvoke).toHaveBeenCalledWith('get_subtask_recurrence_by_subtask_id', {
        projectId: 'test-project', subtaskId: 'subtask-123', userId: 'test-user-id'
      });
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get subtask recurrence by subtask ID:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle various subtask ID formats', async () => {
      mockInvoke.mockResolvedValue(mockSubtaskRecurrence);

      const subtaskIds = ['subtask-123', 'SUBTASK_456', 'subtask.789', 'subtask@abc'];

      for (const subtaskId of subtaskIds) {
        const result = await service.getBySubtaskId('test-project', subtaskId, 'test-user-id');
        expect(mockInvoke).toHaveBeenCalledWith('get_subtask_recurrence_by_subtask_id', {
          projectId: 'test-project', subtaskId, userId: 'test-user-id'
        });
        expect(result).toEqual(mockSubtaskRecurrence);
      }
    });
  });

  describe('delete', () => {
    it('should successfully delete a subtask recurrence', async () => {
      mockInvoke.mockResolvedValue(true);

      const result = await service.delete('test-project', 'subtask-123', 'test-user-id');

      expect(mockInvoke).toHaveBeenCalledWith('delete_subtask_recurrence', {
        projectId: 'test-project', subtaskId: 'subtask-123', userId: 'test-user-id'
      });
      expect(result).toBe(true);
    });

    it('should return false when deletion fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Deletion failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.delete('test-project', 'subtask-123', 'test-user-id');

      expect(mockInvoke).toHaveBeenCalledWith('delete_subtask_recurrence', {
        projectId: 'test-project', subtaskId: 'subtask-123', userId: 'test-user-id'
      });
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to delete subtask recurrence:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle deletion of non-existent subtask recurrence', async () => {
      mockInvoke.mockResolvedValue(false);

      const result = await service.delete('test-project', 'non-existent', 'test-user-id');

      expect(mockInvoke).toHaveBeenCalledWith('delete_subtask_recurrence', {
        projectId: 'test-project', subtaskId: 'non-existent', userId: 'test-user-id'
      });
      expect(result).toBe(false);
    });
  });

  describe('search', () => {
    it('should return empty array as search is not implemented', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await service.search('test-project', mockSearchCondition);

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('search_subtask_recurrences is not implemented - using mock implementation');

      consoleSpy.mockRestore();
    });

    it('should handle search with empty condition', async () => {
      const emptyCondition = {};
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await service.search('test-project', emptyCondition);

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('search_subtask_recurrences is not implemented - using mock implementation');

      consoleSpy.mockRestore();
    });

    it('should handle search with subtask_id condition', async () => {
      const condition = { subtaskId: 'subtask-123' };
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await service.search('test-project', condition);

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('search_subtask_recurrences is not implemented - using mock implementation');

      consoleSpy.mockRestore();
    });

    it('should handle search with recurrence_rule_id condition', async () => {
      const condition = { recurrenceRuleId: 'rule-456' };
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await service.search('test-project', condition);

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('search_subtask_recurrences is not implemented - using mock implementation');

      consoleSpy.mockRestore();
    });
  });

  describe('edge cases', () => {
    it('should handle empty string subtask IDs', async () => {
      mockInvoke.mockResolvedValue(null);

      const result = await service.getBySubtaskId('test-project', '', 'test-user-id');

      expect(mockInvoke).toHaveBeenCalledWith('get_subtask_recurrence_by_subtask_id', {
        projectId: 'test-project', subtaskId: '', userId: 'test-user-id'
      });
      expect(result).toBeNull();
    });

    it('should handle subtask recurrence with long IDs', async () => {
      mockInvoke.mockResolvedValue(true);

      const longSubtaskRecurrence = {
        subtaskId: 'subtask-' + 'a'.repeat(100),
        recurrenceRuleId: 'rule-' + 'b'.repeat(100)
      };

      const result = await service.create('test-project', longSubtaskRecurrence, 'test-user-id');

      expect(result).toBe(true);
    });

    it('should handle concurrent operations', async () => {
      mockInvoke.mockResolvedValue(true);

      const operations = [
        service.create('test-project', { subtaskId: 'subtask-1', recurrenceRuleId: 'rule-1' }, 'test-user-id'),
        service.create('test-project', { subtaskId: 'subtask-2', recurrenceRuleId: 'rule-2' }, 'test-user-id'),
        service.getBySubtaskId('test-project', 'subtask-3', 'test-user-id'),
        service.delete('test-project', 'subtask-4', 'test-user-id')
      ];

      const results = await Promise.all(operations);

      expect(results[0]).toBe(true);  // create 1
      expect(results[1]).toBe(true);  // create 2
      expect(results[2]).toBe(true);  // get (returns true from mock)
      expect(results[3]).toBe(true);  // delete
    });

    it('should handle subtask recurrence with various rule IDs', async () => {
      mockInvoke.mockResolvedValue(true);

      const ruleIds = ['rule-daily', 'rule-weekly', 'rule-monthly', 'rule-yearly'];

      for (const ruleId of ruleIds) {
        const subtaskRecurrence = {
          subtaskId: 'subtask-test',
          recurrenceRuleId: ruleId
        };

        const result = await service.create('test-project', subtaskRecurrence, 'test-user-id');
        expect(result).toBe(true);
      }
    });
  });
});
