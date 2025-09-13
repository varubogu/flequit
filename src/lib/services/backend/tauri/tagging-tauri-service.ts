import { invoke } from '@tauri-apps/api/core';
import type { TaggingService } from '$lib/services/backend/tagging-service';

export class TaggingTauriService implements TaggingService {
  // Task Tag operations
  async createTaskTag(projectId: string, taskId: string, tagId: string): Promise<boolean> {
    try {
      const taskTag = { task_id: taskId, tag_id: tagId };
      await invoke('create_task_tag', { taskTag });
      return true;
    } catch (error) {
      console.error('Failed to create task tag:', error);
      return false;
    }
  }

  async deleteTaskTag(projectId: string, taskId: string, tagId: string): Promise<boolean> {
    try {
      await invoke('delete_task_tag', { task_id: taskId, tag_id: tagId });
      return true;
    } catch (error) {
      console.error('Failed to delete task tag:', error);
      return false;
    }
  }

  // Subtask Tag operations
  async createSubtaskTag(projectId: string, subtaskId: string, tagId: string): Promise<boolean> {
    try {
      const subtaskTag = { subtask_id: subtaskId, tag_id: tagId };
      await invoke('create_subtask_tag', { subtaskTag });
      return true;
    } catch (error) {
      console.error('Failed to create subtask tag:', error);
      return false;
    }
  }

  async deleteSubtaskTag(projectId: string, subtaskId: string, tagId: string): Promise<boolean> {
    try {
      await invoke('delete_subtask_tag', { subtask_id: subtaskId, tag_id: tagId });
      return true;
    } catch (error) {
      console.error('Failed to delete subtask tag:', error);
      return false;
    }
  }
}