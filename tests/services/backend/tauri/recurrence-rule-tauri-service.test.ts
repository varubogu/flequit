import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecurrenceRuleTauriService } from '$lib/services/backend/tauri/recurrence-rule-tauri-service';
import type { RecurrenceRule, RecurrenceRuleSearchCondition } from '$lib/types/recurrence-rule';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}));

// Get the mocked invoke for use in tests
const mockInvoke = vi.mocked(await import('@tauri-apps/api/core')).invoke;

describe('RecurrenceRuleTauriService', () => {
  let service: RecurrenceRuleTauriService;
  let mockRecurrenceRule: RecurrenceRule;
  let mockSearchCondition: RecurrenceRuleSearchCondition;

  beforeEach(() => {
    service = new RecurrenceRuleTauriService();
    mockRecurrenceRule = {
      id: 'rule-123',
      unit: 'week',
      interval: 2,
      days_of_week: ['monday', 'wednesday', 'friday'],
      end_date: '2024-12-31T23:59:59Z',
      max_occurrences: 20
    };
    mockSearchCondition = {
      unit: 'week'
    };
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should successfully create a recurrence rule', async () => {
      mockInvoke.mockResolvedValue(true);

      const result = await service.create(mockRecurrenceRule);

      expect(mockInvoke).toHaveBeenCalledWith('create_recurrence_rule', { rule: mockRecurrenceRule });
      expect(result).toBe(true);
    });

    it('should return false when creation fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Creation failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.create(mockRecurrenceRule);

      expect(mockInvoke).toHaveBeenCalledWith('create_recurrence_rule', { rule: mockRecurrenceRule });
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to create recurrence rule:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle recurrence rule with minimal data', async () => {
      mockInvoke.mockResolvedValue(true);

      const minimalRule = {
        id: 'rule-minimal',
        unit: 'day',
        interval: 1
      };

      const result = await service.create(minimalRule);

      expect(mockInvoke).toHaveBeenCalledWith('create_recurrence_rule', { rule: minimalRule });
      expect(result).toBe(true);
    });

    it('should handle recurrence rule with all optional fields', async () => {
      mockInvoke.mockResolvedValue(true);

      const fullRule = {
        id: 'rule-full',
        unit: 'month',
        interval: 3,
        days_of_week: ['monday', 'tuesday'],
        details: '{"pattern": "custom"}',
        adjustment: '{"offset": 1}',
        end_date: '2025-06-30T23:59:59Z',
        max_occurrences: 10
      };

      const result = await service.create(fullRule);

      expect(mockInvoke).toHaveBeenCalledWith('create_recurrence_rule', { rule: fullRule });
      expect(result).toBe(true);
    });
  });

  describe('get', () => {
    it('should successfully retrieve a recurrence rule', async () => {
      mockInvoke.mockResolvedValue(mockRecurrenceRule);

      const result = await service.get('rule-123');

      expect(mockInvoke).toHaveBeenCalledWith('get_recurrence_rule', { rule_id: 'rule-123' });
      expect(result).toEqual(mockRecurrenceRule);
    });

    it('should return null when recurrence rule not found', async () => {
      mockInvoke.mockResolvedValue(null);

      const result = await service.get('non-existent');

      expect(mockInvoke).toHaveBeenCalledWith('get_recurrence_rule', { rule_id: 'non-existent' });
      expect(result).toBeNull();
    });

    it('should return null when retrieval fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Retrieval failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.get('rule-123');

      expect(mockInvoke).toHaveBeenCalledWith('get_recurrence_rule', { rule_id: 'rule-123' });
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get recurrence rule:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('getAll', () => {
    it('should successfully retrieve all recurrence rules', async () => {
      const mockRules = [mockRecurrenceRule, { ...mockRecurrenceRule, id: 'rule-456' }];
      mockInvoke.mockResolvedValue(mockRules);

      const result = await service.getAll();

      expect(mockInvoke).toHaveBeenCalledWith('get_all_recurrence_rules');
      expect(result).toEqual(mockRules);
    });

    it('should return empty array when no rules exist', async () => {
      mockInvoke.mockResolvedValue([]);

      const result = await service.getAll();

      expect(mockInvoke).toHaveBeenCalledWith('get_all_recurrence_rules');
      expect(result).toEqual([]);
    });

    it('should return empty array when retrieval fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Retrieval failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.getAll();

      expect(mockInvoke).toHaveBeenCalledWith('get_all_recurrence_rules');
      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get all recurrence rules:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('update', () => {
    it('should successfully update a recurrence rule', async () => {
      mockInvoke.mockResolvedValue(true);

      const result = await service.update(mockRecurrenceRule);

      expect(mockInvoke).toHaveBeenCalledWith('update_recurrence_rule', { rule: mockRecurrenceRule });
      expect(result).toBe(true);
    });

    it('should return false when update fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Update failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.update(mockRecurrenceRule);

      expect(mockInvoke).toHaveBeenCalledWith('update_recurrence_rule', { rule: mockRecurrenceRule });
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to update recurrence rule:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle interval change', async () => {
      mockInvoke.mockResolvedValue(true);

      const updatedRule = {
        ...mockRecurrenceRule,
        interval: 3
      };

      const result = await service.update(updatedRule);

      expect(mockInvoke).toHaveBeenCalledWith('update_recurrence_rule', { rule: updatedRule });
      expect(result).toBe(true);
    });

    it('should handle unit change', async () => {
      mockInvoke.mockResolvedValue(true);

      const updatedRule = {
        ...mockRecurrenceRule,
        unit: 'month'
      };

      const result = await service.update(updatedRule);

      expect(mockInvoke).toHaveBeenCalledWith('update_recurrence_rule', { rule: updatedRule });
      expect(result).toBe(true);
    });
  });

  describe('delete', () => {
    it('should successfully delete a recurrence rule', async () => {
      mockInvoke.mockResolvedValue(true);

      const result = await service.delete('rule-123');

      expect(mockInvoke).toHaveBeenCalledWith('delete_recurrence_rule', { rule_id: 'rule-123' });
      expect(result).toBe(true);
    });

    it('should return false when deletion fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Deletion failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.delete('rule-123');

      expect(mockInvoke).toHaveBeenCalledWith('delete_recurrence_rule', { rule_id: 'rule-123' });
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to delete recurrence rule:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('search', () => {
    it('should return empty array as search is not implemented', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await service.search(mockSearchCondition);

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('search_recurrence_rules is not implemented - using mock implementation');

      consoleSpy.mockRestore();
    });

    it('should handle search with empty condition', async () => {
      const emptyCondition = {};
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await service.search(emptyCondition);

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('search_recurrence_rules is not implemented - using mock implementation');

      consoleSpy.mockRestore();
    });
  });

  describe('edge cases', () => {
    it('should handle different recurrence units', async () => {
      mockInvoke.mockResolvedValue(true);

      const units = ['minute', 'hour', 'day', 'week', 'month', 'quarter', 'halfyear', 'year'];

      for (const unit of units) {
        const unitRule = {
          ...mockRecurrenceRule,
          id: `rule-${unit}`,
          unit
        };

        const result = await service.create(unitRule);
        expect(result).toBe(true);
      }
    });

    it('should handle different days of week combinations', async () => {
      mockInvoke.mockResolvedValue(true);

      const daysCombinations = [
        ['monday'],
        ['monday', 'friday'],
        ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        ['saturday', 'sunday'],
        ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      ];

      for (const days of daysCombinations) {
        const daysRule = {
          ...mockRecurrenceRule,
          id: `rule-days-${days.length}`,
          days_of_week: days
        };

        const result = await service.create(daysRule);
        expect(result).toBe(true);
      }
    });

    it('should handle various interval values', async () => {
      mockInvoke.mockResolvedValue(true);

      const intervals = [1, 2, 3, 5, 10, 15, 30];

      for (const interval of intervals) {
        const intervalRule = {
          ...mockRecurrenceRule,
          id: `rule-interval-${interval}`,
          interval
        };

        const result = await service.create(intervalRule);
        expect(result).toBe(true);
      }
    });

    it('should handle rule without optional fields', async () => {
      mockInvoke.mockResolvedValue(true);

      const minimalRule = {
        id: 'rule-no-optional',
        unit: 'day',
        interval: 1
      };

      const result = await service.create(minimalRule);

      expect(result).toBe(true);
    });
  });
});