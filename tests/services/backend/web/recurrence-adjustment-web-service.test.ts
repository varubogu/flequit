import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecurrenceAdjustmentWebService } from '$lib/services/backend/web/recurrence-adjustment-web-service';
import type { RecurrenceAdjustment, RecurrenceAdjustmentSearchCondition } from '$lib/types/recurrence-adjustment';

describe('RecurrenceAdjustmentWebService', () => {
  let service: RecurrenceAdjustmentWebService;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    service = new RecurrenceAdjustmentWebService();
    consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe('create', () => {
    it('should log warning and return true', async () => {
      const adjustment: RecurrenceAdjustment = {
        id: 'adj1',
        recurrence_rule_id: 'rule1',
        adjustment_type: 'skip',
        adjustment_date: '2024-01-15',
        new_date: '2024-01-16'
      };

      const result = await service.create(adjustment);

      expect(consoleSpy).toHaveBeenCalledWith('Web backend: createRecurrenceAdjustment not implemented', adjustment);
      expect(result).toBe(true);
    });
  });

  describe('getByRuleId', () => {
    it('should log warning and return empty array', async () => {
      const ruleId = 'rule1';

      const result = await service.getByRuleId(ruleId);

      expect(consoleSpy).toHaveBeenCalledWith('Web backend: getRecurrenceAdjustmentsByRuleId not implemented', ruleId);
      expect(result).toEqual([]);
    });
  });

  describe('delete', () => {
    it('should log warning and return true', async () => {
      const adjustmentId = 'adj1';

      const result = await service.delete(adjustmentId);

      expect(consoleSpy).toHaveBeenCalledWith('Web backend: deleteRecurrenceAdjustment not implemented', adjustmentId);
      expect(result).toBe(true);
    });
  });

  describe('search', () => {
    it('should log warning and return empty array', async () => {
      const condition: RecurrenceAdjustmentSearchCondition = {
        recurrence_rule_id: 'rule1',
        adjustment_type: 'skip'
      };

      const result = await service.search(condition);

      expect(consoleSpy).toHaveBeenCalledWith('Web backend: searchRecurrenceAdjustments not implemented', condition);
      expect(result).toEqual([]);
    });
  });
});