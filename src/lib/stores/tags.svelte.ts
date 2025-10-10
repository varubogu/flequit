import type { Tag } from '$lib/types/tag';
import { tagStore as tagStoreInternal } from './tags/tag-store.svelte';
import { TagService } from '$lib/services/domain/tag';
import { TagBookmarkStore } from './tags/tag-bookmark-store.svelte';

/**
 * Tag store facade
 *
 * Provides a unified interface to tag CRUD and bookmark management.
 * Delegates operations to TagStore (state) and TagService (business logic).
 */
export class TagStoreFacade {
  private bookmarkStore = new TagBookmarkStore();

  // Delegate tag state to internal TagStore
  get tags(): Tag[] {
    return tagStoreInternal.tags;
  }

  set tags(value: Tag[]) {
    tagStoreInternal.setTags(value);
  }

  get bookmarkedTags() {
    return this.bookmarkStore.bookmarkedTags;
  }

  set bookmarkedTags(value) {
    this.bookmarkStore.bookmarkedTags = value;
  }

  // Computed values
  get allTags(): Tag[] {
    return tagStoreInternal.allTags;
  }

  get tagNames(): string[] {
    return tagStoreInternal.tagNames;
  }

  get bookmarkedTagList(): Tag[] {
    return this.bookmarkStore.getBookmarkedTagList(tagStoreInternal.tags);
  }

  // CRUD operations - delegate to TagService
  setTags(tags: Tag[]) {
    tagStoreInternal.setTags(tags);
  }

  async addTag(tagData: { name: string; color?: string }, projectId: string): Promise<Tag | null> {
    return TagService.createTag(projectId, tagData);
  }

  async addTagAsync(tagData: { name: string; color?: string }, projectId: string): Promise<Tag | null> {
    return TagService.createTag(projectId, tagData);
  }

  async addTagWithProject(tagData: { name: string; color?: string }, projectId: string): Promise<Tag | null> {
    return TagService.createTag(projectId, tagData);
  }

  addTagWithId(tag: Tag): Tag {
    return tagStoreInternal.addTagWithId(tag);
  }

  async updateTag(tagId: string, updates: Partial<Tag>, projectId: string): Promise<void> {
    return TagService.updateTag(projectId, tagId, updates);
  }

  async updateTagAsync(tagId: string, updates: Partial<Tag>, projectId: string): Promise<void> {
    return TagService.updateTag(projectId, tagId, updates);
  }

  async deleteTag(tagId: string, projectId: string, onDelete?: (tagId: string) => void): Promise<void> {
    // Remove from bookmarks if exists
    if (this.bookmarkStore.isBookmarked(tagId)) {
      this.bookmarkStore.removeBookmark(tagId);
    }

    return TagService.deleteTag(projectId, tagId, onDelete);
  }

  async deleteTagAsync(tagId: string, projectId: string, onDelete?: (tagId: string) => void): Promise<void> {
    // Remove from bookmarks if exists
    const wasBookmarked = this.bookmarkStore.isBookmarked(tagId);
    if (wasBookmarked) {
      this.bookmarkStore.removeBookmark(tagId);
    }

    return TagService.deleteTag(projectId, tagId, onDelete);
  }

  findTagByName(name: string): Tag | undefined {
    return tagStoreInternal.findTagByName(name);
  }

  searchTags(query: string): Tag[] {
    return tagStoreInternal.searchTags(query);
  }

  async getOrCreateTag(name: string, projectId: string, color?: string): Promise<Tag | null> {
    return TagService.getOrCreateTag(projectId, name, color);
  }

  async getOrCreateTagWithProject(name: string, projectId: string, color?: string): Promise<Tag | null> {
    return TagService.getOrCreateTag(projectId, name, color);
  }

  async getProjectIdByTagId(tagId: string): Promise<string | null> {
    return TagService.getProjectIdByTagId(tagId);
  }

  // Bookmark operations - delegate to BookmarkStore
  toggleBookmark(tagId: string) {
    this.bookmarkStore.toggleBookmark(tagId);
  }

  isBookmarked(tagId: string): boolean {
    return this.bookmarkStore.isBookmarked(tagId);
  }

  async addBookmark(tagId: string) {
    const projectId = await TagService.getProjectIdByTagId(tagId);
    if (!projectId) return;

    this.bookmarkStore.addBookmark(
      tagId,
      tagStoreInternal.tags,
      (id, updates) => TagService.updateTag(projectId, id, updates)
    );
  }

  setBookmarkForInitialization(tagId: string) {
    this.bookmarkStore.setBookmarkForInitialization(tagId, tagStoreInternal.tags);
  }

  removeBookmark(tagId: string) {
    this.bookmarkStore.removeBookmark(tagId);
  }

  async reorderBookmarkedTags(fromIndex: number, toIndex: number) {
    // Get project ID from first bookmarked tag
    const firstTag = this.bookmarkedTagList[0];
    if (!firstTag) return;

    const projectId = await TagService.getProjectIdByTagId(firstTag.id);
    if (!projectId) return;

    this.bookmarkStore.reorderBookmarkedTags(
      tagStoreInternal.tags,
      fromIndex,
      toIndex,
      (id, updates) => TagService.updateTag(projectId, id, updates)
    );
  }

  async moveBookmarkedTagToPosition(tagId: string, targetIndex: number) {
    const projectId = await TagService.getProjectIdByTagId(tagId);
    if (!projectId) return;

    this.bookmarkStore.moveBookmarkedTagToPosition(
      tagStoreInternal.tags,
      tagId,
      targetIndex,
      (id, updates) => TagService.updateTag(projectId, id, updates)
    );
  }

  async initializeTagOrderIndices() {
    // Get project ID from first tag
    const firstTag = tagStoreInternal.tags[0];
    if (!firstTag) return;

    const projectId = await TagService.getProjectIdByTagId(firstTag.id);
    if (!projectId) return;

    this.bookmarkStore.initializeTagOrderIndices(
      tagStoreInternal.tags,
      (id, updates) => TagService.updateTag(projectId, id, updates)
    );
  }
}

// Export class for type compatibility
export type TagStore = TagStoreFacade;

// Create global store instance
export const tagStore = new TagStoreFacade();
