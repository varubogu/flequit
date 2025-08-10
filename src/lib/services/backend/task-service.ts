import { invoke } from '@tauri-apps/api/core';
import type { Task, TaskListWithTasks, TaskWithSubTasks } from '$lib/types/task';
import { convertTaskList, convertTask, isTauriEnvironment } from './common';

export interface TaskService {
  createTask: (title: string, description: string) => Promise<Task>;
  getTask: (taskId: string) => Promise<Task | null>;
  getAllTasks: () => Promise<Task[]>;
  updateTask: (
    taskId: string,
    title?: string,
    description?: string,
    completed?: boolean
  ) => Promise<Task | null>;
  deleteTask: (taskId: string) => Promise<boolean>;

  createTaskList: (
    projectId: string,
    taskList: { name: string; description?: string; color?: string }
  ) => Promise<TaskListWithTasks>;
  updateTaskList: (
    taskListId: string,
    updates: { name?: string; description?: string; color?: string }
  ) => Promise<TaskListWithTasks | null>;
  deleteTaskList: (taskListId: string) => Promise<boolean>;

  createTaskWithSubTasks: (
    listId: string,
    task: Partial<TaskWithSubTasks>
  ) => Promise<TaskWithSubTasks>;
  updateTaskWithSubTasks: (
    taskId: string,
    updates: Partial<TaskWithSubTasks>
  ) => Promise<TaskWithSubTasks | null>;
  deleteTaskWithSubTasks: (taskId: string) => Promise<boolean>;

  bulkUpdateTasks: (
    updates: Array<{ taskId: string; updates: Partial<TaskWithSubTasks> }>
  ) => Promise<TaskWithSubTasks[]>;
  bulkDeleteTasks: (taskIds: string[]) => Promise<boolean>;
  bulkMoveTasksToList: (taskIds: string[], targetListId: string) => Promise<boolean>;
}

class TauriTaskService implements TaskService {
  async createTask(title: string, description: string): Promise<Task> {
    return await invoke('create_task', { title, description });
  }

  async getTask(taskId: string): Promise<Task | null> {
    return await invoke('get_task', { taskId });
  }

  async getAllTasks(): Promise<Task[]> {
    return await invoke('get_all_tasks');
  }

  async updateTask(
    taskId: string,
    title?: string,
    description?: string,
    completed?: boolean
  ): Promise<Task | null> {
    return await invoke('update_task', { taskId, title, description, completed });
  }

  async deleteTask(taskId: string): Promise<boolean> {
    return await invoke('delete_task', { taskId });
  }

  async createTaskList(
    projectId: string,
    taskList: { name: string; description?: string; color?: string }
  ) {
    const result = await invoke('create_task_list', {
      projectId,
      name: taskList.name,
      description: taskList.description,
      color: taskList.color
    });
    return convertTaskList(result);
  }

  async updateTaskList(
    taskListId: string,
    updates: { name?: string; description?: string; color?: string }
  ) {
    const result = await invoke('update_task_list', {
      taskListId,
      name: updates.name,
      description: updates.description,
      color: updates.color
    });
    return result ? convertTaskList(result) : null;
  }

  async deleteTaskList(taskListId: string): Promise<boolean> {
    return await invoke('delete_task_list', { taskListId });
  }

  async createTaskWithSubTasks(listId: string, task: Partial<TaskWithSubTasks>) {
    const result = await invoke('create_task_with_subtasks', {
      listId,
      title: task.title || '',
      description: task.description,
      status: task.status,
      priority: task.priority,
      startDate: task.start_date?.getTime(),
      endDate: task.end_date?.getTime()
    });
    return convertTask(result);
  }

  async updateTaskWithSubTasks(taskId: string, updates: Partial<TaskWithSubTasks>) {
    const result = await invoke('update_task_with_subtasks', {
      taskId,
      title: updates.title,
      description: updates.description,
      status: updates.status,
      priority: updates.priority,
      startDate: updates.start_date?.getTime(),
      endDate: updates.end_date?.getTime()
    });
    return result ? convertTask(result) : null;
  }

  async deleteTaskWithSubTasks(taskId: string): Promise<boolean> {
    return await invoke('delete_task_with_subtasks', { taskId });
  }

  async bulkUpdateTasks(updates: Array<{ taskId: string; updates: Partial<TaskWithSubTasks> }>) {
    const results = [];
    const errors: Array<{ taskId: string; error: Error }> = [];

    for (const { taskId, updates: taskUpdates } of updates) {
      try {
        const result = await invoke('update_task_with_subtasks', {
          taskId,
          title: taskUpdates.title,
          description: taskUpdates.description,
          status: taskUpdates.status,
          priority: taskUpdates.priority,
          startDate: taskUpdates.start_date?.getTime(),
          endDate: taskUpdates.end_date?.getTime()
        });
        if (result) {
          results.push(convertTask(result));
        }
      } catch (error) {
        console.error(`Failed to update task ${taskId}:`, error);
        errors.push({
          taskId,
          error: error instanceof Error ? error : new Error(String(error))
        });
      }
    }

    if (errors.length > 0) {
      const { errorHandler } = await import('$lib/stores/error-handler.svelte');
      errorHandler.addSyncError(
        '一括タスク更新',
        'bulk_operation',
        `${errors.length}/${updates.length} failed`,
        new Error(`Failed to update ${errors.length} tasks`)
      );
    }

    return results;
  }

