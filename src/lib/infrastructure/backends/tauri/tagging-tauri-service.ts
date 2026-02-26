import { invoke } from '@tauri-apps/api/core';
import type { TaggingService } from '$lib/infrastructure/backends/tagging-service';
import type { Tag } from '$lib/types/tag';

export class TaggingTauriService implements TaggingService {
  // Task Tag operations
  async createTaskTag(
    projectId: string,
    taskId: string,
    tagName: string,
    userId: string
  ): Promise<Tag> {
    try {
      return await invoke('create_task_tag', { projectId, taskId, tagName, userId });
    } catch (error) {
      console.error('Failed to create task tag:', error);
      throw error;
    }
  }

  async deleteTaskTag(
    projectId: string,
    taskId: string,
    tagId: string,
    userId: string
  ): Promise<boolean> {
    try {
      await invoke('delete_task_tag', { projectId, taskId, tagId, userId });
      return true;
    } catch (error) {
      console.error('Failed to delete task tag:', error);
      return false;
    }
  }

  // Subtask Tag operations
  async createSubtaskTag(
    projectId: string,
    subtaskId: string,
    tagName: string,
    userId: string
  ): Promise<Tag> {
    try {
      return await invoke('create_subtask_tag', { projectId, subtaskId, tagName, userId });
    } catch (error) {
      console.error('Failed to create subtask tag:', error);
      throw error;
    }
  }

  async deleteSubtaskTag(
    projectId: string,
    subtaskId: string,
    tagId: string,
    userId: string
  ): Promise<boolean> {
    try {
      await invoke('delete_subtask_tag', { projectId, subtaskId, tagId, userId });
      return true;
    } catch (error) {
      console.error('Failed to delete subtask tag:', error);
      return false;
    }
  }
}
