import { invoke } from '@tauri-apps/api/core';
import type { SubTask } from '$lib/types/sub-task';
import type { SubTaskService } from '../subtask-service';

export class SubtaskTauriService implements SubTaskService {
  async create(projectId: string, subTask: SubTask, userId: string): Promise<boolean> {
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
        tagIds: subTask.tagIds,
        orderIndex: subTask.orderIndex,
        completed: subTask.completed,
        createdAt: subTask.createdAt.toISOString(),
        updatedAt: subTask.updatedAt.toISOString(),
        deleted: subTask.deleted,
        updatedBy: subTask.updatedBy
      };

      await invoke('create_sub_task', { projectId, subTask: subTaskCommandModel, userId });
      return true;
    } catch (error) {
      console.error('Failed to create sub task:', error);
      return false;
    }
  }

  async update(projectId: string, id: string, patch: Partial<SubTask>, userId: string): Promise<boolean> {
    try {
      // Partial<SubTask>からSubtaskCommandModel形式に変換（Date/ISO文字列両対応）
      const toIsoString = (v: unknown): string | undefined => {
        if (!v) return undefined;
        if (v instanceof Date) return v.toISOString();
        if (typeof v === 'string') return v; // 既にISO文字列とみなす
        return undefined;
      };

      const patchRecord = patch as Record<string, unknown>;
      const subtaskPatchCommandModel = {
        ...patch,
        planStartDate: toIsoString(patchRecord.planStartDate ?? patchRecord.plan_start_date),
        planEndDate: toIsoString(patchRecord.planEndDate ?? patchRecord.plan_end_date),
        doStartDate: toIsoString(patchRecord.doStartDate ?? patchRecord.do_start_date),
        doEndDate: toIsoString(patchRecord.doEndDate ?? patchRecord.do_end_date),
        createdAt: toIsoString(patchRecord.createdAt ?? patchRecord.created_at),
        updatedAt: toIsoString(patchRecord.updatedAt ?? patchRecord.updated_at),
        tagIds: patchRecord.tagIds ?? patchRecord.tag_ids,
      } as Partial<SubTask> & {
        planStartDate?: string;
        planEndDate?: string;
        doStartDate?: string;
        doEndDate?: string;
        createdAt?: string;
        updatedAt?: string;
        tagIds?: string[];
      };

      const result = await invoke('update_sub_task', { projectId, id, patch: subtaskPatchCommandModel, userId });
      return result as boolean;
    } catch (error) {
      console.error('Failed to update subtask:', error);
      return false;
    }
  }

  async delete(projectId: string, id: string, userId: string): Promise<boolean> {
    try {
      await invoke('delete_sub_task', { projectId, id, userId });
      return true;
    } catch (error) {
      console.error('Failed to delete sub task:', error);
      return false;
    }
  }

  async get(projectId: string, id: string, userId: string): Promise<SubTask | null> {
    try {
      const result = (await invoke('get_sub_task', { projectId, id, userId })) as SubTask | null;
      return result;
    } catch (error) {
      console.error('Failed to get sub task:', error);
      return null;
    }
  }

  async search(): Promise<SubTask[]> {
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
