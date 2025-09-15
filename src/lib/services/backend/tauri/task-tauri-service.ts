import { invoke } from '@tauri-apps/api/core';
import type { Task, TaskSearchCondition, TaskPatch } from '$lib/types/task';
import type { TaskService } from '$lib/services/backend/task-service';

export class TaskTauriService implements TaskService {
  async create(projectId: string, task: Task): Promise<boolean> {
    try {
      // TaskCommandModel形式でproject_idを設定
      const taskWithProjectId = { ...task, project_id: projectId };
      await invoke('create_task', { task: taskWithProjectId });
      return true;
    } catch (error) {
      console.error('Failed to create task:', error);
      return false;
    }
  }

  async update(projectId: string, id: string, patch: TaskPatch): Promise<boolean> {
    try {
      const result = await invoke('update_task', { projectId, id, patch });
      return result as boolean;
    } catch (error) {
      console.error('Failed to update task:', error);
      return false;
    }
  }

  async delete(projectId: string, id: string): Promise<boolean> {
    try {
      await invoke('delete_task', { projectId: projectId, id });
      return true;
    } catch (error) {
      console.error('Failed to delete task:', error);
      return false;
    }
  }

  async get(projectId: string, id: string): Promise<Task | null> {
    try {
      const result = (await invoke('get_task', { projectId: projectId, id })) as Task | null;
      return result;
    } catch (error) {
      console.error('Failed to get task:', error);
      return null;
    }
  }

  async search(projectId: string, condition: TaskSearchCondition): Promise<Task[]> {
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
