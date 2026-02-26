import { invoke } from '@tauri-apps/api/core';
import type {
  TagBookmark,
  CreateTagBookmarkInput,
  UpdateTagBookmarkInput,
  ReorderTagBookmarksInput
} from '$lib/types/tag-bookmark';

/**
 * TagBookmarkバックエンドサービス
 * Tauriコマンド経由でRustバックエンドと通信
 */
export const TagBookmarkBackendService = {
  /**
   * ブックマークを作成
   */
  async create(input: CreateTagBookmarkInput): Promise<TagBookmark> {
    try {
      const result = await invoke<TagBookmark>('create_tag_bookmark', {
        userId: input.userId,
        projectId: input.projectId,
        tagId: input.tagId
      });
      return result;
    } catch (error) {
      console.error('[TagBookmarkBackendService.create] Tauri command failed:', error);
      throw error;
    }
  },

  /**
   * ユーザーとプロジェクトのブックマーク一覧を取得
   */
  async listByProject(projectId: string): Promise<TagBookmark[]> {
    return await invoke('list_tag_bookmarks_by_project', {
      projectId
    });
  },

  /**
   * ユーザーの全ブックマークを取得
   */
  async listByUser(userId: string): Promise<TagBookmark[]> {
    return await invoke('list_tag_bookmarks_by_user', { userId });
  },

  /**
   * ブックマークを更新
   */
  async update(input: UpdateTagBookmarkInput): Promise<void> {
    await invoke('update_tag_bookmark', {
      bookmarkId: input.id,
      orderIndex: input.orderIndex
    });
  },

  /**
   * ブックマークを削除
   */
  async delete(bookmarkId: string): Promise<void> {
    await invoke('delete_tag_bookmark', {
      bookmarkId
    });
  },

  /**
   * タグがブックマーク済みかチェック
   */
  async isBookmarked(projectId: string, tagId: string): Promise<boolean> {
    return await invoke('is_tag_bookmarked', {
      projectId,
      tagId
    });
  },

  /**
   * ブックマークを並び替え
   */
  async reorder(input: ReorderTagBookmarksInput): Promise<void> {
    await invoke('reorder_tag_bookmarks', {
      projectId: input.projectId,
      fromIndex: input.fromIndex,
      toIndex: input.toIndex
    });
  }
};
