import { invoke } from '@tauri-apps/api/core';
import type { Tag } from '$lib/types/task';
import { convertTag, isTauriEnvironment } from './common';

export interface TagService {
  createTag: (tag: { name: string; color?: string }) => Promise<Tag>;
  updateTag: (tagId: string, updates: { name?: string; color?: string }) => Promise<Tag | null>;
  deleteTag: (tagId: string) => Promise<boolean>;
  getAllTags: () => Promise<Tag[]>;
  addTagToTask: (taskId: string, tagId: string) => Promise<boolean>;
  removeTagFromTask: (taskId: string, tagId: string) => Promise<boolean>;
  addTagToSubTask: (subTaskId: string, tagId: string) => Promise<boolean>;
  removeTagFromSubTask: (subTaskId: string, tagId: string) => Promise<boolean>;
}

class TauriTagService implements TagService {
  async createTag(tag: { name: string; color?: string }) {
    const result = await invoke('create_tag', {
      name: tag.name,
      color: tag.color
    });
    return convertTag(result);
  }

  async updateTag(tagId: string, updates: { name?: string; color?: string }) {
    const result = await invoke('update_tag', {
      tagId,
      name: updates.name,
      color: updates.color
    });
    return result ? convertTag(result) : null;
  }

  async deleteTag(tagId: string): Promise<boolean> {
    return await invoke('delete_tag', { tagId });
  }

  async getAllTags() {
    const result = await invoke('get_all_tags');
    return (result as unknown[]).map(convertTag);
  }

  async addTagToTask(taskId: string, tagId: string): Promise<boolean> {
    return await invoke('add_tag_to_task', { taskId, tagId });
  }

  async removeTagFromTask(taskId: string, tagId: string): Promise<boolean> {
    return await invoke('remove_tag_from_task', { taskId, tagId });
  }

  async addTagToSubTask(subTaskId: string, tagId: string): Promise<boolean> {
    return await invoke('add_tag_to_subtask', { subtaskId: subTaskId, tagId });
  }

  async removeTagFromSubTask(subTaskId: string, tagId: string): Promise<boolean> {
    return await invoke('remove_tag_from_subtask', { subtaskId: subTaskId, tagId });
  }
}

class WebTagService implements TagService {
  async createTag(tag: { name: string; color?: string }) {
    console.log('Web backend: createTag not implemented', tag);
    return {
      id: crypto.randomUUID(),
      name: tag.name,
      color: tag.color,
      created_at: new Date(),
      updated_at: new Date()
    };
  }

  async updateTag(tagId: string, updates: { name?: string; color?: string }) {
    console.log('Web backend: updateTag not implemented', { tagId, updates });
    return {
      id: tagId,
      name: updates.name || 'Updated Tag',
      color: updates.color,
      created_at: new Date(),
      updated_at: new Date()
    };
  }

  async deleteTag(tagId: string) {
    console.log('Web backend: deleteTag not implemented', { tagId });
    return true;
  }

  async getAllTags() {
    console.log('Web backend: getAllTags not implemented');
    return [];
  }

  async addTagToTask(taskId: string, tagId: string) {
    console.log('Web backend: addTagToTask not implemented', { taskId, tagId });
    return true;
  }

  async removeTagFromTask(taskId: string, tagId: string) {
    console.log('Web backend: removeTagFromTask not implemented', { taskId, tagId });
    return true;
  }

  async addTagToSubTask(subTaskId: string, tagId: string) {
    console.log('Web backend: addTagToSubTask not implemented', { subTaskId, tagId });
    return true;
  }

  async removeTagFromSubTask(subTaskId: string, tagId: string) {
    console.log('Web backend: removeTagFromSubTask not implemented', { subTaskId, tagId });
    return true;
  }
}

export function createTagService(): TagService {
  return isTauriEnvironment() ? new TauriTagService() : new WebTagService();
}