  async bulkDeleteTasks(taskIds: string[]) {
    let allSucceeded = true;
    const errors: Array<{ taskId: string; error: Error }> = [];

    for (const taskId of taskIds) {
      try {
        const success = await invoke('delete_task_with_subtasks', { taskId });
        if (!success) {
          allSucceeded = false;
          errors.push({ taskId, error: new Error('Delete operation returned false') });
        }
      } catch (error) {
        console.error(`Failed to delete task ${taskId}:`, error);
        allSucceeded = false;
        errors.push({
          taskId,
          error: error instanceof Error ? error : new Error(String(error))
        });
      }
    }

    if (errors.length > 0) {
      const { errorHandler } = await import('$lib/stores/error-handler.svelte');
      errorHandler.addSyncError(
        '一括タスク削除',
        'bulk_operation',
        `${errors.length}/${taskIds.length} failed`,
        new Error(`Failed to delete ${errors.length} tasks`)
      );
    }

    return allSucceeded;
  }

  async bulkMoveTasksToList(taskIds: string[], targetListId: string): Promise<boolean> {
    try {
      return await invoke('bulk_move_tasks', { taskIds, targetListId });
    } catch (error) {
      console.error('Failed to bulk move tasks:', error);
      return false;
    }
  }
}

class WebTaskService implements TaskService {
  async createTask(title: string, description: string): Promise<Task> {
    console.log('createTask called in web mode', { title, description });
    throw new Error('Not implemented for web mode');
  }

  async getTask(taskId: string): Promise<Task | null> {
    console.log('getTask called in web mode', { taskId });
    throw new Error('Not implemented for web mode');
  }

  async getAllTasks(): Promise<Task[]> {
    console.log('getAllTasks called in web mode');
    throw new Error('Not implemented for web mode');
  }

  async updateTask(
    taskId: string,
    title?: string,
    description?: string,
    completed?: boolean
  ): Promise<Task | null> {
    console.log('updateTask called in web mode', { taskId, title, description, completed });
    throw new Error('Not implemented for web mode');
  }

  async deleteTask(taskId: string): Promise<boolean> {
    console.log('deleteTask called in web mode', { taskId });
    throw new Error('Not implemented for web mode');
  }

  async createTaskList(
    projectId: string,
    taskList: { name: string; description?: string; color?: string }
  ) {
    console.log('Web backend: createTaskList not implemented', { projectId, taskList });
    return {
      id: crypto.randomUUID(),
      name: taskList.name,
      description: taskList.description || '',
      color: taskList.color,
      project_id: projectId,
      order_index: 0,
      is_archived: false,
      created_at: new Date(),
      updated_at: new Date(),
      tasks: []
    };
  }

  async updateTaskList(
    taskListId: string,
    updates: { name?: string; description?: string; color?: string }
  ) {
    console.log('Web backend: updateTaskList not implemented', { taskListId, updates });
    return {
      id: taskListId,
      name: updates.name || 'Updated TaskList',
      description: updates.description || '',
      color: updates.color,
      project_id: 'dummy-project-id',
      order_index: 0,
      is_archived: false,
      created_at: new Date(),
      updated_at: new Date(),
      tasks: []
    };
  }

  async deleteTaskList(taskListId: string) {
    console.log('Web backend: deleteTaskList not implemented', { taskListId });
    return true;
  }

  async createTaskWithSubTasks(listId: string, task: Partial<TaskWithSubTasks>) {
    console.log('Web backend: createTaskWithSubTasks not implemented', { listId, task });
    return {
      id: crypto.randomUUID(),
      title: task.title || '',
      description: task.description,
      status: task.status || 'not_started',
      priority: task.priority || 0,
      list_id: listId,
      order_index: 0,
      is_archived: false,
      created_at: new Date(),
      updated_at: new Date(),
      sub_tasks: [],
      tags: []
    };
  }

  async updateTaskWithSubTasks(taskId: string, updates: Partial<TaskWithSubTasks>) {
    console.log('Web backend: updateTaskWithSubTasks not implemented', { taskId, updates });
    return null;
  }

  async deleteTaskWithSubTasks(taskId: string) {
    console.log('Web backend: deleteTaskWithSubTasks not implemented', { taskId });
    return true;
  }

  async bulkUpdateTasks(updates: Array<{ taskId: string; updates: Partial<TaskWithSubTasks> }>) {
    console.log('Web backend: bulkUpdateTasks not implemented', updates);
    return [];
  }

  async bulkDeleteTasks(taskIds: string[]) {
    console.log('Web backend: bulkDeleteTasks not implemented', taskIds);
    return false;
  }

  async bulkMoveTasksToList(taskIds: string[], targetListId: string) {
    console.log('Web backend: bulkMoveTasksToList not implemented', { taskIds, targetListId });
    return false;
  }
}

export function createTaskService(): TaskService {
  return isTauriEnvironment() ? new TauriTaskService() : new WebTaskService();
}
