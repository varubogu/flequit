import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecurrenceDetailsTauriService } from '$lib/services/backend/tauri/recurrence-details-tauri-service';
import type { RecurrenceDetails, RecurrenceDetailsSearchCondition } from '$lib/types/recurrence-details';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}));

// Get the mocked invoke for use in tests
const mockInvoke = vi.mocked(await import('@tauri-apps/api/core')).invoke;

describe('RecurrenceDetailsTauriService', () => {
  let service: RecurrenceDetailsTauriService;
  let mockRecurrenceDetails: RecurrenceDetails;
  let mockSearchCondition: RecurrenceDetailsSearchCondition;

  beforeEach(() => {
    service = new RecurrenceDetailsTauriService();
    mockRecurrenceDetails = {
      specificDate: 15,
      weekOfPeriod: 'Second',
      weekdayOfWeek: 'Friday',
      dateConditions: ['2024-01-15', '2024-02-15']
    };
    mockSearchCondition = {
      ruleId: 'rule-123'
    };
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should successfully create recurrence details', async () => {
      mockInvoke.mockResolvedValue(true);

      const result = await service.create(mockRecurrenceDetails);

      expect(mockInvoke).toHaveBeenCalledWith('create_recurrence_details', {
        details: mockRecurrenceDetails
      });
      expect(result).toBe(true);
    });

    it('should return false when creation fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Creation failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.create(mockRecurrenceDetails);

      expect(mockInvoke).toHaveBeenCalledWith('create_recurrence_details', {
        details: mockRecurrenceDetails
      });
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to create recurrence details:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle details with minimal data', async () => {
      mockInvoke.mockResolvedValue(true);

      const minimalDetails = {
        specific_date: 1
      };

      const result = await service.create(minimalDetails);

      expect(mockInvoke).toHaveBeenCalledWith('create_recurrence_details', {
        details: minimalDetails
      });
      expect(result).toBe(true);
    });

    it('should handle details with only week settings', async () => {
      mockInvoke.mockResolvedValue(true);

      const weekDetails = {
        week_of_period: 'Third',
        weekday_of_week: 'Monday'
      };

      const result = await service.create(weekDetails);

      expect(mockInvoke).toHaveBeenCalledWith('create_recurrence_details', {
        details: weekDetails
      });
      expect(result).toBe(true);
    });

    it('should handle details with date conditions only', async () => {
      mockInvoke.mockResolvedValue(true);

      const dateDetails = {
        date_conditions: ['2024-03-15', '2024-06-15', '2024-09-15']
      };

      const result = await service.create(dateDetails);

      expect(mockInvoke).toHaveBeenCalledWith('create_recurrence_details', {
        details: dateDetails
      });
      expect(result).toBe(true);
    });
  });

  describe('getByRuleId', () => {
    it('should successfully retrieve details by rule ID', async () => {
      mockInvoke.mockResolvedValue(mockRecurrenceDetails);

      const result = await service.getByRuleId('rule-123');

      expect(mockInvoke).toHaveBeenCalledWith('get_recurrence_details_by_rule_id', {
        rule_id: 'rule-123'
      });
      expect(result).toEqual(mockRecurrenceDetails);
    });

    it('should return null when details not found', async () => {
      mockInvoke.mockResolvedValue(null);

      const result = await service.getByRuleId('non-existent');

      expect(mockInvoke).toHaveBeenCalledWith('get_recurrence_details_by_rule_id', {
        rule_id: 'non-existent'
      });
      expect(result).toBeNull();
    });

    it('should return null when retrieval fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Retrieval failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.getByRuleId('rule-123');

      expect(mockInvoke).toHaveBeenCalledWith('get_recurrence_details_by_rule_id', {
        rule_id: 'rule-123'
      });
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get recurrence details by rule ID:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle various rule ID formats', async () => {
      mockInvoke.mockResolvedValue(mockRecurrenceDetails);

      const ruleIds = ['rule-123', 'RULE_456', 'rule.789', 'rule@abc'];

      for (const ruleId of ruleIds) {
        const result = await service.getByRuleId(ruleId);
        expect(mockInvoke).toHaveBeenCalledWith('get_recurrence_details_by_rule_id', {
          rule_id: ruleId
        });
        expect(result).toEqual(mockRecurrenceDetails);
      }
    });
  });

  describe('update', () => {
    it('should successfully update recurrence details', async () => {
      mockInvoke.mockResolvedValue(true);

      const result = await service.update(mockRecurrenceDetails);

      expect(mockInvoke).toHaveBeenCalledWith('update_recurrence_details', {
        details: mockRecurrenceDetails
      });
      expect(result).toBe(true);
    });

    it('should return false when update fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Update failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.update(mockRecurrenceDetails);

      expect(mockInvoke).toHaveBeenCalledWith('update_recurrence_details', {
        details: mockRecurrenceDetails
      });
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to update recurrence details:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle specific date change', async () => {
      mockInvoke.mockResolvedValue(true);

      const updatedDetails = {
        ...mockRecurrenceDetails,
        specific_date: 25
      };

      const result = await service.update(updatedDetails);

      expect(mockInvoke).toHaveBeenCalledWith('update_recurrence_details', {
        details: updatedDetails
      });
      expect(result).toBe(true);
    });

    it('should handle week settings change', async () => {
      mockInvoke.mockResolvedValue(true);

      const updatedDetails = {
        ...mockRecurrenceDetails,
        week_of_period: 'First',
        weekday_of_week: 'Sunday'
      };

      const result = await service.update(updatedDetails);

      expect(mockInvoke).toHaveBeenCalledWith('update_recurrence_details', {
        details: updatedDetails
      });
      expect(result).toBe(true);
    });
  });

  describe('delete', () => {
    it('should successfully delete recurrence details', async () => {
      mockInvoke.mockResolvedValue(true);

      const result = await service.delete('details-123');

      expect(mockInvoke).toHaveBeenCalledWith('delete_recurrence_details', {
        details_id: 'details-123'
      });
      expect(result).toBe(true);
    });

    it('should return false when deletion fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Deletion failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.delete('details-123');

      expect(mockInvoke).toHaveBeenCalledWith('delete_recurrence_details', {
        details_id: 'details-123'
      });
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to delete recurrence details:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle deletion of non-existent details', async () => {
      mockInvoke.mockResolvedValue(false);

      const result = await service.delete('non-existent');

      expect(mockInvoke).toHaveBeenCalledWith('delete_recurrence_details', {
        details_id: 'non-existent'
      });
      expect(result).toBe(false);
    });
  });

  describe('search', () => {
    it('should return empty array as search is not implemented', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await service.search(mockSearchCondition);

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('search_recurrence_details is not implemented - using mock implementation');

      consoleSpy.mockRestore();
    });

    it('should handle search with empty condition', async () => {
      const emptyCondition = {};
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await service.search(emptyCondition);

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('search_recurrence_details is not implemented - using mock implementation');

      consoleSpy.mockRestore();
    });

    it('should handle search with various conditions', async () => {
      const condition = {
        rule_id: 'rule-123',
        specific_date: 15,
        week_of_period: 'Second',
        weekday_of_week: 'Friday'
      };
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await service.search(condition);

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('search_recurrence_details is not implemented - using mock implementation');

      consoleSpy.mockRestore();
    });
  });

  describe('edge cases', () => {
    it('should handle empty string rule IDs', async () => {
      mockInvoke.mockResolvedValue(null);

      const result = await service.getByRuleId('');

      expect(mockInvoke).toHaveBeenCalledWith('get_recurrence_details_by_rule_id', {
        rule_id: ''
      });
      expect(result).toBeNull();
    });

    it('should handle various specific date values', async () => {
      mockInvoke.mockResolvedValue(true);

      const dateValues = [1, 15, 28, 31];

      for (const specificDate of dateValues) {
        const details = {
          specific_date: specificDate
        };

        const result = await service.create(details);
        expect(result).toBe(true);
      }
    });

    it('should handle various week periods', async () => {
      mockInvoke.mockResolvedValue(true);

      const weekPeriods = ['First', 'Second', 'Third', 'Fourth', 'Last'];

      for (const weekOfPeriod of weekPeriods) {
        const details = {
          week_of_period: weekOfPeriod,
          weekday_of_week: 'Monday'
        };

        const result = await service.create(details);
        expect(result).toBe(true);
      }
    });

    it('should handle various weekdays', async () => {
      mockInvoke.mockResolvedValue(true);

      const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

      for (const weekdayOfWeek of weekdays) {
        const details = {
          week_of_period: 'First',
          weekday_of_week: weekdayOfWeek
        };

        const result = await service.create(details);
        expect(result).toBe(true);
      }
    });

    it('should handle concurrent operations', async () => {
      mockInvoke.mockResolvedValue(true);

      const operations = [
        service.create({ specificDate: 1 }),
        service.create({ weekOfPeriod: 'First', weekdayOfWeek: 'Monday' }),
        service.getByRuleId('rule-1'),
        service.update({ specificDate: 15 }),
        service.delete('details-1')
      ];

      const results = await Promise.all(operations);

      results.forEach(result => {
        expect(result).toBe(true);
      });
    });

    it('should handle details with long date condition arrays', async () => {
      mockInvoke.mockResolvedValue(true);

      const longDetails = {
        date_conditions: Array.from({ length: 50 }, (_, i) => `2024-${String((i % 12) + 1).padStart(2, '0')}-15`)
      };

      const result = await service.create(longDetails);

      expect(result).toBe(true);
    });
  });
});
