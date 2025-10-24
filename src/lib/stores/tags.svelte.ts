import type { Tag } from '$lib/types/tag';
import { tagStore as tagStoreInternal } from './tags/tag-store.svelte';
import { TagBookmarkStore } from './tags/tag-bookmark-store.svelte';
import { TagMutations } from './tags/tag-mutations.svelte';
import { TagQueries } from './tags/tag-queries.svelte';
import { TagBookmarkOperations } from './tags/tag-bookmark-operations.svelte';

/**
 * TagStoreFacade - タグ管理のFacadeストア
 *
 * 責務: タグCRUD操作とブックマーク管理の統合インターフェース提供
 */
export class TagStoreFacade {
	private bookmarkStore = new TagBookmarkStore();
	private mutations = new TagMutations();
	private queries = new TagQueries();
	private bookmarkOps = new TagBookmarkOperations(this.bookmarkStore);

	// タグ状態の委譲
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

	// Queries
	get allTags(): Tag[] {
		return this.queries.allTags;
	}
	get tagNames(): string[] {
		return this.queries.tagNames;
	}
	get bookmarkedTagList(): Tag[] {
		return this.bookmarkOps.bookmarkedTagList;
	}
	findTagByName(name: string): Tag | undefined {
		return this.queries.findTagByName(name);
	}
	searchTags(query: string): Tag[] {
		return this.queries.searchTags(query);
	}
	async getProjectIdByTagId(tagId: string): Promise<string | null> {
		return this.queries.getProjectIdByTagId(tagId);
	}

	// Mutations
	setTags(tags: Tag[]) {
		tagStoreInternal.setTags(tags);
	}
	async addTag(tagData: { name: string; color?: string }, projectId?: string): Promise<Tag | null> {
		return this.mutations.addTag(tagData, projectId);
	}
	async addTagAsync(
		tagData: { name: string; color?: string },
		projectId?: string
	): Promise<Tag | null> {
		return this.mutations.addTagAsync(tagData, projectId);
	}
	async addTagWithProject(
		tagData: { name: string; color?: string },
		projectId: string
	): Promise<Tag | null> {
		return this.mutations.addTagWithProject(tagData, projectId);
	}
	addTagWithId(tag: Tag): Tag {
		return this.mutations.addTagWithId(tag);
	}
	async updateTag(tagId: string, updates: Partial<Tag>, projectId?: string): Promise<void> {
		return this.mutations.updateTag(tagId, updates, projectId);
	}
	async updateTagAsync(tagId: string, updates: Partial<Tag>, projectId?: string): Promise<void> {
		return this.mutations.updateTagAsync(tagId, updates, projectId);
	}
	async deleteTag(
		tagId: string,
		projectId?: string,
		onDelete?: (tagId: string) => void
	): Promise<void> {
		// ブックマーク削除を先に実行
		if (this.bookmarkOps.isBookmarked(tagId)) {
			this.bookmarkOps.removeBookmark(tagId);
		}
		return this.mutations.deleteTag(tagId, projectId, onDelete);
	}
	async deleteTagAsync(
		tagId: string,
		projectId?: string,
		onDelete?: (tagId: string) => void
	): Promise<void> {
		// ブックマーク削除を先に実行
		if (this.bookmarkOps.isBookmarked(tagId)) {
			this.bookmarkOps.removeBookmark(tagId);
		}
		return this.mutations.deleteTagAsync(tagId, projectId, onDelete);
	}
	async getOrCreateTag(name: string, projectId?: string, color?: string): Promise<Tag | null> {
		return this.mutations.getOrCreateTag(name, projectId, color);
	}
	async getOrCreateTagWithProject(
		name: string,
		projectId: string,
		color?: string
	): Promise<Tag | null> {
		return this.mutations.getOrCreateTagWithProject(name, projectId, color);
	}

	// Bookmark Operations
	toggleBookmark(tagId: string) {
		this.bookmarkOps.toggleBookmark(tagId);
	}
	isBookmarked(tagId: string): boolean {
		return this.bookmarkOps.isBookmarked(tagId);
	}
	async addBookmark(tagId: string) {
		return this.bookmarkOps.addBookmark(tagId);
	}
	setBookmarkForInitialization(tagId: string) {
		this.bookmarkOps.setBookmarkForInitialization(tagId);
	}
	removeBookmark(tagId: string) {
		this.bookmarkOps.removeBookmark(tagId);
	}
	async reorderBookmarkedTags(fromIndex: number, toIndex: number) {
		return this.bookmarkOps.reorderBookmarkedTags(fromIndex, toIndex);
	}
	async moveBookmarkedTagToPosition(tagId: string, targetIndex: number) {
		return this.bookmarkOps.moveBookmarkedTagToPosition(tagId, targetIndex);
	}
	async initializeTagOrderIndices() {
		return this.bookmarkOps.initializeTagOrderIndices();
	}
}

// Export class for type compatibility
export type TagStore = TagStoreFacade;

// Create global store instance
export const tagStore = new TagStoreFacade();
