import { invoke } from '@tauri-apps/api/core';
import type { Task } from '$lib/types/task';
import type { TaskService } from '../task-service';

export class TaskTauriService implements TaskService {
  async create(projectId: string, task: Task, userId: string): Promise<boolean> {
    try {
      // TaskCommandModel形式でproject_idを設定
      const taskWithProjectId = { ...task, projectId };
      await invoke('create_task', { task: taskWithProjectId, userId });
      return true;
    } catch (error) {
      console.error('Failed to create task:', error);
      return false;
    }
  }

  async update(projectId: string, id: string, patch: Partial<Task>, userId: string): Promise<boolean> {
    try {
      // patchにidを含める（Tauriコマンドの要求）
      const patchWithId = { ...patch, id };
      console.log('[TaskTauriService.update] Sending patch:', JSON.stringify(patchWithId, null, 2));
      const result = await invoke('update_task', { projectId, patch: patchWithId, userId });
      return result as boolean;
    } catch (error) {
      console.error('Failed to update task:', error);
      return false;
    }
  }

  async delete(projectId: string, id: string, userId: string): Promise<boolean> {
    try {
      await invoke('delete_task', { projectId, id, userId });
      return true;
    } catch (error) {
      console.error('Failed to delete task:', error);
      return false;
    }
  }

  async restore(projectId: string, id: string, userId: string): Promise<boolean> {
    try {
      await invoke('restore_task', { projectId, id, userId });
      return true;
    } catch (error) {
      console.error('Failed to restore task:', error);
      return false;
    }
  }

  async get(projectId: string, id: string, userId: string): Promise<Task | null> {
    try {
      const result = (await invoke('get_task', { projectId, id, userId })) as Task | null;
      return result;
    } catch (error) {
      console.error('Failed to get task:', error);
      return null;
    }
  }

  async search(): Promise<Task[]> {
    // TODO: search_tasks コマンドが Tauri側に実装されていないため、一時的にmock実装
    console.warn('search_tasks is not implemented on Tauri side - using mock implementation');
    try {
      // 一時的に空の配列を返す
      return [];
    } catch (error) {
      console.error('Failed to search tasks:', error);
      return [];
    }
  }
}
