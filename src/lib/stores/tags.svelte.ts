import type { Tag } from '$lib/types/tag';
import { TagCRUDStore } from './tags/tag-crud-store.svelte';
import { TagBookmarkStore } from './tags/tag-bookmark-store.svelte';

/**
 * Tag store facade
 *
 * Provides a unified interface to tag CRUD and bookmark management.
 * Delegates operations to specialized stores while maintaining backward compatibility.
 */
export class TagStore {
  private crudStore = new TagCRUDStore();
  private bookmarkStore = new TagBookmarkStore();

  // Delegate tag state to CRUD store
  get tags(): Tag[] {
    return this.crudStore.tags;
  }

  set tags(value: Tag[]) {
    this.crudStore.tags = value;
  }

  get bookmarkedTags() {
    return this.bookmarkStore.bookmarkedTags;
  }

  set bookmarkedTags(value) {
    this.bookmarkStore.bookmarkedTags = value;
  }

  // Computed values
  get allTags(): Tag[] {
    return this.crudStore.allTags;
  }

  get tagNames(): string[] {
    return this.crudStore.tagNames;
  }

  get bookmarkedTagList(): Tag[] {
    return this.bookmarkStore.getBookmarkedTagList(this.crudStore.tags);
  }

  // CRUD operations - delegate to CRUDStore
  setTags(tags: Tag[]) {
    this.crudStore.setTags(tags);
  }

  addTag(tagData: { name: string; color?: string }): Tag | null {
    return this.crudStore.addTag(tagData);
  }

  async addTagAsync(tagData: { name: string; color?: string }, projectId?: string): Promise<Tag | null> {
    return this.crudStore.addTagAsync(tagData, projectId);
  }

  addTagWithProject(tagData: { name: string; color?: string }, projectId: string): Tag | null {
    return this.crudStore.addTagWithProject(tagData, projectId);
  }

  addTagWithId(tag: Tag): Tag {
    return this.crudStore.addTagWithId(tag);
  }

  updateTag(tagId: string, updates: Partial<Tag>, projectId?: string) {
    this.crudStore.updateTag(tagId, updates, projectId);
  }

  async updateTagAsync(tagId: string, updates: Partial<Tag>) {
    return this.crudStore.updateTagAsync(tagId, updates);
  }

  deleteTag(tagId: string, onDelete?: (tagId: string) => void) {
    // Remove from bookmarks if exists
    if (this.bookmarkStore.isBookmarked(tagId)) {
      this.bookmarkStore.removeBookmark(tagId);
    }

    this.crudStore.deleteTag(tagId, onDelete);
  }

  async deleteTagAsync(tagId: string, onDelete?: (tagId: string) => void) {
    // Remove from bookmarks if exists
    const wasBookmarked = this.bookmarkStore.isBookmarked(tagId);
    if (wasBookmarked) {
      this.bookmarkStore.removeBookmark(tagId);
    }

    await this.crudStore.deleteTagAsync(tagId, onDelete);
  }

  findTagByName(name: string): Tag | undefined {
    return this.crudStore.findTagByName(name);
  }

  searchTags(query: string): Tag[] {
    return this.crudStore.searchTags(query);
  }

  getOrCreateTag(name: string, color?: string): Tag | null {
    return this.crudStore.getOrCreateTag(name, color);
  }

  getOrCreateTagWithProject(name: string, projectId: string, color?: string): Tag | null {
    return this.crudStore.getOrCreateTagWithProject(name, projectId, color);
  }

  async getProjectIdByTagId(tagId: string): Promise<string | null> {
    return this.crudStore.getProjectIdByTagId(tagId);
  }

  // Bookmark operations - delegate to BookmarkStore
  toggleBookmark(tagId: string) {
    this.bookmarkStore.toggleBookmark(tagId);
  }

  isBookmarked(tagId: string): boolean {
    return this.bookmarkStore.isBookmarked(tagId);
  }

  addBookmark(tagId: string) {
    this.bookmarkStore.addBookmark(
      tagId,
      this.crudStore.tags,
      (id, updates) => this.crudStore.updateTag(id, updates)
    );
  }

  setBookmarkForInitialization(tagId: string) {
    this.bookmarkStore.setBookmarkForInitialization(tagId, this.crudStore.tags);
  }

  removeBookmark(tagId: string) {
    this.bookmarkStore.removeBookmark(tagId);
  }

  reorderBookmarkedTags(fromIndex: number, toIndex: number) {
    this.bookmarkStore.reorderBookmarkedTags(
      this.crudStore.tags,
      fromIndex,
      toIndex,
      (id, updates) => this.crudStore.updateTag(id, updates)
    );
  }

  moveBookmarkedTagToPosition(tagId: string, targetIndex: number) {
    this.bookmarkStore.moveBookmarkedTagToPosition(
      this.crudStore.tags,
      tagId,
      targetIndex,
      (id, updates) => this.crudStore.updateTag(id, updates)
    );
  }

  initializeTagOrderIndices() {
    this.bookmarkStore.initializeTagOrderIndices(
      this.crudStore.tags,
      (id, updates) => this.crudStore.updateTag(id, updates)
    );
  }
}

// Create global store instance
export const tagStore = new TagStore();
