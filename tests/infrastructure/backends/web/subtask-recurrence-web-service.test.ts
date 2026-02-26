import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubtaskRecurrenceWebService } from '$lib/infrastructure/backends/web/subtask-recurrence-web-service';
import type {
  SubtaskRecurrence,
  SubtaskRecurrenceSearchCondition
} from '$lib/types/recurrence-reference';

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

      const result = await service.create('test-project', subtaskRecurrence);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Web backends: createSubtaskRecurrence not implemented',
        { projectId: 'test-project', subtaskRecurrence }
      );
      expect(result).toBe(true);
    });
  });

  describe('getBySubtaskId', () => {
    it('should log warning and return null', async () => {
      const subtaskId = 'subtask1';

      const result = await service.getBySubtaskId('test-project', subtaskId);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Web backends: getSubtaskRecurrenceBySubtaskId not implemented',
        { projectId: 'test-project', subtaskId }
      );
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should log warning and return true', async () => {
      const subtaskId = 'subtask1';

      const result = await service.delete('test-project', subtaskId);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Web backends: deleteSubtaskRecurrence not implemented',
        { projectId: 'test-project', subtaskId }
      );
      expect(result).toBe(true);
    });
  });

  describe('search', () => {
    it('should log warning and return empty array', async () => {
      const condition: SubtaskRecurrenceSearchCondition = {
        subtaskId: 'subtask1',
        recurrenceRuleId: 'rule1'
      };

      const result = await service.search('test-project', condition);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Web backends: searchSubtaskRecurrences not implemented',
        { projectId: 'test-project', condition }
      );
      expect(result).toEqual([]);
    });
  });
});
