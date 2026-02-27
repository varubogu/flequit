import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { RecurrenceRule } from '$lib/types/recurrence';
import type { TaskRecurrence, SubtaskRecurrence } from '$lib/types/recurrence-reference';

// ---------- モック ----------

const backendMock = {
  recurrenceRule: {
    create: vi.fn(),
    get: vi.fn(),
    getAll: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  },
  taskRecurrence: {
    create: vi.fn(),
    getByTaskId: vi.fn(),
    delete: vi.fn()
  },
  subtaskRecurrence: {
    create: vi.fn(),
    getBySubtaskId: vi.fn(),
    delete: vi.fn()
  }
};

vi.mock('$lib/infrastructure/backend-client', () => ({
  resolveBackend: vi.fn(async () => backendMock)
}));

vi.mock('$lib/services/domain/current-user-id', () => ({
  getCurrentUserId: vi.fn(() => 'user-1')
}));

const errorHandlerMock = {
  addSyncError: vi.fn()
};

vi.mock('$lib/stores/error-handler.svelte', () => ({
  errorHandler: errorHandlerMock
}));

// ---------- ヘルパー ----------

const now = new Date('2025-01-01T00:00:00.000Z');

const buildRecurrenceRule = (overrides: Partial<RecurrenceRule> = {}): RecurrenceRule => ({
  id: 'rule-1',
  unit: 'day',
  interval: 1,
  createdAt: now,
  updatedAt: now,
  deleted: false,
  updatedBy: 'user-1',
  ...overrides
});

const buildTaskRecurrence = (overrides: Partial<TaskRecurrence> = {}): TaskRecurrence => ({
  taskId: 'task-1',
  recurrenceRuleId: 'rule-1',
  createdAt: now,
  updatedAt: now,
  deleted: false,
  updatedBy: 'user-1',
  ...overrides
});

const buildSubtaskRecurrence = (
  overrides: Partial<SubtaskRecurrence> = {}
): SubtaskRecurrence => ({
  subtaskId: 'subtask-1',
  recurrenceRuleId: 'rule-1',
  createdAt: now,
  updatedAt: now,
  deleted: false,
  updatedBy: 'user-1',
  ...overrides
});

// ---------- テスト ----------

const { RecurrenceRuleService, RecurrenceService } = await import(
  '$lib/services/domain/recurrence-service'
);

