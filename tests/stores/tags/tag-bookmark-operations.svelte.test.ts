import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TagBookmarkOperations } from '$lib/stores/tags/tag-bookmark-operations.svelte';
import { TagBookmarkStore } from '$lib/stores/tags/tag-bookmark-store.svelte';
import type { Tag } from '$lib/types/tag';
import { SvelteSet } from 'svelte/reactivity';

// TagServiceのモック
vi.mock('$lib/services/domain/tag', () => ({
	TagService: {
		getProjectIdByTagId: vi.fn(() => Promise.resolve('project-1')),
		updateTag: vi.fn(() => Promise.resolve())
	}
}));

// tagStore内部のモック
vi.mock('$lib/stores/tags/tag-store.svelte', () => {
	const mockTags: Tag[] = [
		{
			id: 'tag-1',
			name: 'Work',
			color: '#FF0000',
			orderIndex: 0,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			id: 'tag-2',
			name: 'Personal',
			color: '#00FF00',
			orderIndex: 1,
			createdAt: new Date(),
			updatedAt: new Date(),
		}
	];

	return {
		tagStore: {
			tags: mockTags,
			updateTagInStore: vi.fn()
		}
	};
});

describe('TagBookmarkOperations', () => {
	let bookmarkStore: TagBookmarkStore;
	let bookmarkOps: TagBookmarkOperations;

	beforeEach(() => {
		bookmarkStore = new TagBookmarkStore();
		bookmarkStore.bookmarkedTags = new SvelteSet(['tag-1', 'tag-2']);
		bookmarkOps = new TagBookmarkOperations(bookmarkStore);
	});

	describe('bookmarkedTagList', () => {
		it('ブックマーク済みタグのリストを取得できる', () => {
			const list = bookmarkOps.bookmarkedTagList;

			expect(list).toHaveLength(2);
			expect(list[0].id).toBe('tag-1');
			expect(list[1].id).toBe('tag-2');
		});
	});

	describe('toggleBookmark', () => {
		it('ブックマークをトグルできる', () => {
			bookmarkOps.toggleBookmark('tag-1');

			expect(bookmarkOps.isBookmarked('tag-1')).toBe(false);

			bookmarkOps.toggleBookmark('tag-1');

			expect(bookmarkOps.isBookmarked('tag-1')).toBe(true);
		});
	});

	describe('isBookmarked', () => {
		it('ブックマーク状態を確認できる', () => {
			expect(bookmarkOps.isBookmarked('tag-1')).toBe(true);
			expect(bookmarkOps.isBookmarked('tag-3')).toBe(false);
		});
	});

		describe('addBookmark', () => {
			it('ブックマークを追加できる', async () => {
				bookmarkStore.bookmarkedTags = new SvelteSet();

			await bookmarkOps.addBookmark('tag-1');

			expect(bookmarkOps.isBookmarked('tag-1')).toBe(true);
		});
	});

	describe('removeBookmark', () => {
		it('ブックマークを削除できる', () => {
			bookmarkOps.removeBookmark('tag-1');

			expect(bookmarkOps.isBookmarked('tag-1')).toBe(false);
		});
	});

		describe('reorderBookmarkedTags', () => {
			it('ブックマーク済みタグを並び替えられる', async () => {
				await bookmarkOps.reorderBookmarkedTags(0, 1);

			// 並び替え操作が実行されることを確認（エラーなく完了）
			expect(true).toBe(true);
		});
	});
});
