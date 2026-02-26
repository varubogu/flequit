/* eslint-disable no-restricted-imports -- TODO [計画02]: フロントエンド層方針の再定義と移行で対応予定。期限: 2026-04-30 */
import type { Tag } from '$lib/types/tag';
import { SvelteDate } from 'svelte/reactivity';
import { tagStore as tagStoreInternal } from '$lib/stores/tags/tag-store.svelte';
import { TagService } from '$lib/services/domain/tag';
import { getCurrentUserId } from '$lib/services/domain/current-user-id';

/**
 * タグのCRUD操作
 *
 * 責務: タグの作成、更新、削除
 */
export class TagMutations {
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
      updatedBy: getCurrentUserId()
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

    return TagService.createTag(projectId, tagData);
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

    return TagService.updateTag(projectId, tagId, updates);
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

    return TagService.deleteTag(projectId, tagId, onDelete);
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

    return TagService.deleteTag(projectId, tagId, onDelete);
  }

  /**
   * タグを取得または作成
   */
  async getOrCreateTag(name: string, projectId?: string, color?: string): Promise<Tag | null> {
    if (!projectId) {
      return this.createLocalTag({ name, color });
    }

    return TagService.getOrCreateTag(projectId, name, color);
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
