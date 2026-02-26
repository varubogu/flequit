import type { Tag } from '$lib/types/tag';
import { SvelteDate } from 'svelte/reactivity';
import { tagStore as tagStoreInternal } from '$lib/stores/tags/tag-store.svelte';
import { resolveCurrentUserIdProvider, type CurrentUserIdProvider } from '$lib/dependencies/current-user-id';
import { resolveTagGateway, type TagGateway } from '$lib/dependencies/tag';

/**
 * タグのCRUD操作
 *
 * 責務: タグの作成、更新、削除
 */
export class TagMutations {
  private readonly getCurrentUserId: CurrentUserIdProvider;
  private readonly tagGateway: TagGateway;

  constructor(
    tagGateway: TagGateway = resolveTagGateway(),
    getCurrentUserId: CurrentUserIdProvider = resolveCurrentUserIdProvider()
  ) {
    this.tagGateway = tagGateway;
    this.getCurrentUserId = getCurrentUserId;
  }

  /**
   * ローカルタグを作成
   */
  createLocalTag(tagData: { name: string; color?: string }): Tag | null {
    const trimmedName = tagData.name.trim();
    if (!trimmedName) {
      return null;
    }

    const existing = tagStoreInternal.findTagByName(trimmedName);
    if (existing) {
      return existing;
    }

    const now = new SvelteDate();
    const newTag: Tag = {
      id: crypto.randomUUID(),
      name: trimmedName,
      color: tagData.color,
      createdAt: now,
      updatedAt: now,
      deleted: false,
      updatedBy: this.getCurrentUserId()
    };

    return tagStoreInternal.addTagWithId(newTag);
  }

  /**
   * タグを追加
   */
  async addTag(tagData: { name: string; color?: string }, projectId?: string): Promise<Tag | null> {
    if (!projectId) {
      return this.createLocalTag(tagData);
    }

    return this.tagGateway.createTag(projectId, tagData);
  }

  /**
   * タグを追加（非同期版）
   */
  async addTagAsync(
    tagData: { name: string; color?: string },
    projectId?: string
  ): Promise<Tag | null> {
    return this.addTag(tagData, projectId);
  }

  /**
   * プロジェクト指定でタグを追加
   */
  async addTagWithProject(
    tagData: { name: string; color?: string },
    projectId: string
  ): Promise<Tag | null> {
    return this.addTag(tagData, projectId);
  }

  /**
   * IDを指定してタグを追加
   */
  addTagWithId(tag: Tag): Tag {
    return tagStoreInternal.addTagWithId(tag);
  }

  /**
   * タグを更新
   */
  async updateTag(tagId: string, updates: Partial<Tag>, projectId?: string): Promise<void> {
    if (!projectId) {
      tagStoreInternal.updateTagInStore(tagId, updates);
      return;
    }

    return this.tagGateway.updateTag(projectId, tagId, updates);
  }

  /**
   * タグを更新（非同期版）
   */
  async updateTagAsync(tagId: string, updates: Partial<Tag>, projectId?: string): Promise<void> {
    return this.updateTag(tagId, updates, projectId);
  }

  /**
   * タグを削除
   */
  async deleteTag(
    tagId: string,
    projectId?: string,
    onDelete?: (tagId: string) => void
  ): Promise<void> {
    if (!projectId) {
      tagStoreInternal.deleteTagFromStore(tagId);
      onDelete?.(tagId);
      return;
    }

    return this.tagGateway.deleteTag(projectId, tagId, onDelete);
  }

  /**
   * タグを削除（非同期版）
   */
  async deleteTagAsync(
    tagId: string,
    projectId?: string,
    onDelete?: (tagId: string) => void
  ): Promise<void> {
    if (!projectId) {
      tagStoreInternal.deleteTagFromStore(tagId);
      onDelete?.(tagId);
      return;
    }

    return this.tagGateway.deleteTag(projectId, tagId, onDelete);
  }

  /**
   * タグを取得または作成
   */
  async getOrCreateTag(name: string, projectId?: string, color?: string): Promise<Tag | null> {
    if (!projectId) {
      return this.createLocalTag({ name, color });
    }

    return this.tagGateway.getOrCreateTag(projectId, name, color);
  }

  /**
   * プロジェクト指定でタグを取得または作成
   */
  async getOrCreateTagWithProject(
    name: string,
    projectId: string,
    color?: string
  ): Promise<Tag | null> {
    return this.getOrCreateTag(name, projectId, color);
  }
}
