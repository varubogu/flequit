import { invoke } from '@tauri-apps/api/core';
import type { TagSearchCondition, Tag } from '$lib/types/tag';
import type { TagService } from '$lib/infrastructure/backends/tag-service';

export class TagTauriService implements TagService {
  async create(projectId: string, tag: Tag, userId: string): Promise<boolean> {
    try {
      await invoke('create_tag', { projectId, tag, userId });
      return true;
    } catch (error) {
      console.error('Failed to create tag:', error);
      return false;
    }
  }

  async update(
    projectId: string,
    id: string,
    patch: Partial<Tag>,
    userId: string
  ): Promise<boolean> {
    try {
      const result = await invoke('update_tag', { projectId, tagId: id, patch, userId });
      return result as boolean;
    } catch (error) {
      console.error('Failed to update tag:', error);
      return false;
    }
  }

  async delete(projectId: string, id: string, userId: string): Promise<boolean> {
    try {
      await invoke('delete_tag', { projectId, id, userId });
      return true;
    } catch (error) {
      console.error('Failed to delete tag:', error);
      return false;
    }
  }

  async restore(projectId: string, id: string, userId: string): Promise<boolean> {
    try {
      await invoke('restore_tag', { projectId, id, userId });
      return true;
    } catch (error) {
      console.error('Failed to restore tag:', error);
      return false;
    }
  }

  async get(projectId: string, id: string, userId: string): Promise<Tag | null> {
    try {
      const result = (await invoke('get_tag', { projectId, id, userId })) as Tag | null;
      return result;
    } catch (error) {
      console.error('Failed to get tag:', error);
      return null;
    }
  }

  async search(projectId: string, condition: TagSearchCondition): Promise<Tag[]> {
    try {
      const result = (await invoke('search_tags', { projectId, condition })) as Tag[];
      return result;
    } catch (error) {
      console.error('Failed to search tags:', error);
      return [];
    }
  }
}
