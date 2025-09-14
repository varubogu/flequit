import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecurrenceDetailsWebService } from '$lib/services/backend/web/recurrence-details-web-service';
import type { RecurrenceDetails, RecurrenceDetailsSearchCondition } from '$lib/types/recurrence-details';

describe('RecurrenceDetailsWebService', () => {
  let service: RecurrenceDetailsWebService;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    service = new RecurrenceDetailsWebService();
    consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe('create', () => {
    it('should log warning and return true', async () => {
      const details: RecurrenceDetails = {
        specific_date: 15,
        week_of_period: 'first',
        weekday_of_week: 'monday',
        date_conditions: ['before 2024-12-31']
      };

      const result = await service.create(details);

      expect(consoleSpy).toHaveBeenCalledWith('Web backend: createRecurrenceDetails not implemented', details);
      expect(result).toBe(true);
    });
  });

  describe('getByRuleId', () => {
    it('should log warning and return null', async () => {
      const ruleId = 'rule1';

      const result = await service.getByRuleId(ruleId);

      expect(consoleSpy).toHaveBeenCalledWith('Web backend: getRecurrenceDetailsByRuleId not implemented', ruleId);
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should log warning and return true', async () => {
      const details: RecurrenceDetails = {
        specific_date: 20,
        week_of_period: 'second',
        weekday_of_week: 'tuesday',
        date_conditions: ['after 2024-01-01']
      };

      const result = await service.update(details);

      expect(consoleSpy).toHaveBeenCalledWith('Web backend: updateRecurrenceDetails not implemented', details);
      expect(result).toBe(true);
    });
  });

  describe('delete', () => {
    it('should log warning and return true', async () => {
      const detailsId = 'details1';

      const result = await service.delete(detailsId);

      expect(consoleSpy).toHaveBeenCalledWith('Web backend: deleteRecurrenceDetails not implemented', detailsId);
      expect(result).toBe(true);
    });
  });

  describe('search', () => {
    it('should log warning and return empty array', async () => {
      const condition: RecurrenceDetailsSearchCondition = {
        rule_id: 'rule1',
        specific_date: 15,
        week_of_period: 'first'
      };

      const result = await service.search(condition);

      expect(consoleSpy).toHaveBeenCalledWith('Web backend: searchRecurrenceDetails not implemented', condition);
      expect(result).toEqual([]);
    });
  });
});