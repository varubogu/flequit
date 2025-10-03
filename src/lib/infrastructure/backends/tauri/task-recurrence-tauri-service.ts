import { invoke } from '@tauri-apps/api/core';
import type { TaskRecurrence, TaskRecurrenceSearchCondition } from '$lib/types/recurrence-reference';
import type { TaskRecurrenceService } from '$lib/infrastructure/backends/task-recurrence-service';

export class TaskRecurrenceTauriService implements TaskRecurrenceService {
  async create(projectId: string, taskRecurrence: TaskRecurrence): Promise<boolean> {
    try {
      const result = await invoke('create_task_recurrence', { projectId, taskRecurrence });
      return result as boolean;
    } catch (error) {
      console.error('Failed to create task recurrence:', error);
      return false;
    }
  }

  async getByTaskId(projectId: string, taskId: string): Promise<TaskRecurrence | null> {
    try {
      const result = (await invoke('get_task_recurrence_by_task_id', { projectId, taskId })) as TaskRecurrence | null;
      return result;
    } catch (error) {
      console.error('Failed to get task recurrence by task ID:', error);
      return null;
    }
  }

  async delete(projectId: string, taskId: string): Promise<boolean> {
    try {
      const result = await invoke('delete_task_recurrence', { projectId, taskId });
      return result as boolean;
    } catch (error) {
      console.error('Failed to delete task recurrence:', error);
      return false;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async search(projectId: string, _condition: TaskRecurrenceSearchCondition): Promise<TaskRecurrence[]> {
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
