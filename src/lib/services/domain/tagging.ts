import type { Tag } from '$lib/types/tag';
import { resolveBackend } from '$lib/infrastructure/backend-client';
import { getCurrentUserId } from '$lib/utils/user-id-helper';

export const TaggingService = {
  async createTaskTag(projectId: string, taskId: string, name: string): Promise<Tag> {
    const backend = await resolveBackend();
    return backend.tagging.createTaskTag(projectId, taskId, name, getCurrentUserId());
  },

  async deleteTaskTag(projectId: string, taskId: string, tagId: string): Promise<void> {
    const backend = await resolveBackend();
    await backend.tagging.deleteTaskTag(projectId, taskId, tagId, getCurrentUserId());
  },

  async createSubtaskTag(projectId: string, subTaskId: string, name: string): Promise<Tag> {
    const backend = await resolveBackend();
    return backend.tagging.createSubtaskTag(projectId, subTaskId, name, getCurrentUserId());
  },

  async deleteSubtaskTag(projectId: string, subTaskId: string, tagId: string): Promise<void> {
    const backend = await resolveBackend();
    await backend.tagging.deleteSubtaskTag(projectId, subTaskId, tagId, getCurrentUserId());
  }
};
