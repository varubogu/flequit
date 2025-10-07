import type { RecurrenceRule as LegacyRecurrenceRule } from '$lib/types/datetime-calendar';
import { fromLegacyRecurrenceRule } from '$lib/utils/recurrence-converter';
import { resolveBackend } from '$lib/infrastructure/backend-client';

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
        await backend.subtaskRecurrence.delete(projectId, itemId);
      } else {
        await backend.taskRecurrence.delete(projectId, itemId);
      }
      return;
    }

    const existing = isSubTask
      ? await backend.subtaskRecurrence.getBySubtaskId(projectId, itemId)
      : await backend.taskRecurrence.getByTaskId(projectId, itemId);

    if (existing) {
      await backend.recurrenceRule.update(projectId, {
        ...unifiedRule!,
        id: existing.recurrenceRuleId
      });
    } else {
      const ruleId = crypto.randomUUID();
      await backend.recurrenceRule.create(projectId, { ...unifiedRule!, id: ruleId });

      if (isSubTask) {
        await backend.subtaskRecurrence.create(projectId, {
          subtaskId: itemId,
          recurrenceRuleId: ruleId
        });
      } else {
        await backend.taskRecurrence.create(projectId, {
          taskId: itemId,
          recurrenceRuleId: ruleId
        });
      }
    }
  }
};
