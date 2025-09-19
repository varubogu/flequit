import { invoke } from '@tauri-apps/api/core';
import type { TaggingService } from '$lib/services/backend/tagging-service';
import type { Tag } from '$lib/types/tag';

export class TaggingTauriService implements TaggingService {
  // Task Tag operations
  async createTaskTag(projectId: string, taskId: string, tagName: string): Promise<Tag> {
    try {
      return await invoke('create_task_tag', { projectId, taskId, tagName });
    } catch (error) {
      console.error('Failed to create task tag:', error);
      throw error;
    }
  }

  async deleteTaskTag(projectId: string, taskId: string, tagId: string): Promise<boolean> {
    try {
      await invoke('delete_task_tag', { projectId, taskId, tagId });
      return true;
    } catch (error) {
      console.error('Failed to delete task tag:', error);
      return false;
    }
  }

  // Subtask Tag operations
  async createSubtaskTag(projectId: string, subtaskId: string, tagId: string): Promise<boolean> {
    try {
      const subtaskTag = {
        subtaskId: subtaskId,
        tagId: tagId,
        createdAt: new Date().toISOString()
      };
      await invoke('create_subtask_tag', { projectId, subtaskTag });
      return true;
    } catch (error) {
      console.error('Failed to create subtask tag:', error);
      return false;
    }
  }

  async deleteSubtaskTag(projectId: string, subtaskId: string, tagId: string): Promise<boolean> {
    try {
      await invoke('delete_subtask_tag', { projectId, subtaskId, tagId });
      return true;
    } catch (error) {
      console.error('Failed to delete subtask tag:', error);
      return false;
    }
  }
}
