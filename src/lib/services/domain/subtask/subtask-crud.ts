import type { SubTask } from '$lib/types/sub-task';
import { resolveBackend } from '$lib/infrastructure/backend-client';
import { errorHandler } from '$lib/stores/error-handler.svelte';

/**
 * サブタスクドメインサービス
 *
 * 責務:
 * 1. バックエンドへの登録 (resolveBackend経由)
 * 2. サブタスクCRUD操作
 */
export const SubTaskService = {
  /**
   * 新しいサブタスクを作成します
   */
  async createSubTask(
    projectId: string,
    taskId: string,
    subTaskData: {
      title: string;
      description?: string;
      status?: string;
      priority?: number;
    }
  ): Promise<SubTask> {
    const newSubTask: SubTask = {
      id: crypto.randomUUID(),
      taskId: taskId,
      title: subTaskData.title,
      description: subTaskData.description,
      status:
        (subTaskData.status as
          | 'not_started'
          | 'in_progress'
          | 'waiting'
          | 'completed'
          | 'cancelled') || 'not_started',
      priority: subTaskData.priority,
      orderIndex: 0,
      completed: false,
      assignedUserIds: [],
      tagIds: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      const backend = await resolveBackend();
      await backend.subtask.create(projectId, newSubTask);
      return newSubTask;
    } catch (error) {
      console.error('Failed to create subtask:', error);
      errorHandler.addSyncError('サブタスク作成', 'subtask', newSubTask.id, error);
      throw error;
    }
  },

  /**
   * サブタスクを更新します
   */
  async updateSubTask(
    projectId: string,
    subTaskId: string,
    updates: Partial<SubTask>
  ): Promise<SubTask | null> {
    const patchData = {
      ...updates,
      plan_start_date: updates.planStartDate?.toISOString() ?? undefined,
      plan_end_date: updates.planEndDate?.toISOString() ?? undefined,
      do_start_date: updates.doStartDate?.toISOString() ?? undefined,
      do_end_date: updates.doEndDate?.toISOString() ?? undefined,
      updated_at: new Date()
    } as Record<string, unknown>;

    if (updates.recurrenceRule !== undefined) {
      patchData.recurrence_rule = updates.recurrenceRule;
    }

    try {
      const backend = await resolveBackend();
      const success = await backend.subtask.update(projectId, subTaskId, patchData);
      if (!success) {
        return null;
      }
      return await backend.subtask.get(projectId, subTaskId);
    } catch (error) {
      console.error('Failed to update subtask:', error);
      errorHandler.addSyncError('サブタスク更新', 'subtask', subTaskId, error);
      throw error;
    }
  },

  /**
   * サブタスクを削除します
   */
  async deleteSubTask(projectId: string, subTaskId: string): Promise<boolean> {
    try {
      const backend = await resolveBackend();
      return await backend.subtask.delete(projectId, subTaskId);
    } catch (error) {
      console.error('Failed to delete subtask:', error);
      errorHandler.addSyncError('サブタスク削除', 'subtask', subTaskId, error);
      throw error;
    }
  },

  /**
   * @deprecated Use tasks.svelte.ts addTagToSubTask instead
   */
  async addTagToSubTask(projectId: string, subTaskId: string, tagId: string): Promise<void> {
    try {
      const backend = await resolveBackend();
      const subTask = await backend.subtask.get(projectId, subTaskId);
      const tag = await backend.tag.get(projectId, tagId);

      if (!subTask || !tag) {
        console.warn('addTagToSubTask is deprecated and requires existing entities.');
        return;
      }

      console.warn('addTagToSubTask is deprecated, use tasks.svelte.ts addTagToSubTask instead');
    } catch (error) {
      console.error('Failed to add tag to subtask:', error);
      errorHandler.addSyncError('サブタスクタグ追加', 'subtask', subTaskId, error);
    }
  },

  /**
   * @deprecated Use tasks.svelte.ts removeTagFromSubTask instead
   */
  async removeTagFromSubTask(projectId: string, subTaskId: string, _tagId: string): Promise<void> {
    void _tagId;
    try {
      const backend = await resolveBackend();
      const subTask = await backend.subtask.get(projectId, subTaskId);
      if (!subTask) {
        console.warn('removeTagFromSubTask is deprecated and subtask not found.');
        return;
      }
      console.warn('removeTagFromSubTask is deprecated, use tasks.svelte.ts removeTagFromSubTask instead');
    } catch (error) {
      console.error('Failed to remove tag from subtask:', error);
      errorHandler.addSyncError('サブタスクタグ削除', 'subtask', subTaskId, error);
    }
  }
};
