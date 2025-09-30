import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskRecurrenceWebService } from '$lib/services/backend/web/task-recurrence-web-service';
import type { TaskRecurrence, TaskRecurrenceSearchCondition } from '$lib/types/recurrence-reference';

describe('TaskRecurrenceWebService', () => {
  let service: TaskRecurrenceWebService;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    service = new TaskRecurrenceWebService();
    consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe('create', () => {
    it('should log warning and return true', async () => {
      const taskRecurrence: TaskRecurrence = {
        taskId: 'task1',
        recurrenceRuleId: 'rule1'
      };

      const result = await service.create(taskRecurrence);

      expect(consoleSpy).toHaveBeenCalledWith('Web backend: createTaskRecurrence not implemented', taskRecurrence);
      expect(result).toBe(true);
    });
  });

  describe('getByTaskId', () => {
    it('should log warning and return null', async () => {
      const taskId = 'task1';

      const result = await service.getByTaskId(taskId);

      expect(consoleSpy).toHaveBeenCalledWith('Web backend: getTaskRecurrenceByTaskId not implemented', taskId);
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should log warning and return true', async () => {
      const taskId = 'task1';

      const result = await service.delete(taskId);

      expect(consoleSpy).toHaveBeenCalledWith('Web backend: deleteTaskRecurrence not implemented', taskId);
      expect(result).toBe(true);
    });
  });

  describe('search', () => {
    it('should log warning and return empty array', async () => {
      const condition: TaskRecurrenceSearchCondition = {
        taskId: 'task1',
        recurrenceRuleId: 'rule1'
      };

      const result = await service.search(condition);

      expect(consoleSpy).toHaveBeenCalledWith('Web backend: searchTaskRecurrences not implemented', condition);
      expect(result).toEqual([]);
    });
  });
});
