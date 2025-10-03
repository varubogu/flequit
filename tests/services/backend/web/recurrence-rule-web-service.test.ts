import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecurrenceRuleWebService } from '$lib/infrastructure/backends/web/recurrence-rule-web-service';
import type { RecurrenceRule, RecurrenceRuleSearchCondition } from '$lib/types/recurrence';

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
        interval: 1
      };

      const result = await service.create('test-project', rule);

      expect(consoleSpy).toHaveBeenCalledWith('Web backends: createRecurrenceRule not implemented', { projectId: 'test-project', rule });
      expect(result).toBe(true);
    });
  });

  describe('get', () => {
    it('should log warning and return null', async () => {
      const ruleId = 'rule1';

      const result = await service.get('test-project', ruleId);

      expect(consoleSpy).toHaveBeenCalledWith('Web backends: getRecurrenceRule not implemented', { projectId: 'test-project', ruleId });
      expect(result).toBeNull();
    });
  });

  describe('getAll', () => {
    it('should log warning and return empty array', async () => {
      const result = await service.getAll('test-project');

      expect(consoleSpy).toHaveBeenCalledWith('Web backends: getAllRecurrenceRules not implemented', { projectId: 'test-project' });
      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should log warning and return true', async () => {
      const rule: RecurrenceRule = {
        id: 'rule1',
        unit: 'week',
        interval: 2,
        daysOfWeek: ['monday', 'friday'],
        endDate: new Date('2024-12-31'),
        maxOccurrences: 5
      };

      const result = await service.update('test-project', rule);

      expect(consoleSpy).toHaveBeenCalledWith('Web backends: updateRecurrenceRule not implemented', { projectId: 'test-project', rule });
      expect(result).toBe(true);
    });
  });

  describe('delete', () => {
    it('should log warning and return true', async () => {
      const ruleId = 'rule1';

      const result = await service.delete('test-project', ruleId);

      expect(consoleSpy).toHaveBeenCalledWith('Web backends: deleteRecurrenceRule not implemented', { projectId: 'test-project', ruleId });
      expect(result).toBe(true);
    });
  });

  describe('search', () => {
    it('should log warning and return empty array', async () => {
      const condition: RecurrenceRuleSearchCondition = {
        unit: 'day',
        endDate: new Date('2024-12-31')
      };

      const result = await service.search('test-project', condition);

      expect(consoleSpy).toHaveBeenCalledWith('Web backends: searchRecurrenceRules not implemented', { projectId: 'test-project', condition });
      expect(result).toEqual([]);
    });
  });
});
