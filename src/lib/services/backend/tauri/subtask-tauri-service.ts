import { invoke } from '@tauri-apps/api/core';
import type { SubTaskSearchCondition, SubTask, SubTaskWithTags } from '$lib/types/sub-task';
import type { SubTaskService } from '$lib/services/backend/subtask-service';

export class SubtaskTauriService implements SubTaskService {
  async create(projectId: string, subTask: SubTaskWithTags): Promise<boolean> {
    try {
      // SubTaskからSubtaskCommandModel形式に変換
      const subTaskCommandModel = {
        id: subTask.id,
        taskId: subTask.taskId,
        title: subTask.title,
        description: subTask.description,
        status: subTask.status,
        priority: subTask.priority,
        planStartDate: subTask.planStartDate?.toISOString(),
        planEndDate: subTask.planEndDate?.toISOString(),
        doStartDate: subTask.doStartDate?.toISOString(),
        doEndDate: subTask.doEndDate?.toISOString(),
        isRangeDate: subTask.isRangeDate,
        recurrenceRule: subTask.recurrenceRule,
        assignedUserIds: subTask.assignedUserIds,
        tagIds: subTask.tags.map(tag => tag.id), // Tag[] -> string[]
        orderIndex: subTask.orderIndex,
        completed: subTask.completed,
        createdAt: subTask.createdAt.toISOString(),
        updatedAt: subTask.updatedAt.toISOString(),
      };

      await invoke('create_sub_task', { projectId, subTask: subTaskCommandModel });
      return true;
    } catch (error) {
      console.error('Failed to create sub task:', error);
      return false;
    }
  }

  async update(projectId: string, id: string, patch: Partial<SubTaskWithTags>): Promise<boolean> {
    try {
      // Partial<SubTask>からSubtaskCommandModel形式に変換
      const subtaskPatchCommandModel = {
        ...patch,
        planStartDate: patch.planStartDate?.toISOString(),
        planEndDate: patch.planEndDate?.toISOString(),
        doStartDate: patch.doStartDate?.toISOString(),
        doEndDate: patch.doEndDate?.toISOString(),
        createdAt: patch.createdAt?.toISOString(),
        updatedAt: patch.updatedAt?.toISOString(),
        tagIds: patch.tags?.map(tag => tag.id), // Tag[] -> string[]
      };

      // tagsフィールドを削除（tag_idsに変換済み）
      delete (subtaskPatchCommandModel as any).tags;

      const result = await invoke('update_sub_task', { projectId, id, patch: subtaskPatchCommandModel });
      return result as boolean;
    } catch (error) {
      console.error('Failed to update subtask:', error);
      return false;
    }
  }

  async delete(projectId: string, id: string): Promise<boolean> {
    try {
      await invoke('delete_sub_task', { projectId, id });
      return true;
    } catch (error) {
      console.error('Failed to delete sub task:', error);
      return false;
    }
  }

  async get(projectId: string, id: string): Promise<SubTask | null> {
    try {
      const result = (await invoke('get_sub_task', { projectId, id })) as SubTask | null;
      return result;
    } catch (error) {
      console.error('Failed to get sub task:', error);
      return null;
    }
  }

  async search(projectId: string, condition: SubTaskSearchCondition): Promise<SubTask[]> {
    // TODO: search_sub_tasks コマンドが Tauri側に実装されていないため、一時的にmock実装
    console.warn('search_sub_tasks is not implemented on Tauri side - using mock implementation');
    try {
      // 一時的に空の配列を返す
      return [];
    } catch (error) {
      console.error('Failed to search sub tasks:', error);
      return [];
    }
  }
}
