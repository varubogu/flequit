import { invoke } from '@tauri-apps/api/core';
import type { Tag, TagSearchCondition } from '$lib/types/task';
import type { TagService } from '$lib/services/backend/tag-service';

export class TagTauriService implements TagService {
  async create(tag: Tag): Promise<boolean> {
    try {
      await invoke('create_tag', { tag });
      return true;
    } catch (error) {
      console.error('Failed to create tag:', error);
      return false;
    }
  }

  async update(tag: Tag): Promise<boolean> {
    try {
      await invoke('update_tag', { tag });
      return true;
    } catch (error) {
      console.error('Failed to update tag:', error);
      return false;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await invoke('delete_tag', { id });
      return true;
    } catch (error) {
      console.error('Failed to delete tag:', error);
      return false;
    }
  }

  async get(id: string): Promise<Tag | null> {
    try {
      const result = (await invoke('get_tag', { id })) as Tag | null;
      return result;
    } catch (error) {
      console.error('Failed to get tag:', error);
      return null;
    }
  }

  async search(condition: TagSearchCondition): Promise<Tag[]> {
    try {
      const results = (await invoke('search_tags', { condition })) as Tag[];
      return results;
    } catch (error) {
      console.error('Failed to search tags:', error);
      return [];
    }
  }
}
