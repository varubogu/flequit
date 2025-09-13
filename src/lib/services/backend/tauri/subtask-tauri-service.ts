import { invoke } from '@tauri-apps/api/core';
import type { SubTaskSearchCondition, SubTask, SubTaskPatch } from '$lib/types/sub-task';
import type { SubTaskService } from '$lib/services/backend/subtask-service';

export class SubtaskTauriService implements SubTaskService {
  async create(projectId: string, subTask: SubTask): Promise<boolean> {
    try {
      await invoke('create_sub_task', { project_id: projectId, sub_task: subTask });
      return true;
    } catch (error) {
      console.error('Failed to create sub task:', error);
      return false;
    }
  }

  async update(projectId: string, id: string, patch: SubTaskPatch): Promise<boolean> {
    try {
      const result = await invoke('update_sub_task', { project_id: projectId, id, patch });
      return result as boolean;
    } catch (error) {
      console.error('Failed to update subtask:', error);
      return false;
    }
  }

  async delete(projectId: string, id: string): Promise<boolean> {
    try {
      await invoke('delete_sub_task', { project_id: projectId, id });
      return true;
    } catch (error) {
      console.error('Failed to delete sub task:', error);
      return false;
    }
  }

  async get(projectId: string, id: string): Promise<SubTask | null> {
    try {
      const result = (await invoke('get_sub_task', { project_id: projectId, id })) as SubTask | null;
      return result;
    } catch (error) {
      console.error('Failed to get sub task:', error);
      return null;
    }
  }

  async search(projectId: string, condition: SubTaskSearchCondition): Promise<SubTask[]> {
    // TODO: search_sub_tasks コマンドが Tauri側に実装されていないため、一時的にmock実装
    console.warn('search_sub_tasks is not implemented on Tauri side - using mock implementation');
    try {
      // 一時的に空の配列を返す
      return [];
    } catch (error) {
      console.error('Failed to search sub tasks:', error);
      return [];
    }
  }
}