describe('RecurrenceRuleService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createRecurrenceRule', () => {
    it('バックエンドで繰り返しルールを作成する', async () => {
      const rule = buildRecurrenceRule();
      backendMock.recurrenceRule.create.mockResolvedValue(true);

      const result = await RecurrenceRuleService.createRecurrenceRule('project-1', rule);

      expect(backendMock.recurrenceRule.create).toHaveBeenCalledWith('project-1', rule, 'user-1');
      expect(result).toBe(true);
    });

    it('バックエンドエラー時はエラーを記録して再スローする', async () => {
      const rule = buildRecurrenceRule();
      const error = new Error('Backend error');
      backendMock.recurrenceRule.create.mockRejectedValue(error);

      await expect(RecurrenceRuleService.createRecurrenceRule('project-1', rule)).rejects.toThrow(
        'Backend error'
      );
      expect(errorHandlerMock.addSyncError).toHaveBeenCalledWith(
        '繰り返しルール作成',
        'recurrence',
        'rule-1',
        error
      );
    });
  });

  describe('getRecurrenceRule', () => {
    it('バックエンドから繰り返しルールを取得する', async () => {
      const rule = buildRecurrenceRule();
      backendMock.recurrenceRule.get.mockResolvedValue(rule);

      const result = await RecurrenceRuleService.getRecurrenceRule('project-1', 'rule-1');

      expect(backendMock.recurrenceRule.get).toHaveBeenCalledWith('project-1', 'rule-1', 'user-1');
      expect(result).toEqual(rule);
    });

    it('バックエンドエラー時は再スローする', async () => {
      backendMock.recurrenceRule.get.mockRejectedValue(new Error('Not found'));

      await expect(
        RecurrenceRuleService.getRecurrenceRule('project-1', 'rule-1')
      ).rejects.toThrow('Not found');
    });
  });

  describe('getAllRecurrenceRules', () => {
    it('プロジェクトの全繰り返しルールを取得する', async () => {
      const rules = [buildRecurrenceRule(), buildRecurrenceRule({ id: 'rule-2' })];
      backendMock.recurrenceRule.getAll.mockResolvedValue(rules);

      const result = await RecurrenceRuleService.getAllRecurrenceRules('project-1');

      expect(backendMock.recurrenceRule.getAll).toHaveBeenCalledWith('project-1', 'user-1');
      expect(result).toEqual(rules);
    });
  });

  describe('updateRecurrenceRule', () => {
    it('バックエンドで繰り返しルールを更新する（id/監査項目を除外）', async () => {
      const rule = buildRecurrenceRule({ unit: 'week', interval: 2 });
      backendMock.recurrenceRule.update.mockResolvedValue(true);

      const result = await RecurrenceRuleService.updateRecurrenceRule('project-1', rule);

      expect(backendMock.recurrenceRule.update).toHaveBeenCalledWith(
        'project-1',
        'rule-1',
        expect.not.objectContaining({ id: 'rule-1' }),
        'user-1'
      );
      expect(result).toBe(true);
    });

    it('idがない場合はエラーをスローする', async () => {
      const rule = buildRecurrenceRule({ id: undefined });

      await expect(
        RecurrenceRuleService.updateRecurrenceRule('project-1', rule)
      ).rejects.toThrow('RecurrenceRule ID is required for update');
    });
  });

  describe('deleteRecurrenceRule', () => {
    it('バックエンドで繰り返しルールを削除する', async () => {
      backendMock.recurrenceRule.delete.mockResolvedValue(true);

      const result = await RecurrenceRuleService.deleteRecurrenceRule('project-1', 'rule-1');

      expect(backendMock.recurrenceRule.delete).toHaveBeenCalledWith(
        'project-1',
        'rule-1',
        'user-1'
      );
      expect(result).toBe(true);
    });

    it('バックエンドエラー時はエラーを記録して再スローする', async () => {
      const error = new Error('Delete failed');
      backendMock.recurrenceRule.delete.mockRejectedValue(error);

      await expect(
        RecurrenceRuleService.deleteRecurrenceRule('project-1', 'rule-1')
      ).rejects.toThrow('Delete failed');
      expect(errorHandlerMock.addSyncError).toHaveBeenCalledWith(
        '繰り返しルール削除',
        'recurrence',
        'rule-1',
        error
      );
    });
  });

  describe('createTaskRecurrence', () => {
    it('タスク繰り返しを作成する', async () => {
      const taskRecurrence = buildTaskRecurrence();
      backendMock.taskRecurrence.create.mockResolvedValue(true);

      const result = await RecurrenceRuleService.createTaskRecurrence('project-1', taskRecurrence);

      expect(backendMock.taskRecurrence.create).toHaveBeenCalledWith(
        'project-1',
        taskRecurrence,
        'user-1'
      );
      expect(result).toBe(true);
    });

    it('バックエンドエラー時はエラーを記録して再スローする', async () => {
      const taskRecurrence = buildTaskRecurrence();
      const error = new Error('Create failed');
      backendMock.taskRecurrence.create.mockRejectedValue(error);

      await expect(
        RecurrenceRuleService.createTaskRecurrence('project-1', taskRecurrence)
      ).rejects.toThrow('Create failed');
      expect(errorHandlerMock.addSyncError).toHaveBeenCalledWith(
        'タスク繰り返し作成',
        'task',
        'task-1',
        error
      );
    });
  });

  describe('getTaskRecurrenceByTaskId', () => {
    it('タスクIDで繰り返し設定を取得する', async () => {
      const taskRecurrence = buildTaskRecurrence();
      backendMock.taskRecurrence.getByTaskId.mockResolvedValue(taskRecurrence);

      const result = await RecurrenceRuleService.getTaskRecurrenceByTaskId('project-1', 'task-1');

      expect(backendMock.taskRecurrence.getByTaskId).toHaveBeenCalledWith(
        'project-1',
        'task-1',
        'user-1'
      );
      expect(result).toEqual(taskRecurrence);
    });
  });

  describe('deleteTaskRecurrence', () => {
    it('タスク繰り返しを削除する', async () => {
      backendMock.taskRecurrence.delete.mockResolvedValue(true);

      const result = await RecurrenceRuleService.deleteTaskRecurrence('project-1', 'task-1');

      expect(backendMock.taskRecurrence.delete).toHaveBeenCalledWith(
        'project-1',
        'task-1',
        'user-1'
      );
      expect(result).toBe(true);
    });
  });

  describe('createSubtaskRecurrence', () => {
    it('サブタスク繰り返しを作成する', async () => {
      const subtaskRecurrence = buildSubtaskRecurrence();
      backendMock.subtaskRecurrence.create.mockResolvedValue(true);

      const result = await RecurrenceRuleService.createSubtaskRecurrence(
        'project-1',
        subtaskRecurrence
      );

      expect(backendMock.subtaskRecurrence.create).toHaveBeenCalledWith(
        'project-1',
        subtaskRecurrence,
        'user-1'
      );
      expect(result).toBe(true);
    });
  });

  describe('getSubtaskRecurrenceBySubtaskId', () => {
    it('サブタスクIDで繰り返し設定を取得する', async () => {
      const subtaskRecurrence = buildSubtaskRecurrence();
      backendMock.subtaskRecurrence.getBySubtaskId.mockResolvedValue(subtaskRecurrence);

      const result = await RecurrenceRuleService.getSubtaskRecurrenceBySubtaskId(
        'project-1',
        'subtask-1'
      );

      expect(backendMock.subtaskRecurrence.getBySubtaskId).toHaveBeenCalledWith(
        'project-1',
        'subtask-1',
        'user-1'
      );
      expect(result).toEqual(subtaskRecurrence);
    });
  });

  describe('deleteSubtaskRecurrence', () => {
    it('サブタスク繰り返しを削除する', async () => {
      backendMock.subtaskRecurrence.delete.mockResolvedValue(true);

      const result = await RecurrenceRuleService.deleteSubtaskRecurrence('project-1', 'subtask-1');

      expect(backendMock.subtaskRecurrence.delete).toHaveBeenCalledWith(
        'project-1',
        'subtask-1',
        'user-1'
      );
      expect(result).toBe(true);
    });
  });
});

describe('RecurrenceService (deprecated alias)', () => {
  it('RecurrenceRuleServiceの別名として機能する', () => {
    expect(RecurrenceService).toBe(RecurrenceRuleService);
  });
});
