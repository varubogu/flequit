import type { Tag } from '$lib/types/tag';
import { SvelteSet } from 'svelte/reactivity';

/**
 * Tag bookmark management and reordering
 *
 * Responsibilities:
 * - Bookmark toggle and state management
 * - Drag & drop reordering of bookmarked tags
 * - Order index management
 */
export class TagBookmarkStore {
  bookmarkedTags = $state<SvelteSet<string>>(new SvelteSet());

  // Computed values
  getBookmarkedTagList(allTags: Tag[]): Tag[] {
    // Explicitly access both reactive properties to ensure reactivity
    const tags = allTags;
    const bookmarked = this.bookmarkedTags;
    return tags
      .filter((tag) => bookmarked.has(tag.id))
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
  }

  // Bookmark management methods
  toggleBookmark(tagId: string) {
    const newBookmarks = new SvelteSet(this.bookmarkedTags);
    if (newBookmarks.has(tagId)) {
      newBookmarks.delete(tagId);
    } else {
      newBookmarks.add(tagId);
    }
    this.bookmarkedTags = newBookmarks;
  }

  isBookmarked(tagId: string): boolean {
    return this.bookmarkedTags.has(tagId);
  }

  addBookmark(tagId: string, allTags: Tag[], updateTagCallback: (tagId: string, updates: Partial<Tag>) => void) {
    const newBookmarks = new SvelteSet(this.bookmarkedTags);
    newBookmarks.add(tagId);
    this.bookmarkedTags = newBookmarks;

    // 新しくブックマークされたタグにorder_indexを設定
    const tag = allTags.find((t) => t.id === tagId);
    if (tag && tag.orderIndex === undefined) {
      const currentBookmarkedTags = this.getBookmarkedTagList(allTags);
      updateTagCallback(tagId, { orderIndex: currentBookmarkedTags.length - 1 });
    }
  }

  // 初期化専用：ストア状態の設定のみでバックエンド更新は行わない
  setBookmarkForInitialization(tagId: string, allTags: Tag[]) {
    const newBookmarks = new SvelteSet(this.bookmarkedTags);
    newBookmarks.add(tagId);
    this.bookmarkedTags = newBookmarks;

    // 初期化時はorder_indexもローカルで設定するのみ
    const tag = allTags.find((t) => t.id === tagId);
    if (tag && tag.orderIndex === undefined) {
      const currentBookmarkedTags = allTags.filter((t) => newBookmarks.has(t.id));
      tag.orderIndex = currentBookmarkedTags.length - 1;
    }
  }

  removeBookmark(tagId: string) {
    const newBookmarks = new SvelteSet(this.bookmarkedTags);
    newBookmarks.delete(tagId);
    this.bookmarkedTags = newBookmarks;
  }

  // Drag & Drop methods for bookmarked tags
  reorderBookmarkedTags(
    allTags: Tag[],
    fromIndex: number,
    toIndex: number,
    updateTagCallback: (tagId: string, updates: Partial<Tag>) => void
  ) {
    const bookmarkedTags = this.getBookmarkedTagList(allTags);

    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= bookmarkedTags.length ||
      toIndex >= bookmarkedTags.length
    ) {
      return;
    }

    // ブックマークされたタグの並び順を変更
    const [movedTag] = bookmarkedTags.splice(fromIndex, 1);
    bookmarkedTags.splice(toIndex, 0, movedTag);

    // order_indexを更新
    bookmarkedTags.forEach((tag, index) => {
      updateTagCallback(tag.id, { orderIndex: index });
    });
  }

  moveBookmarkedTagToPosition(
    allTags: Tag[],
    tagId: string,
    targetIndex: number,
    updateTagCallback: (tagId: string, updates: Partial<Tag>) => void
  ) {
    const bookmarkedTags = this.getBookmarkedTagList(allTags);
    const currentIndex = bookmarkedTags.findIndex((tag) => tag.id === tagId);

    if (currentIndex === -1 || currentIndex === targetIndex) return;

    this.reorderBookmarkedTags(allTags, currentIndex, targetIndex, updateTagCallback);
  }

  initializeTagOrderIndices(allTags: Tag[], updateTagCallback: (tagId: string, updates: Partial<Tag>) => void) {
    // 既存のブックマークされたタグにorder_indexを設定（まだ設定されていない場合）
    const bookmarkedTags = allTags.filter((tag) => this.bookmarkedTags.has(tag.id));
    bookmarkedTags.forEach((tag, index) => {
      if (tag.orderIndex === undefined) {
        updateTagCallback(tag.id, { orderIndex: index });
      }
    });
  }
}
