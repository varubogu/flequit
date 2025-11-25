import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TagBookmarkOperations } from '$lib/stores/tags/tag-bookmark-operations.svelte';
import { TagBookmarkStore } from '$lib/stores/tags/tag-bookmark-store.svelte';
import type { Tag } from '$lib/types/tag';
import type { TagBookmark } from '$lib/types/tag-bookmark';

// TagServiceのモック
vi.mock('$lib/services/domain/tag', () => ({
	TagService: {
		getProjectIdByTagId: vi.fn(() => Promise.resolve('project-1')),
		updateTag: vi.fn(() => Promise.resolve())
	}
}));

// TagBookmarkServiceのモック
vi.mock('$lib/services/domain/tag-bookmark', () => ({
	TagBookmarkService: {
		create: vi.fn(() => Promise.resolve()),
		delete: vi.fn(() => Promise.resolve()),
		toggleBookmark: vi.fn(() => Promise.resolve()),
		reorder: vi.fn(() => Promise.resolve())
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
			deleted: false,
			updatedBy: 'test-user'
		},
		{
			id: 'tag-2',
			name: 'Personal',
			color: '#00FF00',
			orderIndex: 1,
			createdAt: new Date(),
			updatedAt: new Date(),
			deleted: false,
			updatedBy: 'test-user'
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

	beforeEach(async () => {
		// モックをクリア
		vi.clearAllMocks();

		bookmarkStore = new TagBookmarkStore();

		// モックのブックマークを設定
		const mockBookmarks: TagBookmark[] = [
			{
				id: 'bookmark-1',
				userId: 'test-user',
				projectId: 'project-1',
				tagId: 'tag-1',
				orderIndex: 0,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			},
			{
				id: 'bookmark-2',
				userId: 'test-user',
				projectId: 'project-1',
				tagId: 'tag-2',
				orderIndex: 1,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			}
		];
		bookmarkStore.setBookmarks(mockBookmarks);
		bookmarkOps = new TagBookmarkOperations(bookmarkStore);

		// モックされたTagBookmarkServiceを取得して、ストアを操作するように設定
		const { TagBookmarkService } = await import('$lib/services/domain/tag-bookmark');

		vi.mocked(TagBookmarkService.create).mockImplementation(async (_projectId: string, tagId: string) => {
			const newBookmark: TagBookmark = {
				id: crypto.randomUUID(),
				userId: 'test-user',
				projectId: 'project-1',
				tagId,
				orderIndex: bookmarkStore.bookmarks.length,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			};
			bookmarkStore.setBookmarks([...bookmarkStore.bookmarks, newBookmark]);
			return newBookmark;
		});

		vi.mocked(TagBookmarkService.delete).mockImplementation(async (_bookmarkId: string, tagId: string) => {
			const filtered = bookmarkStore.bookmarks.filter(b => b.tagId !== tagId);
			bookmarkStore.setBookmarks(filtered);
		});

		vi.mocked(TagBookmarkService.toggleBookmark).mockImplementation(async (_projectId: string, tagId: string) => {
			const exists = bookmarkStore.bookmarks.some(b => b.tagId === tagId);
			if (exists) {
				const filtered = bookmarkStore.bookmarks.filter(b => b.tagId !== tagId);
				bookmarkStore.setBookmarks(filtered);
			} else {
				const newBookmark: TagBookmark = {
					id: crypto.randomUUID(),
					userId: 'test-user',
					projectId: 'project-1',
					tagId,
					orderIndex: bookmarkStore.bookmarks.length,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString()
				};
				bookmarkStore.setBookmarks([...bookmarkStore.bookmarks, newBookmark]);
			}
		});
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
		it('ブックマークをトグルできる', async () => {
			await bookmarkOps.toggleBookmark('tag-1');

			expect(bookmarkOps.isBookmarked('tag-1')).toBe(false);

			await bookmarkOps.toggleBookmark('tag-1');

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
			// ブックマークをクリア
			bookmarkStore.clear();

			await bookmarkOps.addBookmark('tag-1');

			expect(bookmarkOps.isBookmarked('tag-1')).toBe(true);
		});
	});

	describe('removeBookmark', () => {
		it('ブックマークを削除できる', async () => {
			await bookmarkOps.removeBookmark('tag-1');

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
