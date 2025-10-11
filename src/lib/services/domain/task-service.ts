import type { Task } from '$lib/types/task';
import { resolveBackend } from '$lib/infrastructure/backend-client';
import { errorHandler } from '$lib/stores/error-handler.svelte';

/**
 * タスクドメインサービス
 *
 * 責務:
 * 1. バックエンドへの登録 (resolveBackend経由)
 * 2. タスクCRUD操作
 */
export const TaskService = {
  /**
   * 新しいタスクを作成します
   */
  async createTask(
    listId: string,
    taskData: Omit<Task, 'id' | 'list_id' | 'created_at' | 'updated_at'>
  ): Promise<Task> {
    const newTask: Task = {
      id: crypto.randomUUID(),
      ...taskData,
      listId: listId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const projectId = newTask.projectId;
    if (!projectId) {
      throw new Error('タスクにproject_idが設定されていません。');
    }

    try {
      const backend = await resolveBackend();
      await backend.task.create(projectId, newTask);
      return newTask;
    } catch (error) {
      console.error('Failed to create task:', error);
      errorHandler.addSyncError('タスク作成', 'task', newTask.id, error);
      throw error;
    }
  },

  /**
   * タスクを更新します
   */
  async updateTask(
    projectId: string,
    taskId: string,
    updates: Partial<Task>
  ): Promise<Task | null> {
    const patchData = {
      ...updates,
      plan_start_date: updates.planStartDate?.toISOString() ?? undefined,
      plan_end_date: updates.planEndDate?.toISOString() ?? undefined,
      do_start_date: updates.doStartDate?.toISOString() ?? undefined,
      do_end_date: updates.doEndDate?.toISOString() ?? undefined
    } as Record<string, unknown>;

    if (updates.recurrenceRule !== undefined) {
      patchData.recurrence_rule = updates.recurrenceRule;
    }

    try {
      const backend = await resolveBackend();
      const success = await backend.task.update(projectId, taskId, patchData);
      if (!success) {
        return null;
      }
      return await backend.task.get(projectId, taskId);
    } catch (error) {
      console.error('Failed to update task:', error);
      errorHandler.addSyncError('タスク更新', 'task', taskId, error);
      throw error;
    }
  },

  /**
   * タスクを削除します
   */
  async deleteTask(projectId: string, taskId: string): Promise<boolean> {
    try {
      const backend = await resolveBackend();
      return await backend.task.delete(projectId, taskId);
    } catch (error) {
      console.error('Failed to delete task:', error);
      errorHandler.addSyncError('タスク削除', 'task', taskId, error);
      throw error;
    }
  },

  /**
   * タスクWithSubTasksを作成します（後方互換性）
   */
  async createTaskWithSubTasks(listId: string, task: Task): Promise<void> {
    await this.createTask(listId, task);
  },

  /**
   * タスクWithSubTasksを更新します（後方互換性）
   */
  async updateTaskWithSubTasks(
    projectId: string,
    taskId: string,
    updates: Record<string, unknown>
  ): Promise<void> {
    await this.updateTask(projectId, taskId, updates as Partial<Task>);
  },

  /**
   * タスクWithSubTasksを削除します（後方互換性）
   */
  async deleteTaskWithSubTasks(projectId: string, taskId: string): Promise<boolean> {
    return this.deleteTask(projectId, taskId);
  }
};
