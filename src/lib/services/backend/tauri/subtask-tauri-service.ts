import { invoke } from '@tauri-apps/api/core';
import type { SubTaskSearchCondition, SubTask } from '$lib/types/sub-task';
import type { SubTaskService } from '$lib/services/backend/subtask-service';

export class SubtaskTauriService implements SubTaskService {
  async create(projectId: string, subTask: SubTask): Promise<boolean> {
    try {
      // SubTaskからSubtaskCommandModel形式に変換
      const subTaskCommand = {
        id: subTask.id,
        task_id: subTask.task_id,
        title: subTask.title,
        description: subTask.description,
        status: subTask.status,
        priority: subTask.priority,
        plan_start_date: subTask.plan_start_date?.toISOString(),
        plan_end_date: subTask.plan_end_date?.toISOString(),
        do_start_date: subTask.do_start_date?.toISOString(),
        do_end_date: subTask.do_end_date?.toISOString(),
        is_range_date: subTask.is_range_date,
        recurrence_rule: subTask.recurrence_rule,
        assigned_user_ids: subTask.assigned_user_ids,
        tag_ids: subTask.tags.map(tag => tag.id), // Tag[] -> string[]
        order_index: subTask.order_index,
        completed: subTask.completed,
        created_at: subTask.created_at.toISOString(),
        updated_at: subTask.updated_at.toISOString(),
      };
      
      await invoke('create_sub_task', { projectId, subTask: subTaskCommand });
      return true;
    } catch (error) {
      console.error('Failed to create sub task:', error);
      return false;
    }
  }

  async update(projectId: string, id: string, patch: Partial<SubTask>): Promise<boolean> {
    try {
      // Partial<SubTask>からSubtaskCommandModel形式に変換
      const patchCommand: any = {
        ...patch,
        plan_start_date: patch.plan_start_date?.toISOString(),
        plan_end_date: patch.plan_end_date?.toISOString(),
        do_start_date: patch.do_start_date?.toISOString(),
        do_end_date: patch.do_end_date?.toISOString(),
        created_at: patch.created_at?.toISOString(),
        updated_at: patch.updated_at?.toISOString(),
        tag_ids: patch.tags?.map(tag => tag.id), // Tag[] -> string[]
      };
      
      // tagsフィールドを削除（tag_idsに変換済み）
      delete patchCommand.tags;
      
      const result = await invoke('update_sub_task', { projectId, id, patch: patchCommand });
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
