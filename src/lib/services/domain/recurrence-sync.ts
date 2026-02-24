import type { RecurrenceRule as LegacyRecurrenceRule } from '$lib/types/datetime-calendar';
import type { RecurrenceRulePatch } from '$lib/types/recurrence';
import { fromLegacyRecurrenceRule } from '$lib/utils/recurrence-converter';
import { resolveBackend } from '$lib/infrastructure/backend-client';

export type RecurrenceSaveParams = {
  projectId: string;
  itemId: string;
  isSubTask: boolean;
  rule: LegacyRecurrenceRule | null;
  userId: string; // 追加: 呼び出し元から渡す
};

export const RecurrenceSyncService = {
  async save({ projectId, itemId, isSubTask, rule, userId }: RecurrenceSaveParams) {
    const backend = await resolveBackend();
    const unifiedRule = fromLegacyRecurrenceRule(rule);

    if (rule === null) {
      // Delete recurrence
      try {
        const deleteSuccess = isSubTask
          ? await backend.subtaskRecurrence.delete(projectId, itemId, userId)
          : await backend.taskRecurrence.delete(projectId, itemId, userId);

        if (!deleteSuccess) {
          console.warn('Failed to delete recurrence association');
        }
      } catch (error) {
        console.error('Error deleting recurrence:', error);
        throw error;
      }
      return;
    }

    const existing = isSubTask
      ? await backend.subtaskRecurrence.getBySubtaskId(projectId, itemId, userId)
      : await backend.taskRecurrence.getByTaskId(projectId, itemId, userId);

    if (existing) {
      // Update existing rule (差分更新)
      try {
        // unifiedRuleを差分として送信（id/監査項目は除外）
        const patch: RecurrenceRulePatch = { ...unifiedRule! };
        delete patch.id;
        delete patch.createdAt;
        delete patch.updatedAt;
        delete patch.updatedBy;

        const updateSuccess = await backend.recurrenceRule.update(
          projectId,
          existing.recurrenceRuleId,
          patch,
          userId
        );

        if (!updateSuccess) {
          throw new Error('Failed to update recurrence rule');
        }
      } catch (error) {
        console.error('Error updating recurrence rule:', error);
        throw error;
      }
    } else {
      // Create new rule and association
      try {
        const ruleId = crypto.randomUUID();

        // Step 1: Create recurrence rule
        const ruleCreateSuccess = await backend.recurrenceRule.create(projectId, {
          ...unifiedRule!,
          id: ruleId,
          deleted: false,
          updatedBy: userId
        }, userId);

        if (!ruleCreateSuccess) {
          throw new Error('Failed to create recurrence rule');
        }

        // Step 2: Create association between task/subtask and rule
        const associationSuccess = isSubTask
          ? await backend.subtaskRecurrence.create(projectId, {
              subtaskId: itemId,
              recurrenceRuleId: ruleId,
              createdAt: new Date(),
              updatedAt: new Date(),
              deleted: false,
              updatedBy: userId
            }, userId)
          : await backend.taskRecurrence.create(projectId, {
              taskId: itemId,
              recurrenceRuleId: ruleId,
              createdAt: new Date(),
              updatedAt: new Date(),
              deleted: false,
              updatedBy: userId
            }, userId);

        if (!associationSuccess) {
          throw new Error('Failed to create recurrence association');
        }
      } catch (error) {
        console.error('Error creating recurrence:', error);
        throw error;
      }
    }
  }
};
