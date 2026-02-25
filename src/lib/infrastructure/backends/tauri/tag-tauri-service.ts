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

  async update(projectId: string, id: string, patch: Partial<Tag>, userId: string): Promise<boolean> {
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async search(_projectId: string, _condition: TagSearchCondition): Promise<Tag[]> {
    try {
      // TODO: search_tags コマンドが Tauri側に実装されていないため、一時的にmock実装
      console.warn('search_tags is not implemented on Tauri side - using mock implementation');
      return [];
    } catch (error) {
      console.error('Failed to search tags:', error);
      return [];
    }
  }
}
