import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TagStoreFacade } from '$lib/stores/tags.svelte';
import type { Tag } from '$lib/types/tag';

// TagServiceのモック
vi.mock('$lib/services/domain/tag', () => ({
	TagService: {
		createTag: vi.fn((projectId, tagData) =>
			Promise.resolve({
				id: 'new-tag-id',
				name: tagData.name,
				color: tagData.color,
				createdAt: new Date(),
				updatedAt: new Date()
			})
		),
		updateTag: vi.fn(() => Promise.resolve()),
		deleteTag: vi.fn(() => Promise.resolve()),
		getOrCreateTag: vi.fn((projectId, name, color) =>
			Promise.resolve({
				id: 'tag-id',
				name,
				color,
				createdAt: new Date(),
				updatedAt: new Date()
			})
		),
		getProjectIdByTagId: vi.fn(() => Promise.resolve('project-1'))
	}
}));

// tagStore内部のモック
vi.mock('$lib/stores/tags/tag-store.svelte', () => {
	const mockTags: Tag[] = [
		{ id: 'tag-1', name: 'Work', color: '#FF0000', createdAt: new Date(), updatedAt: new Date() },
		{
			id: 'tag-2',
			name: 'Personal',
			color: '#00FF00',
			createdAt: new Date(),
			updatedAt: new Date()
		}
	];

	return {
		tagStore: {
			tags: mockTags,
			allTags: mockTags,
			tagNames: ['Work', 'Personal'],
			setTags: vi.fn(),
			findTagByName: vi.fn((name: string) => mockTags.find((t) => t.name === name)),
			searchTags: vi.fn((query: string) =>
				mockTags.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()))
			),
			addTagWithId: vi.fn((tag: Tag) => tag),
			updateTagInStore: vi.fn(),
			deleteTagFromStore: vi.fn()
		}
	};
});

/**
 * TagStoreFacade 統合テスト
 *
 * このテストは TagStoreFacade のファサードとしての統合動作を検証します。
 * 個別のクラス（TagMutations等）の単体テストは別ファイルで実施しています。
 */
describe('TagStoreFacade (Integration)', () => {
	let store: TagStoreFacade;

	beforeEach(() => {
		store = new TagStoreFacade();
	});

	describe('初期化', () => {
		it('ストアを初期化できる', () => {
			expect(store).toBeDefined();
		});
	});

	describe('検索・取得', () => {
		it('すべてのタグを取得できる', () => {
			const tags = store.allTags;

			expect(tags).toHaveLength(2);
			expect(tags[0].name).toBe('Work');
		});

		it('タグ名のリストを取得できる', () => {
			const names = store.tagNames;

			expect(names).toEqual(['Work', 'Personal']);
		});

		it('名前でタグを検索できる', () => {
			const tag = store.findTagByName('Work');

			expect(tag).not.toBeUndefined();
			expect(tag?.id).toBe('tag-1');
		});

		it('クエリでタグを検索できる', () => {
			const results = store.searchTags('per');

			expect(results).toHaveLength(1);
			expect(results[0].name).toBe('Personal');
		});
	});

	describe('CRUD操作', () => {
		it('タグを追加できる', async () => {
			const result = await store.addTag({ name: 'New Tag', color: '#0000FF' }, 'project-1');

			expect(result).not.toBeNull();
			expect(result?.id).toBe('new-tag-id');
		});

		it('タグを更新できる', async () => {
			const { TagService } = await import('$lib/services/domain/tag');

			await store.updateTag('tag-1', { name: 'Updated' }, 'project-1');

			expect(TagService.updateTag).toHaveBeenCalled();
		});

		it('タグを削除できる', async () => {
			const { tagStore } = await import('$lib/stores/tags/tag-store.svelte');

			await store.deleteTag('tag-1');

			expect(tagStore.deleteTagFromStore).toHaveBeenCalledWith('tag-1');
		});

		it('タグを取得または作成できる', async () => {
			const result = await store.getOrCreateTag('Test Tag', 'project-1', '#FF0000');

			expect(result).not.toBeNull();
			expect(result?.name).toBe('Test Tag');
		});
	});

	describe('ブックマーク操作', () => {
		it('ブックマークをトグルできる', () => {
			store.toggleBookmark('tag-1');

			const isBookmarked = store.isBookmarked('tag-1');
			expect(typeof isBookmarked).toBe('boolean');
		});

		it('ブックマークを追加できる', async () => {
			await store.addBookmark('tag-1');

			// エラーが発生しないことを確認
			expect(true).toBe(true);
		});

		it('ブックマークを削除できる', () => {
			store.removeBookmark('tag-1');

			// エラーが発生しないことを確認
			expect(true).toBe(true);
		});
	});

	describe('複雑な操作フロー', () => {
		it('追加→更新→削除のフロー', async () => {
			// 1. タグを追加
			const newTag = await store.addTag({ name: 'Flow Tag' }, 'project-1');
			expect(newTag).not.toBeNull();

			// 2. 追加したタグを更新
			await store.updateTag('new-tag-id', { name: 'Updated Flow Tag' }, 'project-1');

			// 3. タグを削除
			await store.deleteTag('new-tag-id', 'project-1');

			// すべてのステップがエラーなく完了することを確認
			expect(true).toBe(true);
		});
	});
});
