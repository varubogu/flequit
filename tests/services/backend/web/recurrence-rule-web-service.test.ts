import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecurrenceRuleWebService } from '$lib/services/backend/web/recurrence-rule-web-service';
import type { RecurrenceRule, RecurrenceRuleSearchCondition } from '$lib/types/recurrence-rule';

describe('RecurrenceRuleWebService', () => {
  let service: RecurrenceRuleWebService;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    service = new RecurrenceRuleWebService();
    consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe('create', () => {
    it('should log warning and return true', async () => {
      const rule: RecurrenceRule = {
        id: 'rule1',
        unit: 'day',
        interval: 1,
        days_of_week: ['monday'],
        details: 'Daily task',
        adjustment: 'none',
        end_date: '2024-12-31',
        max_occurrences: 10
      };

      const result = await service.create(rule);

      expect(consoleSpy).toHaveBeenCalledWith('Web backend: createRecurrenceRule not implemented', rule);
      expect(result).toBe(true);
    });
  });

  describe('get', () => {
    it('should log warning and return null', async () => {
      const ruleId = 'rule1';

      const result = await service.get(ruleId);

      expect(consoleSpy).toHaveBeenCalledWith('Web backend: getRecurrenceRule not implemented', ruleId);
      expect(result).toBeNull();
    });
  });

  describe('getAll', () => {
    it('should log warning and return empty array', async () => {
      const result = await service.getAll();

      expect(consoleSpy).toHaveBeenCalledWith('Web backend: getAllRecurrenceRules not implemented');
      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should log warning and return true', async () => {
      const rule: RecurrenceRule = {
        id: 'rule1',
        unit: 'week',
        interval: 2,
        days_of_week: ['monday', 'friday'],
        details: 'Weekly task',
        adjustment: 'none',
        end_date: '2024-12-31',
        max_occurrences: 5
      };

      const result = await service.update(rule);

      expect(consoleSpy).toHaveBeenCalledWith('Web backend: updateRecurrenceRule not implemented', rule);
      expect(result).toBe(true);
    });
  });

  describe('delete', () => {
    it('should log warning and return true', async () => {
      const ruleId = 'rule1';

      const result = await service.delete(ruleId);

      expect(consoleSpy).toHaveBeenCalledWith('Web backend: deleteRecurrenceRule not implemented', ruleId);
      expect(result).toBe(true);
    });
  });

  describe('search', () => {
    it('should log warning and return empty array', async () => {
      const condition: RecurrenceRuleSearchCondition = {
        unit: 'day',
        end_date: '2024-12-31'
      };

      const result = await service.search(condition);

      expect(consoleSpy).toHaveBeenCalledWith('Web backend: searchRecurrenceRules not implemented', condition);
      expect(result).toEqual([]);
    });
  });
});