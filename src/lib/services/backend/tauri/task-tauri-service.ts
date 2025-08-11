import { invoke } from '@tauri-apps/api/core';
import type { Task, TaskSearchCondition } from '$lib/types/task';
import type { TaskService } from '$lib/services/backend/task-service';

export class TauriTaskService implements TaskService {
  async create(task: Task): Promise<boolean> {
    try {
      await invoke('create_task', { task });
      return true;
    } catch (error) {
      console.error('Failed to create task:', error);
      return false;
    }
  }

  async update(task: Task): Promise<boolean> {
    try {
      await invoke('update_task', { task });
      return true;
    } catch (error) {
      console.error('Failed to update task:', error);
      return false;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await invoke('delete_task', { id });
      return true;
    } catch (error) {
      console.error('Failed to delete task:', error);
      return false;
    }
  }

  async get(id: string): Promise<Task | null> {
    try {
      const result = (await invoke('get_task', { id })) as Task | null;
      return result;
    } catch (error) {
      console.error('Failed to get task:', error);
      return null;
    }
  }

  async search(condition: TaskSearchCondition): Promise<Task[]> {
    try {
      const results = (await invoke('search_tasks', { condition })) as Task[];
      return results;
    } catch (error) {
      console.error('Failed to search tasks:', error);
      return [];
    }
  }
}
