import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { RecurrenceRule as LegacyRecurrenceRule } from '$lib/types/datetime-calendar';

// ---------- モック ----------

const backendMock = {
  taskRecurrence: {
    delete: vi.fn(),
    getByTaskId: vi.fn(),
    create: vi.fn()
  },
  subtaskRecurrence: {
    delete: vi.fn(),
    getBySubtaskId: vi.fn(),
    create: vi.fn()
  },
  recurrenceRule: {
    create: vi.fn(),
    update: vi.fn()
  }
};

vi.mock('$lib/infrastructure/backend-client', () => ({
  resolveBackend: vi.fn(async () => backendMock)
}));

const mockUnifiedRule = { unit: 'day', interval: 1 };

vi.mock('$lib/utils/recurrence-converter', () => ({
  fromLegacyRecurrenceRule: vi.fn(() => mockUnifiedRule)
}));

vi.stubGlobal('crypto', {
  randomUUID: () => 'test-uuid-1234'
});

// ---------- ヘルパー ----------

const buildLegacyRule = (overrides: Partial<LegacyRecurrenceRule> = {}): LegacyRecurrenceRule => ({
  unit: 'day',
  interval: 1,
  ...overrides
});

// ---------- テスト ----------

const { RecurrenceSyncService } = await import('$lib/services/domain/recurrence-sync');

