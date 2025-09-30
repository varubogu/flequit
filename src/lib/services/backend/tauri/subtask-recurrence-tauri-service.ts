import { invoke } from '@tauri-apps/api/core';
import type { SubtaskRecurrence, SubtaskRecurrenceSearchCondition } from '$lib/types/recurrence-reference';
import type { SubtaskRecurrenceService } from '$lib/services/backend/subtask-recurrence-service';

export class SubtaskRecurrenceTauriService implements SubtaskRecurrenceService {
  async create(subtaskRecurrence: SubtaskRecurrence): Promise<boolean> {
    try {
      const result = await invoke('create_subtask_recurrence', { subtaskRecurrence });
      return result as boolean;
    } catch (error) {
      console.error('Failed to create subtask recurrence:', error);
      return false;
    }
  }

  async getBySubtaskId(subtaskId: string): Promise<SubtaskRecurrence | null> {
    try {
      const result = (await invoke('get_subtask_recurrence_by_subtask_id', { subtaskId })) as SubtaskRecurrence | null;
      return result;
    } catch (error) {
      console.error('Failed to get subtask recurrence by subtask ID:', error);
      return null;
    }
  }

  async delete(subtaskId: string): Promise<boolean> {
    try {
      const result = await invoke('delete_subtask_recurrence', { subtaskId });
      return result as boolean;
    } catch (error) {
      console.error('Failed to delete subtask recurrence:', error);
      return false;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async search(_condition: SubtaskRecurrenceSearchCondition): Promise<SubtaskRecurrence[]> {
    try {
      // TODO: search_subtask_recurrences コマンドが Tauri側に実装されていないため、一時的にmock実装
      console.warn('search_subtask_recurrences is not implemented - using mock implementation');
      return [];
    } catch (error) {
      console.error('Failed to search subtask recurrences:', error);
      return [];
    }
  }
}
