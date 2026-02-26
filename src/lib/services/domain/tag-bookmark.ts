import type { TagBookmark } from '$lib/types/tag-bookmark';
import { TagBookmarkBackendService } from '$lib/services/backend/tag-bookmark';
import { tagBookmarkStore } from '$lib/stores/tags/tag-bookmark-store.svelte';
import { errorHandler } from '$lib/stores/error-handler.svelte';
import { accountStore } from '$lib/stores/account-store.svelte';

/**
 * TagBookmarkドメインサービス
 *
 * 責務:
 * 1. バックエンドへの登録 (TagBookmarkBackendService経由)
 * 2. Storeへの登録 (tagBookmarkStore経由)
 */
export const TagBookmarkService = {
  /**
   * ブックマークを作成
   */
  async create(projectId: string, tagId: string): Promise<TagBookmark | null> {
    const userId = accountStore.currentUserId;
    if (!userId) {
      console.error(
        '[TagBookmarkService.create] No current user - account:',
        accountStore.currentAccount
      );
      return null;
    }

    try {
      // 1. バックエンドに作成
      const bookmark = await TagBookmarkBackendService.create({
        userId,
        projectId,
        tagId
      });

      // 2. Storeに追加
      tagBookmarkStore.addBookmark(bookmark);

      return bookmark;
    } catch (error) {
      console.error('[TagBookmarkService.create] Failed to create tag bookmark:', error);
      errorHandler.addSyncError('ブックマーク作成', 'tag_bookmark', tagId, error);
      return null;
    }
  },

  /**
   * プロジェクトのブックマーク一覧を読み込み
   */
  async loadBookmarksByProject(projectId: string): Promise<void> {
    try {
      const bookmarks = await TagBookmarkBackendService.listByProject(projectId);
      tagBookmarkStore.setBookmarks(bookmarks);
    } catch (error) {
      console.error('Failed to load tag bookmarks:', error);
      errorHandler.addSyncError('ブックマーク読み込み', 'tag_bookmark', projectId, error);
    }
  },

  /**
   * ユーザーの全ブックマークを読み込み
   */
  async loadAllBookmarks(): Promise<void> {
    const userId = accountStore.currentUserId;
    if (!userId) {
      console.error(
        '[TagBookmarkService.loadAllBookmarks] No current user - account:',
        accountStore.currentAccount
      );
      return;
    }

    try {
      const bookmarks = await TagBookmarkBackendService.listByUser(userId);
      tagBookmarkStore.setBookmarks(bookmarks);
    } catch (error) {
      console.error(
        '[TagBookmarkService.loadAllBookmarks] Failed to load all tag bookmarks:',
        error
      );
      errorHandler.addSyncError('全ブックマーク読み込み', 'tag_bookmark', 'all', error);
    }
  },

  /**
   * ブックマークを削除
   */
  async delete(bookmarkId: string, tagId: string): Promise<void> {
    // バックアップ
    const bookmark = tagBookmarkStore.findBookmarkById(bookmarkId);
    if (!bookmark) {
      return;
    }

    try {
      // 1. Storeから削除
      tagBookmarkStore.removeBookmark(bookmarkId);

      // 2. バックエンドから削除
      await TagBookmarkBackendService.delete(bookmarkId);
    } catch (error) {
      console.error('Failed to delete tag bookmark:', error);
      errorHandler.addSyncError('ブックマーク削除', 'tag_bookmark', tagId, error);
      // エラー時は復元
      tagBookmarkStore.addBookmark(bookmark);
    }
  },

  /**
   * ブックマークを並び替え
   */
  async reorder(projectId: string, fromIndex: number, toIndex: number): Promise<void> {
    // バックアップ
    const bookmarksBackup = [...tagBookmarkStore.bookmarks];

    try {
      // 1. Storeを更新（楽観的更新）
      tagBookmarkStore.reorderBookmarks(fromIndex, toIndex);

      // 2. バックエンドに同期
      await TagBookmarkBackendService.reorder({
        projectId,
        fromIndex,
        toIndex
      });
    } catch (error) {
      console.error('Failed to reorder tag bookmarks:', error);
      errorHandler.addSyncError('ブックマーク並び替え', 'tag_bookmark', projectId, error);
      // エラー時は復元
      tagBookmarkStore.setBookmarks(bookmarksBackup);
    }
  },

  /**
   * タグがブックマーク済みかチェック
   */
  isBookmarked(tagId: string): boolean {
    return tagBookmarkStore.isBookmarked(tagId);
  },

  /**
   * タグのブックマーク状態をトグル
   */
  async toggleBookmark(projectId: string, tagId: string): Promise<void> {
    const bookmark = tagBookmarkStore.findBookmarkByTagId(tagId);

    if (bookmark) {
      // ブックマーク済みなら削除
      await this.delete(bookmark.id, tagId);
    } else {
      // ブックマークされていなければ作成
      await this.create(projectId, tagId);
    }
  }
};
