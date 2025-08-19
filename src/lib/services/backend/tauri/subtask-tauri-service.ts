import { invoke } from '@tauri-apps/api/core';
import type { SubTaskSearchCondition } from '$lib/types/sub-task';
import type { SubTask } from '$lib/types/sub-task';
import type { SubTaskService } from '$lib/services/backend/subtask-service';

export class SubtaskTauriService implements SubTaskService {
  async create(subTask: SubTask): Promise<boolean> {
    try {
      await invoke('create_sub_task', { subTask });
      return true;
    } catch (error) {
      console.error('Failed to create sub task:', error);
      return false;
    }
  }

  async update(subTask: SubTask): Promise<boolean> {
    try {
      await invoke('update_sub_task', { subTask });
      return true;
    } catch (error) {
      console.error('Failed to update sub task:', error);
      return false;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await invoke('delete_sub_task', { id });
      return true;
    } catch (error) {
      console.error('Failed to delete sub task:', error);
      return false;
    }
  }

  async get(id: string): Promise<SubTask | null> {
    try {
      const result = (await invoke('get_sub_task', { id })) as SubTask | null;
      return result;
    } catch (error) {
      console.error('Failed to get sub task:', error);
      return null;
    }
  }

  async search(condition: SubTaskSearchCondition): Promise<SubTask[]> {
    try {
      const results = (await invoke('search_sub_tasks', { condition })) as SubTask[];
      return results;
    } catch (error) {
      console.error('Failed to search sub tasks:', error);
      return [];
    }
  }
}
