import { invoke } from '@tauri-apps/api/core';
import type { SubTask, TaskStatus } from '$lib/types/task';
import { convertSubTask, isTauriEnvironment } from './common';

export interface SubTaskService {
  createSubTask: (
    taskId: string,
    subTask: {
      title: string;
      description?: string;
      status?: string;
      priority?: number;
    }
  ) => Promise<SubTask>;
  updateSubTask: (
    subTaskId: string,
    updates: {
      title?: string;
      description?: string;
      status?: string;
      priority?: number;
    }
  ) => Promise<SubTask | null>;
  deleteSubTask: (subTaskId: string) => Promise<boolean>;
}

class TauriSubTaskService implements SubTaskService {
  async createSubTask(
    taskId: string,
    subTask: { title: string; description?: string; status?: string; priority?: number }
  ) {
    const result = await invoke('create_subtask', {
      taskId,
      title: subTask.title,
      description: subTask.description,
      status: subTask.status,
      priority: subTask.priority
    });
    return convertSubTask(result);
  }

  async updateSubTask(
    subTaskId: string,
    updates: { title?: string; description?: string; status?: string; priority?: number }
  ) {
    const result = await invoke('update_subtask', {
      subtaskId: subTaskId,
      title: updates.title,
      description: updates.description,
      status: updates.status,
      priority: updates.priority
    });
    return result ? convertSubTask(result) : null;
  }

  async deleteSubTask(subTaskId: string): Promise<boolean> {
    return await invoke('delete_subtask', { subtaskId: subTaskId });
  }
}

class WebSubTaskService implements SubTaskService {
  async createSubTask(
    taskId: string,
    subTask: { title: string; description?: string; status?: string; priority?: number }
  ) {
    console.log('Web backend: createSubTask not implemented', { taskId, subTask });
    return {
      id: crypto.randomUUID(),
      task_id: taskId,
      title: subTask.title,
      description: subTask.description,
      status: (subTask.status as TaskStatus) || 'not_started',
      priority: subTask.priority,
      start_date: undefined,
      end_date: undefined,
      order_index: 0,
      is_archived: false,
      tags: [],
      created_at: new Date(),
      updated_at: new Date()
    };
  }

  async updateSubTask(
    subTaskId: string,
    updates: { title?: string; description?: string; status?: string; priority?: number }
  ) {
    console.log('Web backend: updateSubTask not implemented', { subTaskId, updates });
    return {
      id: subTaskId,
      task_id: 'dummy-task-id',
      title: updates.title || 'Updated SubTask',
      description: updates.description,
      status: (updates.status as TaskStatus) || 'not_started',
      priority: updates.priority,
      start_date: undefined,
      end_date: undefined,
      order_index: 0,
      is_archived: false,
      tags: [],
      created_at: new Date(),
      updated_at: new Date()
    };
  }

  async deleteSubTask(subTaskId: string) {
    console.log('Web backend: deleteSubTask not implemented', { subTaskId });
    return true;
  }
}

export function createSubTaskService(): SubTaskService {
  return isTauriEnvironment() ? new TauriSubTaskService() : new WebSubTaskService();
}