import type { Task } from '$lib/types/task';
import { resolveBackend } from '$lib/infrastructure/backend-client';
import { errorHandler } from '$lib/stores/error-handler.svelte';
import { getCurrentUserId } from '$lib/utils/user-id-helper';

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
      updatedAt: new Date(),
      deleted: false,
      updatedBy: getCurrentUserId()
    };

    const projectId = newTask.projectId;
    if (!projectId) {
      throw new Error('タスクにproject_idが設定されていません。');
    }

    try {
      const backend = await resolveBackend();
      await backend.task.create(projectId, newTask, getCurrentUserId());
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
    // TaskWithSubTasksから来る可能性があるため、不要なフィールドを除外
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { subTasks, tags, planStartDate, planEndDate, doStartDate, doEndDate, recurrenceRule, ...taskUpdates } = updates as Record<string, unknown>;

    const patchData: Record<string, unknown> = {
      ...taskUpdates,
      id: taskId // patchにidを含める（Tauriコマンドの要求）
    };

    // 日時フィールドはsnake_caseに変換して追加
    if (planStartDate !== undefined) {
      patchData.plan_start_date = planStartDate?.toISOString() ?? null;
    }
    if (planEndDate !== undefined) {
      patchData.plan_end_date = planEndDate?.toISOString() ?? null;
    }
    if (doStartDate !== undefined) {
      patchData.do_start_date = doStartDate?.toISOString() ?? null;
    }
    if (doEndDate !== undefined) {
      patchData.do_end_date = doEndDate?.toISOString() ?? null;
    }

    try {
      const backend = await resolveBackend();
      const success = await backend.task.update(projectId, taskId, patchData, getCurrentUserId());
      if (!success) {
        return null;
      }
      return await backend.task.get(projectId, taskId, getCurrentUserId());
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
      return await backend.task.delete(projectId, taskId, getCurrentUserId());
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