describe('RecurrenceSyncService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('save - ruleがnullの場合（削除）', () => {
    it('タスクの繰り返しを削除する', async () => {
      backendMock.taskRecurrence.delete.mockResolvedValue(true);

      await RecurrenceSyncService.save({
        projectId: 'project-1',
        itemId: 'task-1',
        isSubTask: false,
        rule: null,
        userId: 'user-1'
      });

      expect(backendMock.taskRecurrence.delete).toHaveBeenCalledWith(
        'project-1',
        'task-1',
        'user-1'
      );
    });

    it('サブタスクの繰り返しを削除する', async () => {
      backendMock.subtaskRecurrence.delete.mockResolvedValue(true);

      await RecurrenceSyncService.save({
        projectId: 'project-1',
        itemId: 'subtask-1',
        isSubTask: true,
        rule: null,
        userId: 'user-1'
      });

      expect(backendMock.subtaskRecurrence.delete).toHaveBeenCalledWith(
        'project-1',
        'subtask-1',
        'user-1'
      );
    });

    it('削除が失敗した場合はwarningを記録する', async () => {
      backendMock.taskRecurrence.delete.mockResolvedValue(false);
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await RecurrenceSyncService.save({
        projectId: 'project-1',
        itemId: 'task-1',
        isSubTask: false,
        rule: null,
        userId: 'user-1'
      });

      expect(consoleSpy).toHaveBeenCalledWith('Failed to delete recurrence association');
      consoleSpy.mockRestore();
    });

    it('削除時のエラーは再スローする', async () => {
      backendMock.taskRecurrence.delete.mockRejectedValue(new Error('Delete error'));

      await expect(
        RecurrenceSyncService.save({
          projectId: 'project-1',
          itemId: 'task-1',
          isSubTask: false,
          rule: null,
          userId: 'user-1'
        })
      ).rejects.toThrow('Delete error');
    });
  });

  describe('save - 既存ルールがある場合（更新）', () => {
    it('タスクの既存繰り返しルールを更新する', async () => {
      const existing = {
        taskId: 'task-1',
        recurrenceRuleId: 'existing-rule-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        deleted: false,
        updatedBy: 'user-1'
      };
      backendMock.taskRecurrence.getByTaskId.mockResolvedValue(existing);
      backendMock.recurrenceRule.update.mockResolvedValue(true);

      const rule = buildLegacyRule({ interval: 2 });

      await RecurrenceSyncService.save({
        projectId: 'project-1',
        itemId: 'task-1',
        isSubTask: false,
        rule,
        userId: 'user-1'
      });

      expect(backendMock.taskRecurrence.getByTaskId).toHaveBeenCalledWith(
        'project-1',
        'task-1',
        'user-1'
      );
      expect(backendMock.recurrenceRule.update).toHaveBeenCalledWith(
        'project-1',
        'existing-rule-1',
        expect.not.objectContaining({ id: expect.anything() }),
        'user-1'
      );
    });

    it('サブタスクの既存繰り返しルールを更新する', async () => {
      const existing = {
        subtaskId: 'subtask-1',
        recurrenceRuleId: 'existing-rule-2',
        createdAt: new Date(),
        updatedAt: new Date(),
        deleted: false,
        updatedBy: 'user-1'
      };
      backendMock.subtaskRecurrence.getBySubtaskId.mockResolvedValue(existing);
      backendMock.recurrenceRule.update.mockResolvedValue(true);

      const rule = buildLegacyRule();

      await RecurrenceSyncService.save({
        projectId: 'project-1',
        itemId: 'subtask-1',
        isSubTask: true,
        rule,
        userId: 'user-1'
      });

      expect(backendMock.subtaskRecurrence.getBySubtaskId).toHaveBeenCalledWith(
        'project-1',
        'subtask-1',
        'user-1'
      );
      expect(backendMock.recurrenceRule.update).toHaveBeenCalled();
    });

    it('ルール更新が失敗した場合はエラーをスローする', async () => {
      const existing = {
        taskId: 'task-1',
        recurrenceRuleId: 'rule-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        deleted: false,
        updatedBy: 'user-1'
      };
      backendMock.taskRecurrence.getByTaskId.mockResolvedValue(existing);
      backendMock.recurrenceRule.update.mockResolvedValue(false);

      await expect(
        RecurrenceSyncService.save({
          projectId: 'project-1',
          itemId: 'task-1',
          isSubTask: false,
          rule: buildLegacyRule(),
          userId: 'user-1'
        })
      ).rejects.toThrow('Failed to update recurrence rule');
    });
  });

  describe('save - 既存ルールがない場合（新規作成）', () => {
    it('タスクに新しい繰り返しルールと関連を作成する', async () => {
      backendMock.taskRecurrence.getByTaskId.mockResolvedValue(null);
      backendMock.recurrenceRule.create.mockResolvedValue(true);
      backendMock.taskRecurrence.create.mockResolvedValue(true);

      const rule = buildLegacyRule();

      await RecurrenceSyncService.save({
        projectId: 'project-1',
        itemId: 'task-1',
        isSubTask: false,
        rule,
        userId: 'user-1'
      });

      expect(backendMock.recurrenceRule.create).toHaveBeenCalledWith(
        'project-1',
        expect.objectContaining({
          id: 'test-uuid-1234',
          deleted: false,
          updatedBy: 'user-1'
        }),
        'user-1'
      );
      expect(backendMock.taskRecurrence.create).toHaveBeenCalledWith(
        'project-1',
        expect.objectContaining({
          taskId: 'task-1',
          recurrenceRuleId: 'test-uuid-1234'
        }),
        'user-1'
      );
    });

    it('サブタスクに新しい繰り返しルールと関連を作成する', async () => {
      backendMock.subtaskRecurrence.getBySubtaskId.mockResolvedValue(null);
      backendMock.recurrenceRule.create.mockResolvedValue(true);
      backendMock.subtaskRecurrence.create.mockResolvedValue(true);

      const rule = buildLegacyRule();

      await RecurrenceSyncService.save({
        projectId: 'project-1',
        itemId: 'subtask-1',
        isSubTask: true,
        rule,
        userId: 'user-1'
      });

      expect(backendMock.subtaskRecurrence.create).toHaveBeenCalledWith(
        'project-1',
        expect.objectContaining({
          subtaskId: 'subtask-1',
          recurrenceRuleId: 'test-uuid-1234'
        }),
        'user-1'
      );
    });

    it('ルール作成が失敗した場合はエラーをスローする', async () => {
      backendMock.taskRecurrence.getByTaskId.mockResolvedValue(null);
      backendMock.recurrenceRule.create.mockResolvedValue(false);

      await expect(
        RecurrenceSyncService.save({
          projectId: 'project-1',
          itemId: 'task-1',
          isSubTask: false,
          rule: buildLegacyRule(),
          userId: 'user-1'
        })
      ).rejects.toThrow('Failed to create recurrence rule');
    });

    it('関連作成が失敗した場合はエラーをスローする', async () => {
      backendMock.taskRecurrence.getByTaskId.mockResolvedValue(null);
      backendMock.recurrenceRule.create.mockResolvedValue(true);
      backendMock.taskRecurrence.create.mockResolvedValue(false);

      await expect(
        RecurrenceSyncService.save({
          projectId: 'project-1',
          itemId: 'task-1',
          isSubTask: false,
          rule: buildLegacyRule(),
          userId: 'user-1'
        })
      ).rejects.toThrow('Failed to create recurrence association');
    });
  });
});
