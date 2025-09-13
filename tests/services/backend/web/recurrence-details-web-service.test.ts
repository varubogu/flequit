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
        id: 'details1',
        recurrence_rule_id: 'rule1',
        description: 'Daily standup meeting',
        additional_info: 'Team sync meeting',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
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
        id: 'details1',
        recurrence_rule_id: 'rule1',
        description: 'Updated description',
        additional_info: 'Updated info',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z'
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
        recurrence_rule_id: 'rule1',
        description: 'meeting'
      };

      const result = await service.search(condition);

      expect(consoleSpy).toHaveBeenCalledWith('Web backend: searchRecurrenceDetails not implemented', condition);
      expect(result).toEqual([]);
    });
  });
});