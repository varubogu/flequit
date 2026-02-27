import { invoke } from '@tauri-apps/api/core';
import type {
  RecurrenceRule,
  RecurrenceRulePatch,
  RecurrenceRuleSearchCondition
} from '$lib/types/recurrence';
import type { RecurrenceRuleService } from '$lib/infrastructure/backends/recurrence-rule-service';
import {
  fromTauriRecurrenceRuleModel,
  type TauriRecurrenceRuleModel,
  toTauriRecurrenceRuleCommandModel,
  toTauriRecurrenceRulePatchCommandModel
} from '$lib/utils/recurrence-converter';

export class RecurrenceRuleTauriService implements RecurrenceRuleService {
  async create(projectId: string, rule: RecurrenceRule, userId: string): Promise<boolean> {
    const ruleForTauri = toTauriRecurrenceRuleCommandModel(rule, userId);

    try {
      const result = await invoke('create_recurrence_rule', {
        projectId,
        rule: ruleForTauri,
        userId
      });
      return result as boolean;
    } catch (error) {
      console.error('[RecurrenceRuleTauriService.create] Failed to create recurrence rule:', error);
      return false;
    }
  }

  async get(projectId: string, ruleId: string, userId: string): Promise<RecurrenceRule | null> {
    try {
      const result = (await invoke('get_recurrence_rule', { projectId, ruleId, userId })) as Record<
        string,
        unknown
      > | null;
      if (!result) return null;
      return fromTauriRecurrenceRuleModel(result as TauriRecurrenceRuleModel);
    } catch (error) {
      console.error('Failed to get recurrence rule:', error);
      return null;
    }
  }

  async getAll(projectId: string, userId: string): Promise<RecurrenceRule[]> {
    try {
      const result = (await invoke('get_all_recurrence_rules', { projectId, userId })) as Record<
        string,
        unknown
      >[];
      return result.map((rule) => fromTauriRecurrenceRuleModel(rule as TauriRecurrenceRuleModel));
    } catch (error) {
      console.error('Failed to get all recurrence rules:', error);
      return [];
    }
  }

  async update(
    projectId: string,
    ruleId: string,
    patch: RecurrenceRulePatch,
    userId: string
  ): Promise<boolean> {
    try {
      const patchForTauri = toTauriRecurrenceRulePatchCommandModel(ruleId, patch, userId);

      const result = await invoke('update_recurrence_rule', {
        projectId,
        patch: patchForTauri,
        userId
      });
      return result as boolean;
    } catch (error) {
      console.error('Failed to update recurrence rule:', error);
      return false;
    }
  }

  async delete(projectId: string, ruleId: string, userId: string): Promise<boolean> {
    try {
      const result = await invoke('delete_recurrence_rule', { projectId, ruleId, userId });
      return result as boolean;
    } catch (error) {
      console.error('Failed to delete recurrence rule:', error);
      return false;
    }
  }

  async search(
    _projectId: string,
    _condition: RecurrenceRuleSearchCondition
  ): Promise<RecurrenceRule[]> {
    try {
      // TODO: search_recurrence_rules コマンドが Tauri側に実装されていないため、一時的にmock実装
      console.warn('search_recurrence_rules is not implemented - using mock implementation');
      return [];
    } catch (error) {
      console.error('Failed to search recurrence rules:', error);
      return [];
    }
  }
}
