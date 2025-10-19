import type { Tag } from '$lib/types/tag';
import { SvelteDate } from 'svelte/reactivity';
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

  private createLocalTag(tagData: { name: string; color?: string }): Tag | null {
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
      updatedAt: now
    };

    return tagStoreInternal.addTagWithId(newTag);
  }

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

  async addTag(tagData: { name: string; color?: string }, projectId?: string): Promise<Tag | null> {
    if (!projectId) {
      return this.createLocalTag(tagData);
    }

    return TagService.createTag(projectId, tagData);
  }

  async addTagAsync(tagData: { name: string; color?: string }, projectId?: string): Promise<Tag | null> {
    return this.addTag(tagData, projectId);
  }

  async addTagWithProject(
    tagData: { name: string; color?: string },
    projectId: string
  ): Promise<Tag | null> {
    return this.addTag(tagData, projectId);
  }

  addTagWithId(tag: Tag): Tag {
    return tagStoreInternal.addTagWithId(tag);
  }

  async updateTag(tagId: string, updates: Partial<Tag>, projectId?: string): Promise<void> {
    if (!projectId) {
      tagStoreInternal.updateTagInStore(tagId, updates);
      return;
    }

    return TagService.updateTag(projectId, tagId, updates);
  }

  async updateTagAsync(tagId: string, updates: Partial<Tag>, projectId?: string): Promise<void> {
    return this.updateTag(tagId, updates, projectId);
  }

  async deleteTag(
    tagId: string,
    projectId?: string,
    onDelete?: (tagId: string) => void
  ): Promise<void> {
    if (this.bookmarkStore.isBookmarked(tagId)) {
      this.bookmarkStore.removeBookmark(tagId);
    }

    if (!projectId) {
      tagStoreInternal.deleteTagFromStore(tagId);
      onDelete?.(tagId);
      return;
    }

    return TagService.deleteTag(projectId, tagId, onDelete);
  }

  async deleteTagAsync(
    tagId: string,
    projectId?: string,
    onDelete?: (tagId: string) => void
  ): Promise<void> {
    const wasBookmarked = this.bookmarkStore.isBookmarked(tagId);
    if (wasBookmarked) {
      this.bookmarkStore.removeBookmark(tagId);
    }

    if (!projectId) {
      tagStoreInternal.deleteTagFromStore(tagId);
      onDelete?.(tagId);
      return;
    }

    return TagService.deleteTag(projectId, tagId, onDelete);
  }

  findTagByName(name: string): Tag | undefined {
    return tagStoreInternal.findTagByName(name);
  }

  searchTags(query: string): Tag[] {
    return tagStoreInternal.searchTags(query);
  }

  async getOrCreateTag(name: string, projectId?: string, color?: string): Promise<Tag | null> {
    if (!projectId) {
      return this.createLocalTag({ name, color });
    }

    return TagService.getOrCreateTag(projectId, name, color);
  }

  async getOrCreateTagWithProject(
    name: string,
    projectId: string,
    color?: string
  ): Promise<Tag | null> {
    return this.getOrCreateTag(name, projectId, color);
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
    const updateFn = projectId
      ? (id: string, updates: Partial<Tag>) => TagService.updateTag(projectId, id, updates)
      : (id: string, updates: Partial<Tag>) => tagStoreInternal.updateTagInStore(id, updates);

    this.bookmarkStore.addBookmark(tagId, tagStoreInternal.tags, updateFn);
  }

  setBookmarkForInitialization(tagId: string) {
    this.bookmarkStore.setBookmarkForInitialization(tagId, tagStoreInternal.tags);
  }

  removeBookmark(tagId: string) {
    this.bookmarkStore.removeBookmark(tagId);
  }

  async reorderBookmarkedTags(fromIndex: number, toIndex: number) {
    const firstTag = this.bookmarkedTagList[0];
    if (!firstTag) return;

    const projectId = await TagService.getProjectIdByTagId(firstTag.id);
    const updateFn = projectId
      ? (id: string, updates: Partial<Tag>) => TagService.updateTag(projectId, id, updates)
      : (id: string, updates: Partial<Tag>) => tagStoreInternal.updateTagInStore(id, updates);

    this.bookmarkStore.reorderBookmarkedTags(tagStoreInternal.tags, fromIndex, toIndex, updateFn);
  }

  async moveBookmarkedTagToPosition(tagId: string, targetIndex: number) {
    const projectId = await TagService.getProjectIdByTagId(tagId);
    const updateFn = projectId
      ? (id: string, updates: Partial<Tag>) => TagService.updateTag(projectId, id, updates)
      : (id: string, updates: Partial<Tag>) => tagStoreInternal.updateTagInStore(id, updates);

    this.bookmarkStore.moveBookmarkedTagToPosition(
      tagStoreInternal.tags,
      tagId,
      targetIndex,
      updateFn
    );
  }

  async initializeTagOrderIndices() {
    // Get project ID from first tag
    const firstTag = tagStoreInternal.tags[0];
    if (!firstTag) return;

    const projectId = await TagService.getProjectIdByTagId(firstTag.id);
    const updateFn = projectId
      ? (id: string, updates: Partial<Tag>) => TagService.updateTag(projectId, id, updates)
      : (id: string, updates: Partial<Tag>) => tagStoreInternal.updateTagInStore(id, updates);

    this.bookmarkStore.initializeTagOrderIndices(tagStoreInternal.tags, updateFn);
  }
}

// Export class for type compatibility
export type TagStore = TagStoreFacade;

// Create global store instance
export const tagStore = new TagStoreFacade();
