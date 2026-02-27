import { invoke } from '@tauri-apps/api/core';
import type { TaskListSearchCondition, TaskList } from '$lib/types/task-list';
import type { TaskListService } from '$lib/infrastructure/backends/tasklist-service';

export class TasklistTauriService implements TaskListService {
  async create(projectId: string, taskList: TaskList, userId: string): Promise<boolean> {
    try {
      // TaskListCommandModel形式でprojectIdを設定（キャメルケース）
      const taskListWithProjectId = { ...taskList, projectId } as Record<string, unknown>;
      delete (taskListWithProjectId as Record<string, unknown>).project_id;
      await invoke('create_task_list', { projectId, taskList: taskListWithProjectId, userId });
      return true;
    } catch (error) {
      console.error('Failed to create task list:', error);
      return false;
    }
  }

  async update(
    projectId: string,
    id: string,
    patch: Partial<TaskList>,
    userId: string
  ): Promise<boolean> {
    try {
      const result = await invoke('update_task_list', { projectId, id, patch, userId });
      return result as boolean;
    } catch (error) {
      console.error('Failed to update task list:', error);
      return false;
    }
  }

  async delete(projectId: string, id: string, userId: string): Promise<boolean> {
    try {
      await invoke('delete_task_list', { projectId, id, userId });
      return true;
    } catch (error) {
      console.error('Failed to delete task list:', error);
      return false;
    }
  }

  async restore(projectId: string, id: string, userId: string): Promise<boolean> {
    try {
      await invoke('restore_task_list', { projectId, id, userId });
      return true;
    } catch (error) {
      console.error('Failed to restore task list:', error);
      return false;
    }
  }

  async get(projectId: string, id: string, userId: string): Promise<TaskList | null> {
    try {
      const result = (await invoke('get_task_list', { projectId, id, userId })) as TaskList | null;
      return result;
    } catch (error) {
      console.error('Failed to get task list:', error);
      return null;
    }
  }

  async search(projectId: string, condition: TaskListSearchCondition): Promise<TaskList[]> {
    try {
      const result = (await invoke('search_task_lists', { projectId, condition })) as TaskList[];
      return result;
    } catch (error) {
      console.error('Failed to search task lists:', error);
      return [];
    }
  }
}
