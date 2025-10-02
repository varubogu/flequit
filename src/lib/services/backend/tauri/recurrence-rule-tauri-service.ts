import { invoke } from '@tauri-apps/api/core';
import type { RecurrenceRule, RecurrenceRuleSearchCondition } from '$lib/types/recurrence';
import type { RecurrenceRuleService } from '$lib/services/backend/recurrence-rule-service';

export class RecurrenceRuleTauriService implements RecurrenceRuleService {
  async create(projectId: string, rule: RecurrenceRule): Promise<boolean> {
    try {
      const result = await invoke('create_recurrence_rule', { projectId, rule });
      return result as boolean;
    } catch (error) {
      console.error('Failed to create recurrence rule:', error);
      return false;
    }
  }

  async get(projectId: string, ruleId: string): Promise<RecurrenceRule | null> {
    try {
      const result = (await invoke('get_recurrence_rule', { projectId, ruleId })) as RecurrenceRule | null;
      return result;
    } catch (error) {
      console.error('Failed to get recurrence rule:', error);
      return null;
    }
  }

  async getAll(projectId: string): Promise<RecurrenceRule[]> {
    try {
      const result = (await invoke('get_all_recurrence_rules', { projectId })) as RecurrenceRule[];
      return result;
    } catch (error) {
      console.error('Failed to get all recurrence rules:', error);
      return [];
    }
  }

  async update(projectId: string, rule: RecurrenceRule): Promise<boolean> {
    try {
      const result = await invoke('update_recurrence_rule', { projectId, rule });
      return result as boolean;
    } catch (error) {
      console.error('Failed to update recurrence rule:', error);
      return false;
    }
  }

  async delete(projectId: string, ruleId: string): Promise<boolean> {
    try {
      const result = await invoke('delete_recurrence_rule', { projectId, ruleId });
      return result as boolean;
    } catch (error) {
      console.error('Failed to delete recurrence rule:', error);
      return false;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async search(projectId: string, _condition: RecurrenceRuleSearchCondition): Promise<RecurrenceRule[]> {
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
