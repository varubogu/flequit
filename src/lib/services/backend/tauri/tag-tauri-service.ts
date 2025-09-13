import { invoke } from '@tauri-apps/api/core';
import type { TagSearchCondition, Tag, TagPatch } from '$lib/types/tag';
import type { TagService } from '$lib/services/backend/tag-service';

export class TagTauriService implements TagService {
  async create(projectId: string, tag: Tag): Promise<boolean> {
    try {
      await invoke('create_tag', { project_id: projectId, tag });
      return true;
    } catch (error) {
      console.error('Failed to create tag:', error);
      return false;
    }
  }

  async update(projectId: string, id: string, patch: TagPatch): Promise<boolean> {
    try {
      const result = await invoke('update_tag', { project_id: projectId, id, patch });
      return result as boolean;
    } catch (error) {
      console.error('Failed to update tag:', error);
      return false;
    }
  }

  async delete(projectId: string, id: string): Promise<boolean> {
    try {
      await invoke('delete_tag', { project_id: projectId, id });
      return true;
    } catch (error) {
      console.error('Failed to delete tag:', error);
      return false;
    }
  }

  async get(projectId: string, id: string): Promise<Tag | null> {
    try {
      const result = (await invoke('get_tag', { project_id: projectId, id })) as Tag | null;
      return result;
    } catch (error) {
      console.error('Failed to get tag:', error);
      return null;
    }
  }

  async search(projectId: string, condition: TagSearchCondition): Promise<Tag[]> {
    try {
      const results = (await invoke('search_tags', { project_id: projectId, condition })) as Tag[];
      return results;
    } catch (error) {
      console.error('Failed to search tags:', error);
      return [];
    }
  }
}
