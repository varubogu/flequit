import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { TaskWithSubTasks } from '$lib/types/task';

// ---------- モック ----------

const createRecurringTaskMock = vi.fn();

vi.mock('$lib/stores/task-core-store.svelte', () => ({
  taskCoreStore: {
    createRecurringTask: createRecurringTaskMock
  }
}));

const calculateNextDateMock = vi.fn();

vi.mock('$lib/services/domain/recurrence/recurrence-service', () => ({
  RecurrenceDateCalculator: {
    calculateNextDate: calculateNextDateMock
  },
  RecurrenceService: {
    calculateNextDate: calculateNextDateMock
  }
}));

// ---------- ヘルパー ----------

const now = new Date('2025-01-15T12:00:00.000Z');

const buildTask = (overrides: Partial<TaskWithSubTasks> = {}): TaskWithSubTasks => ({
  id: 'task-1',
  projectId: 'project-1',
  listId: 'list-1',
  title: 'Test Task',
  description: '',
  status: 'completed',
  priority: 1,
  assignedUserIds: [],
  tagIds: [],
  orderIndex: 0,
  isArchived: false,
  createdAt: now,
  updatedAt: now,
  deleted: false,
  updatedBy: 'user-1',
  tags: [],
  subTasks: [],
  ...overrides
});

// ---------- テスト ----------

const { TaskRecurrenceService } = await import('$lib/services/domain/task-recurrence');

describe('TaskRecurrenceService', () => {
  let service: InstanceType<typeof TaskRecurrenceService>;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TaskRecurrenceService();
  });

  describe('scheduleNextOccurrence', () => {
    it('繰り返しルールがない場合は何もしない', () => {
      const task = buildTask({ recurrenceRule: undefined });

      service.scheduleNextOccurrence(task);

      expect(calculateNextDateMock).not.toHaveBeenCalled();
      expect(createRecurringTaskMock).not.toHaveBeenCalled();
    });

    it('次の繰り返し日を計算してタスクを作成する', () => {
      const recurrenceRule = { unit: 'day' as const, interval: 1 };
      const planEndDate = new Date('2025-01-15T00:00:00.000Z');
      const nextDate = new Date('2025-01-16T00:00:00.000Z');

      const task = buildTask({ recurrenceRule, planEndDate });
      calculateNextDateMock.mockReturnValue(nextDate);

      service.scheduleNextOccurrence(task);

      expect(calculateNextDateMock).toHaveBeenCalledWith(planEndDate, recurrenceRule);
      expect(createRecurringTaskMock).toHaveBeenCalledWith(
        expect.objectContaining({
          listId: 'list-1',
          projectId: 'project-1',
          title: 'Test Task',
          status: 'not_started',
          planEndDate: nextDate,
          recurrenceRule
        })
      );
    });

    it('planEndDateがない場合は現在日時をベースに計算する', () => {
      const recurrenceRule = { unit: 'week' as const, interval: 1 };
      const nextDate = new Date('2025-01-22T00:00:00.000Z');

      const task = buildTask({ recurrenceRule, planEndDate: undefined });
      calculateNextDateMock.mockReturnValue(nextDate);

      service.scheduleNextOccurrence(task);

      expect(calculateNextDateMock).toHaveBeenCalledWith(expect.any(Date), recurrenceRule);
      expect(createRecurringTaskMock).toHaveBeenCalled();
    });

    it('calculateNextDateがnullを返した場合はタスクを作成しない', () => {
      const recurrenceRule = { unit: 'day' as const, interval: 1 };
      const task = buildTask({ recurrenceRule });
      calculateNextDateMock.mockReturnValue(null);

      service.scheduleNextOccurrence(task);

      expect(createRecurringTaskMock).not.toHaveBeenCalled();
    });

    it('isRangeDateがtrueの場合はplanStartDateも計算する', () => {
      const recurrenceRule = { unit: 'day' as const, interval: 1 };
      const planStartDate = new Date('2025-01-14T00:00:00.000Z');
      const planEndDate = new Date('2025-01-15T00:00:00.000Z');
      const nextDate = new Date('2025-01-16T00:00:00.000Z');

      const task = buildTask({ recurrenceRule, planStartDate, planEndDate, isRangeDate: true });
      calculateNextDateMock.mockReturnValue(nextDate);

      service.scheduleNextOccurrence(task);

      expect(createRecurringTaskMock).toHaveBeenCalledWith(
        expect.objectContaining({
          planStartDate: expect.any(Date),
          planEndDate: nextDate,
          isRangeDate: true
        })
      );

      const calledWith = createRecurringTaskMock.mock.calls[0][0];
      // 期間は同じ1日間
      const duration = planEndDate.getTime() - planStartDate.getTime();
      const expectedStart = new Date(nextDate.getTime() - duration);
      expect(calledWith.planStartDate.getTime()).toBe(expectedStart.getTime());
    });

    it('isRangeDateがfalseの場合はplanStartDateをundefinedにする', () => {
      const recurrenceRule = { unit: 'day' as const, interval: 1 };
      const task = buildTask({ recurrenceRule, isRangeDate: false });
      calculateNextDateMock.mockReturnValue(new Date());

      service.scheduleNextOccurrence(task);

      const calledWith = createRecurringTaskMock.mock.calls[0][0];
      expect(calledWith.planStartDate).toBeUndefined();
    });
  });
});
