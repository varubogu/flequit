import { invoke } from '@tauri-apps/api/core';
import type { TaskListSearchCondition } from "$lib/types/task-list";
import type { TaskList } from "$lib/types/task-list";
import type { TaskListService } from '$lib/services/backend/tasklist-service';

export class TasklistTauriService implements TaskListService {
  async create(taskList: TaskList): Promise<boolean> {
    try {
      await invoke('create_task_list', { taskList });
      return true;
    } catch (error) {
      console.error('Failed to create task list:', error);
      return false;
    }
  }

  async update(taskList: TaskList): Promise<boolean> {
    try {
      await invoke('update_task_list', { taskList });
      return true;
    } catch (error) {
      console.error('Failed to update task list:', error);
      return false;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await invoke('delete_task_list', { id });
      return true;
    } catch (error) {
      console.error('Failed to delete task list:', error);
      return false;
    }
  }

  async get(id: string): Promise<TaskList | null> {
    try {
      const result = (await invoke('get_task_list', { id })) as TaskList | null;
      return result;
    } catch (error) {
      console.error('Failed to get task list:', error);
      return null;
    }
  }

  async search(condition: TaskListSearchCondition): Promise<TaskList[]> {
    try {
      const results = (await invoke('search_task_lists', { condition })) as TaskList[];
      return results;
    } catch (error) {
      console.error('Failed to search task lists:', error);
      return [];
    }
  }
}
