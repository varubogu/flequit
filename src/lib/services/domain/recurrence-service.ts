import type { RecurrenceRule } from '$lib/types/recurrence';
import type { TaskRecurrence, SubtaskRecurrence } from '$lib/types/recurrence-reference';
import { resolveBackend } from '$lib/infrastructure/backend-client';
import { errorHandler } from '$lib/stores/error-handler.svelte';
import { getCurrentUserId } from '$lib/utils/user-id-helper';

/**
 * 繰り返しルールドメインサービス
 *
 * 責務:
 * 1. バックエンドへの登録 (resolveBackend経由)
 * 2. 繰り返しルールCRUD操作
 * 3. タスク/サブタスク繰り返し関連操作
 */
export const RecurrenceService = {
  // 繰り返しルール管理
  async createRecurrenceRule(projectId: string, rule: RecurrenceRule): Promise<boolean> {
    try {
      const backend = await resolveBackend();
      return await backend.recurrenceRule.create(projectId, rule, getCurrentUserId());
    } catch (error) {
      console.error('Failed to create recurrence rule:', error);
      errorHandler.addSyncError(
        '繰り返しルール作成',
        'recurrence',
        rule.id ?? 'unknown-recurrence-rule',
        error
      );
      throw error;
    }
  },

  async getRecurrenceRule(projectId: string, ruleId: string): Promise<RecurrenceRule | null> {
    try {
      const backend = await resolveBackend();
      return await backend.recurrenceRule.get(projectId, ruleId, getCurrentUserId());
    } catch (error) {
      console.error('Failed to get recurrence rule:', error);
      throw error;
    }
  },

  async getAllRecurrenceRules(projectId: string): Promise<RecurrenceRule[]> {
    try {
      const backend = await resolveBackend();
      return await backend.recurrenceRule.getAll(projectId, getCurrentUserId());
    } catch (error) {
      console.error('Failed to get all recurrence rules:', error);
      throw error;
    }
  },

  async updateRecurrenceRule(projectId: string, rule: RecurrenceRule): Promise<boolean> {
    try {
      const backend = await resolveBackend();
      return await backend.recurrenceRule.update(projectId, rule, getCurrentUserId());
    } catch (error) {
      console.error('Failed to update recurrence rule:', error);
      errorHandler.addSyncError(
        '繰り返しルール更新',
        'recurrence',
        rule.id ?? 'unknown-recurrence-rule',
        error
      );
      throw error;
    }
  },

  async deleteRecurrenceRule(projectId: string, ruleId: string): Promise<boolean> {
    try {
      const backend = await resolveBackend();
      return await backend.recurrenceRule.delete(projectId, ruleId, getCurrentUserId());
    } catch (error) {
      console.error('Failed to delete recurrence rule:', error);
      errorHandler.addSyncError('繰り返しルール削除', 'recurrence', ruleId, error);
      throw error;
    }
  },

  // タスク繰り返し管理
  async createTaskRecurrence(projectId: string, taskRecurrence: TaskRecurrence): Promise<boolean> {
    try {
      const backend = await resolveBackend();
      return await backend.taskRecurrence.create(projectId, taskRecurrence, getCurrentUserId());
    } catch (error) {
      console.error('Failed to create task recurrence:', error);
      errorHandler.addSyncError('タスク繰り返し作成', 'task', taskRecurrence.taskId, error);
      throw error;
    }
  },

  async getTaskRecurrenceByTaskId(projectId: string, taskId: string): Promise<TaskRecurrence | null> {
    try {
      const backend = await resolveBackend();
      return await backend.taskRecurrence.getByTaskId(projectId, taskId, getCurrentUserId());
    } catch (error) {
      console.error('Failed to get task recurrence:', error);
      throw error;
    }
  },

  async deleteTaskRecurrence(projectId: string, taskId: string): Promise<boolean> {
    try {
      const backend = await resolveBackend();
      return await backend.taskRecurrence.delete(projectId, taskId, getCurrentUserId());
    } catch (error) {
      console.error('Failed to delete task recurrence:', error);
      errorHandler.addSyncError('タスク繰り返し削除', 'task', taskId, error);
      throw error;
    }
  },

  // サブタスク繰り返し管理
  async createSubtaskRecurrence(projectId: string, subtaskRecurrence: SubtaskRecurrence): Promise<boolean> {
    try {
      const backend = await resolveBackend();
      return await backend.subtaskRecurrence.create(projectId, subtaskRecurrence, getCurrentUserId());
    } catch (error) {
      console.error('Failed to create subtask recurrence:', error);
      errorHandler.addSyncError('サブタスク繰り返し作成', 'subtask', subtaskRecurrence.subtaskId, error);
      throw error;
    }
  },

  async getSubtaskRecurrenceBySubtaskId(projectId: string, subtaskId: string): Promise<SubtaskRecurrence | null> {
    try {
      const backend = await resolveBackend();
      return await backend.subtaskRecurrence.getBySubtaskId(projectId, subtaskId, getCurrentUserId());
    } catch (error) {
      console.error('Failed to get subtask recurrence:', error);
      throw error;
    }
  },

  async deleteSubtaskRecurrence(projectId: string, subtaskId: string): Promise<boolean> {
    try {
      const backend = await resolveBackend();
      return await backend.subtaskRecurrence.delete(projectId, subtaskId, getCurrentUserId());
    } catch (error) {
      console.error('Failed to delete subtask recurrence:', error);
      errorHandler.addSyncError('サブタスク繰り返し削除', 'subtask', subtaskId, error);
      throw error;
    }
  }
};
