import type { Tag } from '$lib/types/tag';
import { tagStore as tagStoreInternal } from './tag-store.svelte';
import { TagBookmarkStore } from './tag-bookmark-store.svelte';
import { TagService } from '$lib/services/domain/tag';

/**
 * タグのブックマーク操作
 *
 * 責務: ブックマークの追加、削除、並び替え
 */
export class TagBookmarkOperations {
	constructor(private bookmarkStore: TagBookmarkStore) {}

	/**
	 * ブックマーク済みタグのリストを取得
	 */
	get bookmarkedTagList(): Tag[] {
		return this.bookmarkStore.getBookmarkedTagList(tagStoreInternal.tags);
	}

	/**
	 * ブックマークのトグル
	 */
	toggleBookmark(tagId: string) {
		this.bookmarkStore.toggleBookmark(tagId);
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
		const projectId = await TagService.getProjectIdByTagId(tagId);
		const updateFn = projectId
			? (id: string, updates: Partial<Tag>) => TagService.updateTag(projectId, id, updates)
			: (id: string, updates: Partial<Tag>) => tagStoreInternal.updateTagInStore(id, updates);

		this.bookmarkStore.addBookmark(tagId, tagStoreInternal.tags, updateFn);
	}

	/**
	 * 初期化用にブックマークを設定
	 */
	setBookmarkForInitialization(tagId: string) {
		this.bookmarkStore.setBookmarkForInitialization(tagId, tagStoreInternal.tags);
	}

	/**
	 * ブックマークを削除
	 */
	removeBookmark(tagId: string) {
		this.bookmarkStore.removeBookmark(tagId);
	}

	/**
	 * ブックマーク済みタグを並び替え
	 */
	async reorderBookmarkedTags(fromIndex: number, toIndex: number) {
		const firstTag = this.bookmarkedTagList[0];
		if (!firstTag) return;

		const projectId = await TagService.getProjectIdByTagId(firstTag.id);
		const updateFn = projectId
			? (id: string, updates: Partial<Tag>) => TagService.updateTag(projectId, id, updates)
			: (id: string, updates: Partial<Tag>) => tagStoreInternal.updateTagInStore(id, updates);

		this.bookmarkStore.reorderBookmarkedTags(
			tagStoreInternal.tags,
			fromIndex,
			toIndex,
			updateFn
		);
	}

	/**
	 * ブックマーク済みタグを指定位置に移動
	 */
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

	/**
	 * タグの順序インデックスを初期化
	 */
	async initializeTagOrderIndices() {
		const firstTag = tagStoreInternal.tags[0];
		if (!firstTag) return;

		const projectId = await TagService.getProjectIdByTagId(firstTag.id);
		const updateFn = projectId
			? (id: string, updates: Partial<Tag>) => TagService.updateTag(projectId, id, updates)
			: (id: string, updates: Partial<Tag>) => tagStoreInternal.updateTagInStore(id, updates);

		this.bookmarkStore.initializeTagOrderIndices(tagStoreInternal.tags, updateFn);
	}
}
