import type { Tag } from '$lib/types/tag';
import { tagStore as tagStoreInternal } from '$lib/stores/tags/tag-store.svelte';
import { tagBookmarkStore } from '$lib/stores/tags/tag-bookmark-store.svelte';
import {
  resolveTagBookmarkGateway,
  resolveTagGateway,
  type TagBookmarkGateway,
  type TagGateway
} from '$lib/dependencies/tag';

/**
 * タグのブックマーク操作
 *
 * 責務: ブックマークの追加、削除、並び替え
 */
export class TagBookmarkOperations {
  private readonly tagGateway: TagGateway;
  private readonly tagBookmarkGateway: TagBookmarkGateway;

  constructor(
    private bookmarkStore: typeof tagBookmarkStore,
    tagGateway: TagGateway = resolveTagGateway(),
    tagBookmarkGateway: TagBookmarkGateway = resolveTagBookmarkGateway()
  ) {
    this.tagGateway = tagGateway;
    this.tagBookmarkGateway = tagBookmarkGateway;
  }

  /**
   * ブックマーク済みタグのリストを取得
   */
  get bookmarkedTagList(): Tag[] {
    const bookmarkedTagIds = this.bookmarkStore.bookmarkedTagIds;
    return tagStoreInternal.tags.filter((tag) => bookmarkedTagIds.includes(tag.id));
  }

  /**
   * ブックマークのトグル
   */
  async toggleBookmark(tagId: string) {
    const projectId = await this.tagGateway.getProjectIdByTagId(tagId);
    if (!projectId) {
      console.error('Project ID not found for tag:', tagId);
      return;
    }
    await this.tagBookmarkGateway.toggleBookmark(projectId, tagId);
  }

  /**
   * ブックマーク状態を確認
   */
  isBookmarked(tagId: string): boolean {
    return this.bookmarkStore.isBookmarked(tagId);
  }

  /**
   * ブックマークを追加
   */
  async addBookmark(tagId: string) {
    const projectId = await this.tagGateway.getProjectIdByTagId(tagId);
    if (!projectId) {
      console.error('Project ID not found for tag:', tagId);
      return;
    }
    await this.tagBookmarkGateway.create(projectId, tagId);
  }

  /**
   * 初期化用にブックマークを設定（非推奨）
   * @deprecated TagBookmarkService.loadBookmarksByProject を使用してください
   */
  setBookmarkForInitialization(tagId: string) {
    void tagId;
    // この機能は廃止されました
    console.warn(
      'setBookmarkForInitialization is deprecated. Use TagBookmarkService.loadBookmarksByProject instead.'
    );
  }

  /**
   * ブックマークを削除
   */
  async removeBookmark(tagId: string) {
    const bookmark = this.bookmarkStore.findBookmarkByTagId(tagId);
    if (!bookmark) {
      console.error('Bookmark not found for tag:', tagId);
      return;
    }
    await this.tagBookmarkGateway.delete(bookmark.id, tagId);
  }

  /**
   * ブックマーク済みタグを並び替え
   */
  async reorderBookmarkedTags(fromIndex: number, toIndex: number) {
    const projectId = await this.getProjectIdFromFirstBookmark();
    if (!projectId) return;

    await this.tagBookmarkGateway.reorder(projectId, fromIndex, toIndex);
  }

  /**
   * ブックマーク済みタグを指定位置に移動
   */
  async moveBookmarkedTagToPosition(tagId: string, targetIndex: number) {
    // reorderを使って実装
    const currentIndex = this.bookmarkedTagList.findIndex((tag) => tag.id === tagId);
    if (currentIndex === -1 || currentIndex === targetIndex) return;

    await this.reorderBookmarkedTags(currentIndex, targetIndex);
  }

  /**
   * タグの順序インデックスを初期化（非推奨）
   * @deprecated ブックマークの順序はorder_indexで自動管理されます
   */
  async initializeTagOrderIndices() {
    console.warn(
      'initializeTagOrderIndices is deprecated. Order is managed by TagBookmark.orderIndex.'
    );
  }

  /**
   * 最初のブックマークからプロジェクトIDを取得
   */
  private async getProjectIdFromFirstBookmark(): Promise<string | null> {
    const firstBookmark = this.bookmarkStore.bookmarks[0];
    if (!firstBookmark) return null;
    return firstBookmark.projectId;
  }
}
