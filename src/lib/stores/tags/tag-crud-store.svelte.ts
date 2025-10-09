import type { Tag } from '$lib/types/tag';
import { SvelteDate } from 'svelte/reactivity';
import { dataService } from '$lib/services/data-service';
import { errorHandler } from '../error-handler.svelte';
import { taskStore } from '../tasks.svelte';

/**
 * Tag CRUD operations and backend synchronization
 *
 * Responsibilities:
 * - Create, update, delete tags
 * - Search and query tags
 * - Backend synchronization
 * - Tag validation
 */
export class TagCRUDStore {
  tags = $state<Tag[]>([]);

  // Computed values
  get allTags(): Tag[] {
    return this.tags;
  }

  get tagNames(): string[] {
    return this.tags.map((tag) => tag.name);
  }

  // Actions
  setTags(tags: Tag[]) {
    this.tags = tags;
  }

  // 同期版（既存のテストとの互換性のため）
  addTag(tagData: { name: string; color?: string }): Tag | null {
    const trimmedName = tagData.name.trim();
    if (!trimmedName) {
      return null;
    }

    const existingTag = this.tags.find(
      (tag) => tag.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (existingTag) {
      return existingTag;
    }

    const newTag: Tag = {
      id: crypto.randomUUID(),
      name: trimmedName,
      color: tagData.color,
      createdAt: new SvelteDate(),
      updatedAt: new SvelteDate()
    };

    this.tags.push(newTag);

    // バックエンドに同期は非同期で実行（ファイア&フォーゲット）
    this.syncAddTagToBackend(newTag);

    return newTag;
  }

  // async版（新しいバックエンド連携用）
  async addTagAsync(tagData: { name: string; color?: string }, projectId?: string): Promise<Tag | null> {
    const trimmedName = tagData.name.trim();
    if (!trimmedName) {
      return null;
    }

    const existingTag = this.tags.find(
      (tag) => tag.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (existingTag) {
      return existingTag;
    }

    const newTag: Tag = {
      id: crypto.randomUUID(),
      name: trimmedName,
      color: tagData.color,
      createdAt: new SvelteDate(),
      updatedAt: new SvelteDate()
    };

    // まずローカル状態に追加
    this.tags.push(newTag);

    // バックエンドに同期（作成操作は即座に保存）
    try {
      const pid = projectId || taskStore.selectedProjectId || '';
      await dataService.createTag(pid, { name: trimmedName, color: tagData.color });
    } catch (error) {
      console.error('Failed to sync new tag to backends:', error);
      errorHandler.addSyncError('タグ作成', 'tag', newTag.id, error);
      // エラーが発生した場合はローカル状態から削除
      const tagIndex = this.tags.findIndex((t) => t.id === newTag.id);
      if (tagIndex !== -1) {
        this.tags.splice(tagIndex, 1);
      }
      return null;
    }

    return newTag;
  }

  // プロジェクトIDを指定してタグを追加
  addTagWithProject(tagData: { name: string; color?: string }, projectId: string): Tag | null {
    const trimmedName = tagData.name.trim();
    if (!trimmedName) {
      return null;
    }

    const existingTag = this.tags.find(
      (tag) => tag.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (existingTag) {
      return existingTag;
    }

    const newTag: Tag = {
      id: crypto.randomUUID(),
      name: trimmedName,
      color: tagData.color,
      createdAt: new SvelteDate(),
      updatedAt: new SvelteDate()
    };

    // まずローカル状態に追加
    this.tags.push(newTag);

    // バックエンドに同期（プロジェクトIDを指定）
    this.syncAddTagToBackendWithProject(newTag, projectId);

    return newTag;
  }

  // Add or update tag with existing ID (for sample data initialization)
  addTagWithId(tag: Tag): Tag {
    const existingTag = this.tags.find((t) => t.id === tag.id);
    if (existingTag) {
      // Update existing tag
      Object.assign(existingTag, tag);
      return existingTag;
    }

    // Add new tag
    this.tags.push(tag);
    return tag;
  }

  // 同期版（既存のテストとの互換性のため）
  updateTag(tagId: string, updates: Partial<Tag>, projectId?: string) {
    const tagIndex = this.tags.findIndex((tag) => tag.id === tagId);
    if (tagIndex !== -1) {
      this.tags[tagIndex] = {
        ...this.tags[tagIndex],
        ...updates,
        updatedAt: new SvelteDate()
      };

      // バックエンドに同期は非同期で実行（ファイア&フォーゲット）
      this.syncUpdateTagToBackend(tagId, updates, projectId);

      // Dispatch custom event to notify task store about tag update
      this.notifyTagUpdate(this.tags[tagIndex]);
    }
  }

  // async版（新しいバックエンド連携用）
  async updateTagAsync(tagId: string, updates: Partial<Tag>) {
    const tagIndex = this.tags.findIndex((tag) => tag.id === tagId);
    if (tagIndex !== -1) {
      // バックアップとして元のタグを保持
      const originalTag = { ...this.tags[tagIndex] };

      // まずローカル状態を更新
      this.tags[tagIndex] = {
        ...this.tags[tagIndex],
        ...updates,
        updatedAt: new SvelteDate()
      };

      // バックエンドに同期（更新操作は定期保存に任せる）
      try {
        const projectId = taskStore.selectedProjectId || '';
        await dataService.updateTag(projectId, tagId, updates);
      } catch (error) {
        console.error('Failed to sync tag update to backends:', error);
        errorHandler.addSyncError('タグ更新', 'tag', tagId, error);
        // エラーが発生した場合はローカル状態を復元
        this.tags[tagIndex] = originalTag;
        return;
      }

      // Dispatch custom event to notify task store about tag update
      this.notifyTagUpdate(this.tags[tagIndex]);
    }
  }

  // 同期版（既存のテストとの互換性のため）
  deleteTag(tagId: string, onDelete?: (tagId: string) => void): void {
    const tagIndex = this.tags.findIndex((tag) => tag.id === tagId);
    if (tagIndex !== -1) {
      this.tags.splice(tagIndex, 1);

      // バックエンドに同期は非同期で実行（ファイア&フォーゲット）
      this.syncDeleteTagToBackend(tagId);

      // Call the deletion callback if provided
      onDelete?.(tagId);
    }
  }

  // async版（新しいバックエンド連携用）
  async deleteTagAsync(tagId: string, onDelete?: (tagId: string) => void): Promise<void> {
    const tagIndex = this.tags.findIndex((tag) => tag.id === tagId);
    if (tagIndex !== -1) {
      // バックアップとして削除するタグを保持
      const deletedTag = this.tags[tagIndex];

      // まずローカル状態から削除
      this.tags.splice(tagIndex, 1);

      // バックエンドに同期（削除操作は即座に保存）
      try {
        const projectId = taskStore.selectedProjectId || '';
        await dataService.deleteTag(projectId, tagId);
      } catch (error) {
        console.error('Failed to sync tag deletion to backends:', error);
        errorHandler.addSyncError('タグ削除', 'tag', tagId, error);
        // エラーが発生した場合はローカル状態を復元
        this.tags.splice(tagIndex, 0, deletedTag);
        return;
      }

      // Call the deletion callback if provided
      onDelete?.(tagId);
    }
  }

  // Query methods
  findTagByName(name: string): Tag | undefined {
    return this.tags.find((tag) => tag.name.toLowerCase() === name.toLowerCase());
  }

  searchTags(query: string): Tag[] {
    if (!query.trim()) return this.tags; // Return all tags for empty query

    const lowerQuery = query.toLowerCase();
    return this.tags.filter((tag) => tag.name.toLowerCase().includes(lowerQuery));
  }

  getOrCreateTag(name: string, color?: string): Tag | null {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return null;
    }

    const existingTag = this.findTagByName(trimmedName);
    if (existingTag) {
      return existingTag;
    }

    return this.addTag({ name: trimmedName, color });
  }

  // プロジェクトIDを指定してタグを作成・取得する版
  getOrCreateTagWithProject(name: string, projectId: string, color?: string): Tag | null {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return null;
    }

    const existingTag = this.findTagByName(trimmedName);
    if (existingTag) {
      return existingTag;
    }

    return this.addTagWithProject({ name: trimmedName, color }, projectId);
  }

  // タグIDからプロジェクトIDを取得するヘルパーメソッド
  async getProjectIdByTagId(tagId: string): Promise<string | null> {
    // TaskStoreからタスクを検索してプロジェクトIDを取得
    const { taskStore } = await import('$lib/stores/tasks.svelte');
    return taskStore.getProjectIdByTagId(tagId);
  }

  // Backend sync private methods
  private async syncAddTagToBackend(tag: Tag) {
    try {
      const projectId = taskStore.selectedProjectId || '';
      await dataService.createTag(projectId, { name: tag.name, color: tag.color, order_index: tag.orderIndex });
    } catch (error) {
      console.error('Failed to sync new tag to backends:', error);
      errorHandler.addSyncError('タグ作成', 'tag', tag.id, error);
    }
  }

  private async syncAddTagToBackendWithProject(tag: Tag, projectId: string) {
    try {
      await dataService.createTag(projectId, { name: tag.name, color: tag.color, order_index: tag.orderIndex });
    } catch (error) {
      console.error('Failed to sync new tag to backends:', error);
      errorHandler.addSyncError('タグ作成', 'tag', tag.id, error);
      // エラーが発生した場合はローカル状態から削除
      const tagIndex = this.tags.findIndex((t) => t.id === tag.id);
      if (tagIndex !== -1) {
        this.tags.splice(tagIndex, 1);
      }
    }
  }

  private async syncUpdateTagToBackend(tagId: string, updates: Partial<Tag>, projectId?: string) {
    try {
      const pid = projectId || taskStore.selectedProjectId || '';
      await dataService.updateTag(pid, tagId, updates);
    } catch (error) {
      console.error('Failed to sync tag update to backends:', error);
      errorHandler.addSyncError('タグ更新', 'tag', tagId, error);
    }
  }

  private async syncDeleteTagToBackend(tagId: string) {
    try {
      const projectId = taskStore.selectedProjectId || '';
      await dataService.deleteTag(projectId, tagId);
    } catch (error) {
      console.error('Failed to sync tag deletion to backends:', error);
      errorHandler.addSyncError('タグ削除', 'tag', tagId, error);
    }
  }

  private notifyTagUpdate(tag: Tag) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('tag-updated', {
          detail: tag
        })
      );
    }
  }
}
