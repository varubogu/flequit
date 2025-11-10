import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecurrenceRuleTauriService } from '$lib/infrastructure/backends/tauri/recurrence-rule-tauri-service';
import type { RecurrenceRule, RecurrenceRuleSearchCondition } from '$lib/types/recurrence';

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
      unit: 'week' as const,
      interval: 2,
      daysOfWeek: ['monday', 'wednesday', 'friday'],
      endDate: new Date('2024-12-31T23:59:59Z'),
      maxOccurrences: 20
    };
    mockSearchCondition = {
      unit: 'week' as const
    };
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should successfully create a recurrence rule', async () => {
      mockInvoke.mockResolvedValue(true);

      const result = await service.create('test-project', mockRecurrenceRule, 'test-user-id');

      expect(mockInvoke).toHaveBeenCalledWith('create_recurrence_rule', { projectId: 'test-project', rule: mockRecurrenceRule });
      expect(result).toBe(true);
    });

    it('should return false when creation fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Creation failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.create('test-project', mockRecurrenceRule, 'test-user-id');

      expect(mockInvoke).toHaveBeenCalledWith('create_recurrence_rule', { projectId: 'test-project', rule: mockRecurrenceRule });
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to create recurrence rule:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle recurrence rule with minimal data', async () => {
      mockInvoke.mockResolvedValue(true);

      const minimalRule = {
        id: 'rule-minimal',
        unit: 'day' as const,
        interval: 1
      };

      const result = await service.create('test-project', minimalRule, 'test-user-id');

      expect(mockInvoke).toHaveBeenCalledWith('create_recurrence_rule', { projectId: 'test-project', rule: minimalRule });
      expect(result).toBe(true);
    });

    it('should handle recurrence rule with all optional fields', async () => {
      mockInvoke.mockResolvedValue(true);

      const fullRule: RecurrenceRule = {
        id: 'rule-full',
        unit: 'month',
        interval: 3,
        daysOfWeek: ['monday', 'tuesday'],
        pattern: {
          monthly: {
            dayOfMonth: 15
          }
        },
        adjustment: {
          holidayAdjustment: 'after'
        },
        endDate: new Date('2025-06-30T23:59:59Z'),
        maxOccurrences: 10
      };

      const result = await service.create('test-project', fullRule, 'test-user-id');

      expect(mockInvoke).toHaveBeenCalledWith('create_recurrence_rule', { projectId: 'test-project', rule: fullRule });
      expect(result).toBe(true);
    });
  });

  describe('get', () => {
    it('should successfully retrieve a recurrence rule', async () => {
      mockInvoke.mockResolvedValue(mockRecurrenceRule);

      const result = await service.get('test-project', 'rule-123', 'test-user-id');

      expect(mockInvoke).toHaveBeenCalledWith('get_recurrence_rule', { projectId: 'test-project', ruleId: 'rule-123' });
      expect(result).toEqual(mockRecurrenceRule);
    });

    it('should return null when recurrence rule not found', async () => {
      mockInvoke.mockResolvedValue(null);

      const result = await service.get('test-project', 'non-existent', 'test-user-id');

      expect(mockInvoke).toHaveBeenCalledWith('get_recurrence_rule', { projectId: 'test-project', ruleId: 'non-existent' });
      expect(result).toBeNull();
    });

    it('should return null when retrieval fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Retrieval failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.get('test-project', 'rule-123', 'test-user-id');

      expect(mockInvoke).toHaveBeenCalledWith('get_recurrence_rule', { projectId: 'test-project', ruleId: 'rule-123' });
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get recurrence rule:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('getAll', () => {
    it('should successfully retrieve all recurrence rules', async () => {
      const mockRules = [mockRecurrenceRule, { ...mockRecurrenceRule, id: 'rule-456' }];
      mockInvoke.mockResolvedValue(mockRules);

      const result = await service.getAll('test-project', 'test-user-id');

      expect(mockInvoke).toHaveBeenCalledWith('get_all_recurrence_rules', { projectId: 'test-project' });
      expect(result).toEqual(mockRules);
    });

    it('should return empty array when no rules exist', async () => {
      mockInvoke.mockResolvedValue([]);

      const result = await service.getAll('test-project', 'test-user-id');

      expect(mockInvoke).toHaveBeenCalledWith('get_all_recurrence_rules', { projectId: 'test-project' });
      expect(result).toEqual([]);
    });

    it('should return empty array when retrieval fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Retrieval failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.getAll('test-project', 'test-user-id');

      expect(mockInvoke).toHaveBeenCalledWith('get_all_recurrence_rules', { projectId: 'test-project' });
      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get all recurrence rules:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('update', () => {
    it('should successfully update a recurrence rule', async () => {
      mockInvoke.mockResolvedValue(true);

      const result = await service.update('test-project', mockRecurrenceRule, 'test-user-id');

      expect(mockInvoke).toHaveBeenCalledWith('update_recurrence_rule', { projectId: 'test-project', rule: mockRecurrenceRule });
      expect(result).toBe(true);
    });

    it('should return false when update fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Update failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.update('test-project', mockRecurrenceRule, 'test-user-id');

      expect(mockInvoke).toHaveBeenCalledWith('update_recurrence_rule', { projectId: 'test-project', rule: mockRecurrenceRule });
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

      const result = await service.update('test-project', updatedRule, 'test-user-id');

      expect(mockInvoke).toHaveBeenCalledWith('update_recurrence_rule', { projectId: 'test-project', rule: updatedRule });
      expect(result).toBe(true);
    });

    it('should handle unit change', async () => {
      mockInvoke.mockResolvedValue(true);

      const updatedRule = {
        ...mockRecurrenceRule,
        unit: 'month' as const
      };

      const result = await service.update('test-project', updatedRule, 'test-user-id');

      expect(mockInvoke).toHaveBeenCalledWith('update_recurrence_rule', { projectId: 'test-project', rule: updatedRule });
      expect(result).toBe(true);
    });
  });

  describe('delete', () => {
    it('should successfully delete a recurrence rule', async () => {
      mockInvoke.mockResolvedValue(true);

      const result = await service.delete('test-project', 'rule-123', 'test-user-id');

      expect(mockInvoke).toHaveBeenCalledWith('delete_recurrence_rule', { projectId: 'test-project', ruleId: 'rule-123' });
      expect(result).toBe(true);
    });

    it('should return false when deletion fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Deletion failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.delete('test-project', 'rule-123', 'test-user-id');

      expect(mockInvoke).toHaveBeenCalledWith('delete_recurrence_rule', { projectId: 'test-project', ruleId: 'rule-123' });
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to delete recurrence rule:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('search', () => {
    it('should return empty array as search is not implemented', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await service.search('test-project', mockSearchCondition);

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('search_recurrence_rules is not implemented - using mock implementation');

      consoleSpy.mockRestore();
    });

    it('should handle search with empty condition', async () => {
      const emptyCondition = {};
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await service.search('test-project', emptyCondition);

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('search_recurrence_rules is not implemented - using mock implementation');

      consoleSpy.mockRestore();
    });
  });

  describe('edge cases', () => {
    it('should handle different recurrence units', async () => {
      mockInvoke.mockResolvedValue(true);

      const units = ['minute', 'hour', 'day', 'week', 'month', 'quarter', 'halfyear', 'year'] as const;

      for (const unit of units) {
        const unitRule = {
          ...mockRecurrenceRule,
          id: `rule-${unit}`,
          unit
        };

        const result = await service.create('test-project', unitRule, 'test-user-id');
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

        const result = await service.create('test-project', daysRule, 'test-user-id');
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

        const result = await service.create('test-project', intervalRule, 'test-user-id');
        expect(result).toBe(true);
      }
    });

    it('should handle rule without optional fields', async () => {
      mockInvoke.mockResolvedValue(true);

      const minimalRule = {
        id: 'rule-no-optional',
        unit: 'day' as const,
        interval: 1
      };

      const result = await service.create('test-project', minimalRule, 'test-user-id');

      expect(result).toBe(true);
    });
  });
});
