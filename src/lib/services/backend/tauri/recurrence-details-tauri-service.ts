import { invoke } from '@tauri-apps/api/core';
import type { RecurrenceDetails, RecurrenceDetailsSearchCondition } from '$lib/types/recurrence-details';
import type { RecurrenceDetailsService } from '$lib/services/backend/recurrence-details-service';

export class RecurrenceDetailsTauriService implements RecurrenceDetailsService {
  async create(details: RecurrenceDetails): Promise<boolean> {
    try {
      const result = await invoke('create_recurrence_details', { details });
      return result as boolean;
    } catch (error) {
      console.error('Failed to create recurrence details:', error);
      return false;
    }
  }

  async getByRuleId(ruleId: string): Promise<RecurrenceDetails | null> {
    try {
      const result = (await invoke('get_recurrence_details_by_rule_id', { rule_id: ruleId })) as RecurrenceDetails | null;
      return result;
    } catch (error) {
      console.error('Failed to get recurrence details by rule ID:', error);
      return null;
    }
  }

  async update(details: RecurrenceDetails): Promise<boolean> {
    try {
      const result = await invoke('update_recurrence_details', { details });
      return result as boolean;
    } catch (error) {
      console.error('Failed to update recurrence details:', error);
      return false;
    }
  }

  async delete(detailsId: string): Promise<boolean> {
    try {
      const result = await invoke('delete_recurrence_details', { details_id: detailsId });
      return result as boolean;
    } catch (error) {
      console.error('Failed to delete recurrence details:', error);
      return false;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async search(_condition: RecurrenceDetailsSearchCondition): Promise<RecurrenceDetails[]> {
    try {
      // TODO: search_recurrence_details コマンドが Tauri側に実装されていないため、一時的にmock実装
      console.warn('search_recurrence_details is not implemented - using mock implementation');
      return [];
    } catch (error) {
      console.error('Failed to search recurrence details:', error);
      return [];
    }
  }
}