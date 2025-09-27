import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecurrenceAdjustmentTauriService } from '$lib/services/backend/tauri/recurrence-adjustment-tauri-service';
import type { RecurrenceAdjustment, RecurrenceAdjustmentSearchCondition } from '$lib/types/recurrence-adjustment';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}));

// Get the mocked invoke for use in tests
const mockInvoke = vi.mocked(await import('@tauri-apps/api/core')).invoke;

describe('RecurrenceAdjustmentTauriService', () => {
  let service: RecurrenceAdjustmentTauriService;
  let mockRecurrenceAdjustment: RecurrenceAdjustment;
  let mockSearchCondition: RecurrenceAdjustmentSearchCondition;

  beforeEach(() => {
    service = new RecurrenceAdjustmentTauriService();
    mockRecurrenceAdjustment = {
      dateConditions: ['2024-01-01', '2024-12-31'],
      weekdayConditions: ['monday', 'friday']
    };
    mockSearchCondition = {
      ruleIid: 'rule-123'
    };
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should successfully create a recurrence adjustment', async () => {
      mockInvoke.mockResolvedValue(true);

      const result = await service.create(mockRecurrenceAdjustment);

      expect(mockInvoke).toHaveBeenCalledWith('create_recurrence_adjustment', {
        adjustment: mockRecurrenceAdjustment
      });
      expect(result).toBe(true);
    });

    it('should return false when creation fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Creation failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.create(mockRecurrenceAdjustment);

      expect(mockInvoke).toHaveBeenCalledWith('create_recurrence_adjustment', {
        adjustment: mockRecurrenceAdjustment
      });
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to create recurrence adjustment:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle adjustment with minimal data', async () => {
      mockInvoke.mockResolvedValue(true);

      const minimalAdjustment = {
        dateConditions: [],
        weekdayConditions: []
      };

      const result = await service.create(minimalAdjustment);

      expect(mockInvoke).toHaveBeenCalledWith('create_recurrence_adjustment', {
        adjustment: minimalAdjustment
      });
      expect(result).toBe(true);
    });

    it('should handle adjustment with only date conditions', async () => {
      mockInvoke.mockResolvedValue(true);

      const dateOnlyAdjustment = {
        dateConditions: ['2024-06-15', '2024-06-20'],
        weekdayConditions: []
      };

      const result = await service.create(dateOnlyAdjustment);

      expect(mockInvoke).toHaveBeenCalledWith('create_recurrence_adjustment', {
        adjustment: dateOnlyAdjustment
      });
      expect(result).toBe(true);
    });

    it('should handle adjustment with only weekday conditions', async () => {
      mockInvoke.mockResolvedValue(true);

      const weekdayOnlyAdjustment = {
        dateConditions: [],
        weekdayConditions: ['tuesday', 'thursday', 'saturday']
      };

      const result = await service.create(weekdayOnlyAdjustment);

      expect(mockInvoke).toHaveBeenCalledWith('create_recurrence_adjustment', {
        adjustment: weekdayOnlyAdjustment
      });
      expect(result).toBe(true);
    });
  });

  describe('getByRuleId', () => {
    it('should successfully retrieve adjustments by rule ID', async () => {
      const mockAdjustments = [
        mockRecurrenceAdjustment,
        { date_conditions: ['2024-02-14'], weekday_conditions: ['sunday'] }
      ];
      mockInvoke.mockResolvedValue(mockAdjustments);

      const result = await service.getByRuleId('rule-123');

      expect(mockInvoke).toHaveBeenCalledWith('get_recurrence_adjustments_by_rule_id', {
        ruleId: 'rule-123'
      });
      expect(result).toEqual(mockAdjustments);
    });

    it('should return empty array when no adjustments found', async () => {
      mockInvoke.mockResolvedValue([]);

      const result = await service.getByRuleId('non-existent');

      expect(mockInvoke).toHaveBeenCalledWith('get_recurrence_adjustments_by_rule_id', {
        ruleId: 'non-existent'
      });
      expect(result).toEqual([]);
    });

    it('should return empty array when retrieval fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Retrieval failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.getByRuleId('rule-123');

      expect(mockInvoke).toHaveBeenCalledWith('get_recurrence_adjustments_by_rule_id', {
        ruleId: 'rule-123'
      });
      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get recurrence adjustments by rule ID:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle various rule ID formats', async () => {
      mockInvoke.mockResolvedValue([mockRecurrenceAdjustment]);

      const ruleIds = ['rule-123', 'RULE_456', 'rule.789', 'rule@abc'];

      for (const ruleId of ruleIds) {
        const result = await service.getByRuleId(ruleId);
        expect(mockInvoke).toHaveBeenCalledWith('get_recurrence_adjustments_by_rule_id', {
          ruleId
        });
        expect(result).toEqual([mockRecurrenceAdjustment]);
      }
    });
  });

  describe('delete', () => {
    it('should successfully delete a recurrence adjustment', async () => {
      mockInvoke.mockResolvedValue(true);

      const result = await service.delete('adjustment-123');

      expect(mockInvoke).toHaveBeenCalledWith('delete_recurrence_adjustment', {
        adjustmentId: 'adjustment-123'
      });
      expect(result).toBe(true);
    });

    it('should return false when deletion fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Deletion failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.delete('adjustment-123');

      expect(mockInvoke).toHaveBeenCalledWith('delete_recurrence_adjustment', {
        adjustmentId: 'adjustment-123'
      });
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to delete recurrence adjustment:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle deletion of non-existent adjustment', async () => {
      mockInvoke.mockResolvedValue(false);

      const result = await service.delete('non-existent');

      expect(mockInvoke).toHaveBeenCalledWith('delete_recurrence_adjustment', {
        adjustmentId: 'non-existent'
      });
      expect(result).toBe(false);
    });
  });

  describe('search', () => {
    it('should return empty array as search is not implemented', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await service.search(mockSearchCondition);

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('search_recurrence_adjustments is not implemented - using mock implementation');

      consoleSpy.mockRestore();
    });

    it('should handle search with empty condition', async () => {
      const emptyCondition = {};
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await service.search(emptyCondition);

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('search_recurrence_adjustments is not implemented - using mock implementation');

      consoleSpy.mockRestore();
    });

    it('should handle search with rule_id condition', async () => {
      const condition = { ruleIid: 'rule-123' };
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await service.search(condition);

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('search_recurrence_adjustments is not implemented - using mock implementation');

      consoleSpy.mockRestore();
    });

    it('should handle search with date and weekday conditions', async () => {
      const condition = {
        dateConditions: ['2024-01-01'],
        weekdayConditions: ['monday']
      };
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await service.search(condition);

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('search_recurrence_adjustments is not implemented - using mock implementation');

      consoleSpy.mockRestore();
    });
  });

  describe('edge cases', () => {
    it('should handle empty string rule IDs', async () => {
      mockInvoke.mockResolvedValue([]);

      const result = await service.getByRuleId('');

      expect(mockInvoke).toHaveBeenCalledWith('get_recurrence_adjustments_by_rule_id', {
        ruleId: ''
      });
      expect(result).toEqual([]);
    });

    it('should handle adjustment with long condition arrays', async () => {
      mockInvoke.mockResolvedValue(true);

      const longAdjustment = {
        dateConditions: Array.from({ length: 100 }, (_, i) => `2024-01-${String(i + 1).padStart(2, '0')}`),
        weekdayConditions: Array.from({ length: 50 }, (_, i) => `weekday-${i}`)
      };

      const result = await service.create(longAdjustment);

      expect(result).toBe(true);
    });

    it('should handle concurrent operations', async () => {
      mockInvoke.mockResolvedValue(true);

      const operations = [
        service.create({ dateConditions: ['2024-01-01'], weekdayConditions: [] }),
        service.create({ dateConditions: [], weekdayConditions: ['monday'] }),
        service.getByRuleId('rule-1'),
        service.delete('adjustment-1')
      ];

      const results = await Promise.all(operations);

      expect(results[0]).toBe(true);  // create 1
      expect(results[1]).toBe(true);  // create 2
      expect(results[2]).toBe(true);  // get (returns true from mock)
      expect(results[3]).toBe(true);  // delete
    });

    it('should handle adjustment with various date formats', async () => {
      mockInvoke.mockResolvedValue(true);

      const dateFormats = [
        '2024-01-01',
        '2024-12-31',
        '2024-02-29',  // leap year
        '2024-06-15'
      ];

      const adjustment = {
        dateConditions: dateFormats,
        weekdayConditions: []
      };

      const result = await service.create(adjustment);

      expect(result).toBe(true);
    });

    it('should handle adjustment with various weekday formats', async () => {
      mockInvoke.mockResolvedValue(true);

      const weekdayFormats = [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday'
      ];

      const adjustment = {
        dateConditions: [],
        weekdayConditions: weekdayFormats
      };

      const result = await service.create(adjustment);

      expect(result).toBe(true);
    });
  });
});
