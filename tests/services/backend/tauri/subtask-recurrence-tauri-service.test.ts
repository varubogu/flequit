import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubtaskRecurrenceTauriService } from '$lib/services/backend/tauri/subtask-recurrence-tauri-service';
import type { SubtaskRecurrence, SubtaskRecurrenceSearchCondition } from '$lib/types/subtask-recurrence';

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

      const result = await service.create(mockSubtaskRecurrence);

      expect(mockInvoke).toHaveBeenCalledWith('create_subtask_recurrence', {
        subtask_recurrence: mockSubtaskRecurrence
      });
      expect(result).toBe(true);
    });

    it('should return false when creation fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Creation failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.create(mockSubtaskRecurrence);

      expect(mockInvoke).toHaveBeenCalledWith('create_subtask_recurrence', {
        subtask_recurrence: mockSubtaskRecurrence
      });
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to create subtask recurrence:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle different subtask and rule combinations', async () => {
      mockInvoke.mockResolvedValue(true);

      const testCases = [
        { subtask_id: 'subtask-1', recurrence_rule_id: 'rule-1' },
        { subtask_id: 'subtask-2', recurrence_rule_id: 'rule-2' },
        { subtask_id: 'subtask-3', recurrence_rule_id: 'rule-1' }
      ];

      for (const testCase of testCases) {
        const result = await service.create(testCase);
        expect(result).toBe(true);
        expect(mockInvoke).toHaveBeenCalledWith('create_subtask_recurrence', {
          subtask_recurrence: testCase
        });
      }
    });
  });

  describe('getBySubtaskId', () => {
    it('should successfully retrieve a subtask recurrence by subtask ID', async () => {
      mockInvoke.mockResolvedValue(mockSubtaskRecurrence);

      const result = await service.getBySubtaskId('subtask-123');

      expect(mockInvoke).toHaveBeenCalledWith('get_subtask_recurrence_by_subtask_id', {
        subtask_id: 'subtask-123'
      });
      expect(result).toEqual(mockSubtaskRecurrence);
    });

    it('should return null when subtask recurrence not found', async () => {
      mockInvoke.mockResolvedValue(null);

      const result = await service.getBySubtaskId('non-existent');

      expect(mockInvoke).toHaveBeenCalledWith('get_subtask_recurrence_by_subtask_id', {
        subtask_id: 'non-existent'
      });
      expect(result).toBeNull();
    });

    it('should return null when retrieval fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Retrieval failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.getBySubtaskId('subtask-123');

      expect(mockInvoke).toHaveBeenCalledWith('get_subtask_recurrence_by_subtask_id', {
        subtask_id: 'subtask-123'
      });
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get subtask recurrence by subtask ID:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle various subtask ID formats', async () => {
      mockInvoke.mockResolvedValue(mockSubtaskRecurrence);

      const subtaskIds = ['subtask-123', 'SUBTASK_456', 'subtask.789', 'subtask@abc'];

      for (const subtaskId of subtaskIds) {
        const result = await service.getBySubtaskId(subtaskId);
        expect(mockInvoke).toHaveBeenCalledWith('get_subtask_recurrence_by_subtask_id', {
          subtask_id: subtaskId
        });
        expect(result).toEqual(mockSubtaskRecurrence);
      }
    });
  });

  describe('delete', () => {
    it('should successfully delete a subtask recurrence', async () => {
      mockInvoke.mockResolvedValue(true);

      const result = await service.delete('subtask-123');

      expect(mockInvoke).toHaveBeenCalledWith('delete_subtask_recurrence', {
        subtask_id: 'subtask-123'
      });
      expect(result).toBe(true);
    });

    it('should return false when deletion fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Deletion failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.delete('subtask-123');

      expect(mockInvoke).toHaveBeenCalledWith('delete_subtask_recurrence', {
        subtask_id: 'subtask-123'
      });
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to delete subtask recurrence:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle deletion of non-existent subtask recurrence', async () => {
      mockInvoke.mockResolvedValue(false);

      const result = await service.delete('non-existent');

      expect(mockInvoke).toHaveBeenCalledWith('delete_subtask_recurrence', {
        subtask_id: 'non-existent'
      });
      expect(result).toBe(false);
    });
  });

  describe('search', () => {
    it('should return empty array as search is not implemented', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await service.search(mockSearchCondition);

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('search_subtask_recurrences is not implemented - using mock implementation');

      consoleSpy.mockRestore();
    });

    it('should handle search with empty condition', async () => {
      const emptyCondition = {};
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await service.search(emptyCondition);

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('search_subtask_recurrences is not implemented - using mock implementation');

      consoleSpy.mockRestore();
    });

    it('should handle search with subtask_id condition', async () => {
      const condition = { subtask_id: 'subtask-123' };
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await service.search(condition);

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('search_subtask_recurrences is not implemented - using mock implementation');

      consoleSpy.mockRestore();
    });

    it('should handle search with recurrence_rule_id condition', async () => {
      const condition = { recurrence_rule_id: 'rule-456' };
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await service.search(condition);

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('search_subtask_recurrences is not implemented - using mock implementation');

      consoleSpy.mockRestore();
    });
  });

  describe('edge cases', () => {
    it('should handle empty string subtask IDs', async () => {
      mockInvoke.mockResolvedValue(null);

      const result = await service.getBySubtaskId('');

      expect(mockInvoke).toHaveBeenCalledWith('get_subtask_recurrence_by_subtask_id', {
        subtask_id: ''
      });
      expect(result).toBeNull();
    });

    it('should handle subtask recurrence with long IDs', async () => {
      mockInvoke.mockResolvedValue(true);

      const longSubtaskRecurrence = {
        subtask_id: 'subtask-' + 'a'.repeat(100),
        recurrence_rule_id: 'rule-' + 'b'.repeat(100)
      };

      const result = await service.create(longSubtaskRecurrence);

      expect(result).toBe(true);
    });

    it('should handle concurrent operations', async () => {
      mockInvoke.mockResolvedValue(true);

      const operations = [
        service.create({ subtaskId: 'subtask-1', recurrenceRuleId: 'rule-1' }),
        service.create({ subtaskId: 'subtask-2', recurrenceRuleId: 'rule-2' }),
        service.getBySubtaskId('subtask-3'),
        service.delete('subtask-4')
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
          subtask_id: 'subtask-test',
          recurrence_rule_id: ruleId
        };

        const result = await service.create(subtaskRecurrence);
        expect(result).toBe(true);
      }
    });
  });
});
