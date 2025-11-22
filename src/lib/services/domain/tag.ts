import type { Tag } from '$lib/types/tag';
import { SvelteDate, SvelteSet } from 'svelte/reactivity';
import { resolveBackend } from '$lib/infrastructure/backend-client';
import { tagStore as tagStoreInternal } from '$lib/stores/tags/tag-store.svelte';
import { tagStore as tagStoreFacade } from '$lib/stores/tags.svelte';
import { errorHandler } from '$lib/stores/error-handler.svelte';
import { taskStore } from '$lib/stores/tasks.svelte';
import { getCurrentUserId } from '$lib/utils/user-id-helper';

/**
 * タグドメインサービス
 *
 * 責務:
 * 1. バックエンドへの登録 (resolveBackend経由)
 * 2. Storeへの登録 (tagStoreInternal経由)
 */
export const TagService = {
  /**
   * 新しいタグを作成します
   * - Storeに即座に追加
   * - バックエンドに非同期で同期
   * @param projectId プロジェクトID（必須）
   */
  async createTag(
    projectId: string,
    tagData: { name: string; color?: string }
  ): Promise<Tag | null> {
    const trimmedName = tagData.name.trim();
    if (!trimmedName) {
      return null;
    }

    // 既存タグがあればそれを返す
    const existingTag = tagStoreInternal.findTagByName(trimmedName);
    if (existingTag) {
      return existingTag;
    }

    const newTag: Tag = {
      id: crypto.randomUUID(),
      name: trimmedName,
      color: tagData.color,
      createdAt: new SvelteDate(),
      updatedAt: new SvelteDate(),
      deleted: false,
      updatedBy: getCurrentUserId()
    };

    // 1. Storeに追加
    tagStoreInternal.addTagToStore(newTag);

    // 2. バックエンドに同期
    try {
      const backend = await resolveBackend();
      await backend.tag.create(projectId, newTag, getCurrentUserId());
    } catch (error) {
      console.error('Failed to sync new tag to backend:', error);
      errorHandler.addSyncError('タグ作成', 'tag', newTag.id, error);
      // エラー時はローカル状態から削除
      tagStoreInternal.deleteTagFromStore(newTag.id);
      return null;
    }

    return newTag;
  },

  /**
   * タグを更新します
   * - Storeを即座に更新
   * - バックエンドに非同期で同期
   * @param projectId プロジェクトID（必須）
   */
  async updateTag(
    projectId: string,
    tagId: string,
    updates: Partial<Tag>
  ): Promise<void> {
    const originalTag = tagStoreInternal.findTagById(tagId);
    if (!originalTag) {
      return;
    }

    // バックアップ
    const tagBackup = { ...originalTag };

    // 1. Storeを更新
    tagStoreInternal.updateTagInStore(tagId, updates);

    // 2. バックエンドに同期
    try {
      const backend = await resolveBackend();
      await backend.tag.update(projectId, tagId, {
        ...updates,
        updatedAt: new Date()
      }, getCurrentUserId());

      // 更新通知
      this.notifyTagUpdate(tagStoreInternal.findTagById(tagId)!);
    } catch (error) {
      console.error('Failed to sync tag update to backend:', error);
      errorHandler.addSyncError('タグ更新', 'tag', tagId, error);
      // エラー時は復元
      tagStoreInternal.updateTagInStore(tagId, tagBackup);
    }
  },

  /**
   * タグを削除します
   * - Storeから即座に削除
   * - バックエンドに非同期で同期
   * @param projectId プロジェクトID（必須）
   */
  async deleteTag(
    projectId: string,
    tagId: string,
    onDelete?: (tagId: string) => void
  ): Promise<void> {
    const deletedTag = tagStoreInternal.findTagById(tagId);
    if (!deletedTag) {
      return;
    }

    // バックアップ
    const tagBackup = { ...deletedTag };

    // 1. Storeから削除
    tagStoreInternal.deleteTagFromStore(tagId);

    // 2. バックエンドに同期
    try {
      const backend = await resolveBackend();
      await backend.tag.delete(projectId, tagId, getCurrentUserId());

      // 削除コールバック
      onDelete?.(tagId);
    } catch (error) {
      console.error('Failed to sync tag deletion to backend:', error);
      errorHandler.addSyncError('タグ削除', 'tag', tagId, error);
      // エラー時は復元
      tagStoreInternal.addTagToStore(tagBackup);
    }
  },

  /**
   * タグを取得または作成します
   * @param projectId プロジェクトID（必須）
   */
  async getOrCreateTag(
    projectId: string,
    name: string,
    color?: string
  ): Promise<Tag | null> {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return null;
    }

    const existingTag = tagStoreInternal.findTagByName(trimmedName);
    if (existingTag) {
      return existingTag;
    }

    return this.createTag(projectId, { name: trimmedName, color });
  },

  /**
   * タグIDからプロジェクトIDを取得
   */
  async getProjectIdByTagId(tagId: string): Promise<string | null> {
    const projectId = await taskStore.getProjectIdByTagId(tagId);
    return projectId ?? null;
  },

  /**
   * タグをブックマークに追加
   * @deprecated TagBookmarkServiceを使用してください
   * @param projectId プロジェクトID（必須）
   */
  async addBookmark(projectId: string, tagId: string) {
    // 新しいTagBookmarkServiceに移行
    const { TagBookmarkService } = await import('./tag-bookmark');
    await TagBookmarkService.create(projectId, tagId);
  },

  /**
   * タグをブックマークから削除
   * @deprecated TagBookmarkServiceを使用してください
   * @param projectId プロジェクトID（必須）
   */
  async removeBookmark(projectId: string, tagId: string) {
    // 新しいTagBookmarkServiceに移行
    const { TagBookmarkService } = await import('./tag-bookmark');
    const { tagBookmarkStore } = await import('$lib/stores/tags/tag-bookmark-store.svelte');
    const bookmark = tagBookmarkStore.findBookmarkByTagId(tagId);
    if (bookmark) {
      await TagBookmarkService.delete(bookmark.id, tagId);
    }
  },

  /**
   * タグ更新を通知
   */
  notifyTagUpdate(tag: Tag) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('tag-updated', {
          detail: tag
        })
      );
    }
  }
};
