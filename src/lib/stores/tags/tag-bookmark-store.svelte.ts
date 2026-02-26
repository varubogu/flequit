import type { TagBookmark } from '$lib/types/tag-bookmark';

/**
 * TagBookmarkストア
 * サイドバーにピン留めされたタグのブックマーク情報を管理
 */
export class TagBookmarkStore {
  bookmarks = $state<TagBookmark[]>([]);

  /**
   * ブックマーク一覧を設定
   */
  setBookmarks(bookmarks: TagBookmark[]) {
    // order_indexでソート
    this.bookmarks = [...bookmarks].sort((a, b) => a.orderIndex - b.orderIndex);
  }

  /**
   * ブックマークを追加
   */
  addBookmark(bookmark: TagBookmark) {
    // 既存のブックマークがないか確認
    if (this.findBookmarkById(bookmark.id)) {
      return;
    }

    this.bookmarks = [...this.bookmarks, bookmark].sort((a, b) => a.orderIndex - b.orderIndex);
  }

  /**
   * ブックマークを削除
   */
  removeBookmark(bookmarkId: string) {
    this.bookmarks = this.bookmarks.filter((b) => b.id !== bookmarkId);
  }

  /**
   * ブックマークを並び替え
   */
  reorderBookmarks(fromIndex: number, toIndex: number) {
    const newBookmarks = [...this.bookmarks];
    const [moved] = newBookmarks.splice(fromIndex, 1);
    newBookmarks.splice(toIndex, 0, moved);

    // order_indexを再設定
    newBookmarks.forEach((bookmark, index) => {
      bookmark.orderIndex = index;
    });

    this.bookmarks = newBookmarks;
  }

  /**
   * IDでブックマークを検索
   */
  findBookmarkById(id: string): TagBookmark | undefined {
    return this.bookmarks.find((b) => b.id === id);
  }

  /**
   * タグIDでブックマークを検索
   */
  findBookmarkByTagId(tagId: string): TagBookmark | undefined {
    return this.bookmarks.find((b) => b.tagId === tagId);
  }

  /**
   * タグがブックマーク済みかチェック
   */
  isBookmarked(tagId: string): boolean {
    return this.bookmarks.some((b) => b.tagId === tagId);
  }

  /**
   * プロジェクトのブックマークを取得
   */
  getBookmarksByProject(projectId: string): TagBookmark[] {
    return this.bookmarks.filter((b) => b.projectId === projectId);
  }

  /**
   * ブックマーク済みのタグID一覧を取得
   */
  get bookmarkedTagIds(): string[] {
    return this.bookmarks.map((b) => b.tagId);
  }

  /**
   * ストアをクリア
   */
  clear() {
    this.bookmarks = [];
  }
}

export const tagBookmarkStore = new TagBookmarkStore();
