import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubtaskRecurrenceWebService } from '$lib/services/backend/web/subtask-recurrence-web-service';
import type { SubtaskRecurrence, SubtaskRecurrenceSearchCondition } from '$lib/types/recurrence-reference';

describe('SubtaskRecurrenceWebService', () => {
  let service: SubtaskRecurrenceWebService;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    service = new SubtaskRecurrenceWebService();
    consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe('create', () => {
    it('should log warning and return true', async () => {
      const subtaskRecurrence: SubtaskRecurrence = {
        subtaskId: 'subtask1',
        recurrenceRuleId: 'rule1'
      };

      const result = await service.create(subtaskRecurrence);

      expect(consoleSpy).toHaveBeenCalledWith('Web backend: createSubtaskRecurrence not implemented', subtaskRecurrence);
      expect(result).toBe(true);
    });
  });

  describe('getBySubtaskId', () => {
    it('should log warning and return null', async () => {
      const subtaskId = 'subtask1';

      const result = await service.getBySubtaskId(subtaskId);

      expect(consoleSpy).toHaveBeenCalledWith('Web backend: getSubtaskRecurrenceBySubtaskId not implemented', subtaskId);
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should log warning and return true', async () => {
      const subtaskId = 'subtask1';

      const result = await service.delete(subtaskId);

      expect(consoleSpy).toHaveBeenCalledWith('Web backend: deleteSubtaskRecurrence not implemented', subtaskId);
      expect(result).toBe(true);
    });
  });

  describe('search', () => {
    it('should log warning and return empty array', async () => {
      const condition: SubtaskRecurrenceSearchCondition = {
        subtaskId: 'subtask1',
        recurrenceRuleId: 'rule1'
      };

      const result = await service.search(condition);

      expect(consoleSpy).toHaveBeenCalledWith('Web backend: searchSubtaskRecurrences not implemented', condition);
      expect(result).toEqual([]);
    });
  });
});
