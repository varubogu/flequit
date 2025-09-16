import type { Tag } from '$lib/types/tag';
import { SvelteSet, SvelteDate } from 'svelte/reactivity';
import { dataService } from '$lib/services/data-service';
import { errorHandler } from './error-handler.svelte';

// Tag store using Svelte 5 runes
export class TagStore {
  tags = $state<Tag[]>([]);
  bookmarkedTags = $state<SvelteSet<string>>(new SvelteSet());

  // Computed values
  get allTags(): Tag[] {
    return this.tags;
  }

  get tagNames(): string[] {
    return this.tags.map((tag) => tag.name);
  }

  get bookmarkedTagList(): Tag[] {
    // Explicitly access both reactive properties to ensure reactivity
    const tags = this.tags;
    const bookmarked = this.bookmarkedTags;
    return tags
      .filter((tag) => bookmarked.has(tag.id))
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
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
  async addTagAsync(tagData: { name: string; color?: string }): Promise<Tag | null> {
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
      await dataService.createTag(newTag);
    } catch (error) {
      console.error('Failed to sync new tag to backend:', error);
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

  // バックエンド同期の内部メソッド
  private async syncAddTagToBackend(tag: Tag) {
    try {
      await dataService.createTag(tag);
    } catch (error) {
      console.error('Failed to sync new tag to backend:', error);
      errorHandler.addSyncError('タグ作成', 'tag', tag.id, error);
    }
  }

  // プロジェクトIDを指定したバックエンド同期メソッド
  private async syncAddTagToBackendWithProject(tag: Tag, projectId: string) {
    try {
      await dataService.createTag(tag, projectId);
    } catch (error) {
      console.error('Failed to sync new tag to backend:', error);
      errorHandler.addSyncError('タグ作成', 'tag', tag.id, error);
      // エラーが発生した場合はローカル状態から削除
      const tagIndex = this.tags.findIndex((t) => t.id === tag.id);
      if (tagIndex !== -1) {
        this.tags.splice(tagIndex, 1);
      }
    }
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
  updateTag(tagId: string, updates: Partial<Tag>) {
    const tagIndex = this.tags.findIndex((tag) => tag.id === tagId);
    if (tagIndex !== -1) {
      this.tags[tagIndex] = {
        ...this.tags[tagIndex],
        ...updates,
        updatedAt: new SvelteDate()
      };

      // バックエンドに同期は非同期で実行（ファイア&フォーゲット）
      this.syncUpdateTagToBackend(tagId, updates);

      // Dispatch custom event to notify task store about tag update
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('tag-updated', {
            detail: this.tags[tagIndex]
          })
        );
      }
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
        await dataService.updateTag(tagId, updates);
      } catch (error) {
        console.error('Failed to sync tag update to backend:', error);
        errorHandler.addSyncError('タグ更新', 'tag', tagId, error);
        // エラーが発生した場合はローカル状態を復元
        this.tags[tagIndex] = originalTag;
        return;
      }

      // Dispatch custom event to notify task store about tag update
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('tag-updated', {
            detail: this.tags[tagIndex]
          })
        );
      }
    }
  }

  // バックエンド同期の内部メソッド
  private async syncUpdateTagToBackend(tagId: string, updates: Partial<Tag>) {
    try {
      await dataService.updateTag(tagId, updates);
    } catch (error) {
      console.error('Failed to sync tag update to backend:', error);
      errorHandler.addSyncError('タグ更新', 'tag', tagId, error);
    }
  }

  // 同期版（既存のテストとの互換性のため）
  deleteTag(tagId: string, onDelete?: (tagId: string) => void) {
    const tagIndex = this.tags.findIndex((tag) => tag.id === tagId);
    if (tagIndex !== -1) {
      this.tags.splice(tagIndex, 1);

      // Remove from bookmarks if exists
      if (this.bookmarkedTags.has(tagId)) {
        this.removeBookmark(tagId);
      }

      // バックエンドに同期は非同期で実行（ファイア&フォーゲット）
      this.syncDeleteTagToBackend(tagId);

      // Call the deletion callback if provided
      onDelete?.(tagId);
    }
  }

  // async版（新しいバックエンド連携用）
  async deleteTagAsync(tagId: string, onDelete?: (tagId: string) => void) {
    const tagIndex = this.tags.findIndex((tag) => tag.id === tagId);
    if (tagIndex !== -1) {
      // バックアップとして削除するタグを保持
      const deletedTag = this.tags[tagIndex];
      const wasBookmarked = this.bookmarkedTags.has(tagId);

      // まずローカル状態から削除
      this.tags.splice(tagIndex, 1);

      // Remove from bookmarks if exists
      if (wasBookmarked) {
        this.removeBookmark(tagId);
      }

      // バックエンドに同期（削除操作は即座に保存）
      try {
        await dataService.deleteTag(tagId);
      } catch (error) {
        console.error('Failed to sync tag deletion to backend:', error);
        errorHandler.addSyncError('タグ削除', 'tag', tagId, error);
        // エラーが発生した場合はローカル状態を復元
        this.tags.splice(tagIndex, 0, deletedTag);
        if (wasBookmarked) {
          this.addBookmark(tagId);
        }
        return;
      }

      // Call the deletion callback if provided
      onDelete?.(tagId);
    }
  }

  // バックエンド同期の内部メソッド
  private async syncDeleteTagToBackend(tagId: string) {
    try {
      await dataService.deleteTag(tagId);
    } catch (error) {
      console.error('Failed to sync tag deletion to backend:', error);
      errorHandler.addSyncError('タグ削除', 'tag', tagId, error);
    }
  }

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

  addBookmark(tagId: string) {
    const newBookmarks = new SvelteSet(this.bookmarkedTags);
    newBookmarks.add(tagId);
    this.bookmarkedTags = newBookmarks;

    // 新しくブックマークされたタグにorder_indexを設定
    const tag = this.tags.find((t) => t.id === tagId);
    if (tag && tag.orderIndex === undefined) {
      const currentBookmarkedTags = this.bookmarkedTagList;
      this.updateTag(tagId, { orderIndex: currentBookmarkedTags.length - 1 });
    }
  }

  // 初期化専用：ストア状態の設定のみでバックエンド更新は行わない
  setBookmarkForInitialization(tagId: string) {
    const newBookmarks = new SvelteSet(this.bookmarkedTags);
    newBookmarks.add(tagId);
    this.bookmarkedTags = newBookmarks;

    // 初期化時はorder_indexもローカルで設定するのみ
    const tag = this.tags.find((t) => t.id === tagId);
    if (tag && tag.orderIndex === undefined) {
      const currentBookmarkedTags = this.tags.filter((t) => newBookmarks.has(t.id));
      tag.orderIndex = currentBookmarkedTags.length - 1;
    }
  }

  removeBookmark(tagId: string) {
    const newBookmarks = new SvelteSet(this.bookmarkedTags);
    newBookmarks.delete(tagId);
    this.bookmarkedTags = newBookmarks;
  }

  // Drag & Drop methods for bookmarked tags
  reorderBookmarkedTags(fromIndex: number, toIndex: number) {
    const bookmarkedTags = this.bookmarkedTagList;

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
      this.updateTag(tag.id, { orderIndex: index });
    });
  }

  moveBookmarkedTagToPosition(tagId: string, targetIndex: number) {
    const bookmarkedTags = this.bookmarkedTagList;
    const currentIndex = bookmarkedTags.findIndex((tag) => tag.id === tagId);

    if (currentIndex === -1 || currentIndex === targetIndex) return;

    this.reorderBookmarkedTags(currentIndex, targetIndex);
  }

  initializeTagOrderIndices() {
    // 既存のブックマークされたタグにorder_indexを設定（まだ設定されていない場合）
    const bookmarkedTags = this.tags.filter((tag) => this.bookmarkedTags.has(tag.id));
    bookmarkedTags.forEach((tag, index) => {
      if (tag.orderIndex === undefined) {
        this.updateTag(tag.id, { orderIndex: index });
      }
    });
  }
}

// Create global store instance
export const tagStore = new TagStore();
