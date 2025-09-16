import { invoke } from '@tauri-apps/api/core';
import type { RecurrenceAdjustment, RecurrenceAdjustmentSearchCondition } from '$lib/types/recurrence-adjustment';
import type { RecurrenceAdjustmentService } from '$lib/services/backend/recurrence-adjustment-service';

export class RecurrenceAdjustmentTauriService implements RecurrenceAdjustmentService {
  async create(adjustment: RecurrenceAdjustment): Promise<boolean> {
    try {
      const result = await invoke('create_recurrence_adjustment', { adjustment });
      return result as boolean;
    } catch (error) {
      console.error('Failed to create recurrence adjustment:', error);
      return false;
    }
  }

  async getByRuleId(ruleId: string): Promise<RecurrenceAdjustment[]> {
    try {
      const result = (await invoke('get_recurrence_adjustments_by_rule_id', { ruleId })) as RecurrenceAdjustment[];
      return result;
    } catch (error) {
      console.error('Failed to get recurrence adjustments by rule ID:', error);
      return [];
    }
  }

  async delete(adjustmentId: string): Promise<boolean> {
    try {
      const result = await invoke('delete_recurrence_adjustment', { adjustmentId });
      return result as boolean;
    } catch (error) {
      console.error('Failed to delete recurrence adjustment:', error);
      return false;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async search(_condition: RecurrenceAdjustmentSearchCondition): Promise<RecurrenceAdjustment[]> {
    try {
      // TODO: search_recurrence_adjustments コマンドが Tauri側に実装されていないため、一時的にmock実装
      console.warn('search_recurrence_adjustments is not implemented - using mock implementation');
      return [];
    } catch (error) {
      console.error('Failed to search recurrence adjustments:', error);
      return [];
    }
  }
}
