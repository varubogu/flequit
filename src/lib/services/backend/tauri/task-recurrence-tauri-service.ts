import { invoke } from '@tauri-apps/api/core';
import type { TaskRecurrence, TaskRecurrenceSearchCondition } from '$lib/types/recurrence-reference';
import type { TaskRecurrenceService } from '$lib/services/backend/task-recurrence-service';

export class TaskRecurrenceTauriService implements TaskRecurrenceService {
  async create(taskRecurrence: TaskRecurrence): Promise<boolean> {
    try {
      const result = await invoke('create_task_recurrence', { taskRecurrence });
      return result as boolean;
    } catch (error) {
      console.error('Failed to create task recurrence:', error);
      return false;
    }
  }

  async getByTaskId(taskId: string): Promise<TaskRecurrence | null> {
    try {
      const result = (await invoke('get_task_recurrence_by_task_id', { taskId })) as TaskRecurrence | null;
      return result;
    } catch (error) {
      console.error('Failed to get task recurrence by task ID:', error);
      return null;
    }
  }

  async delete(taskId: string): Promise<boolean> {
    try {
      const result = await invoke('delete_task_recurrence', { taskId });
      return result as boolean;
    } catch (error) {
      console.error('Failed to delete task recurrence:', error);
      return false;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async search(_condition: TaskRecurrenceSearchCondition): Promise<TaskRecurrence[]> {
    try {
      // TODO: search_task_recurrences コマンドが Tauri側に実装されていないため、一時的にmock実装
      console.warn('search_task_recurrences is not implemented - using mock implementation');
      return [];
    } catch (error) {
      console.error('Failed to search task recurrences:', error);
      return [];
    }
  }
}
