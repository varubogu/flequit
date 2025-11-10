import type { RecurrenceRule as LegacyRecurrenceRule } from '$lib/types/datetime-calendar';
import { fromLegacyRecurrenceRule } from '$lib/utils/recurrence-converter';
import { resolveBackend } from '$lib/infrastructure/backend-client';
import { getCurrentUserId } from '$lib/utils/user-id-helper';

export type RecurrenceSaveParams = {
  projectId: string;
  itemId: string;
  isSubTask: boolean;
  rule: LegacyRecurrenceRule | null;
};

export const RecurrenceSyncService = {
  async save({ projectId, itemId, isSubTask, rule }: RecurrenceSaveParams) {
    const backend = await resolveBackend();
    const unifiedRule = fromLegacyRecurrenceRule(rule);

    if (rule === null) {
      if (isSubTask) {
        await backend.subtaskRecurrence.delete(projectId, itemId, getCurrentUserId());
      } else {
        await backend.taskRecurrence.delete(projectId, itemId, getCurrentUserId());
      }
      return;
    }

    const existing = isSubTask
      ? await backend.subtaskRecurrence.getBySubtaskId(projectId, itemId, getCurrentUserId())
      : await backend.taskRecurrence.getByTaskId(projectId, itemId, getCurrentUserId());

    if (existing) {
      await backend.recurrenceRule.update(projectId, {
        ...unifiedRule!,
        id: existing.recurrenceRuleId
      }, getCurrentUserId());
    } else {
      const ruleId = crypto.randomUUID();
      await backend.recurrenceRule.create(projectId, {
        ...unifiedRule!,
        id: ruleId,
        deleted: false,
        updatedBy: getCurrentUserId()
      }, getCurrentUserId());

      if (isSubTask) {
        await backend.subtaskRecurrence.create(projectId, {
          subtaskId: itemId,
          recurrenceRuleId: ruleId,
          createdAt: new Date(),
          updatedAt: new Date(),
          deleted: false,
          updatedBy: getCurrentUserId()
        }, getCurrentUserId());
      } else {
        await backend.taskRecurrence.create(projectId, {
          taskId: itemId,
          recurrenceRuleId: ruleId,
          createdAt: new Date(),
          updatedAt: new Date(),
          deleted: false,
          updatedBy: getCurrentUserId()
        }, getCurrentUserId());
      }
    }
  }
};
