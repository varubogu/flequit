import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TagQueries } from '$lib/stores/tags/tag-queries.svelte';
import type { Tag } from '$lib/types/tag';

// TagServiceのモック
vi.mock('$lib/services/domain/tag', () => ({
	TagService: {
		getProjectIdByTagId: vi.fn((tagId: string) =>
			Promise.resolve(tagId === 'tag-1' ? 'project-1' : null)
		)
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
		},
		{ id: 'tag-3', name: 'Project', color: '#0000FF', createdAt: new Date(), updatedAt: new Date() }
	];

	return {
		tagStore: {
			allTags: mockTags,
			tagNames: ['Work', 'Personal', 'Project'],
			findTagByName: vi.fn((name: string) => mockTags.find((t) => t.name === name)),
			searchTags: vi.fn((query: string) =>
				mockTags.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()))
			)
		}
	};
});

describe('TagQueries', () => {
	let queries: TagQueries;

	beforeEach(() => {
		queries = new TagQueries();
	});

	describe('allTags', () => {
		it('すべてのタグを取得できる', () => {
			const tags = queries.allTags;

			expect(tags).toHaveLength(3);
			expect(tags[0].name).toBe('Work');
		});
	});

	describe('tagNames', () => {
		it('タグ名のリストを取得できる', () => {
			const names = queries.tagNames;

			expect(names).toEqual(['Work', 'Personal', 'Project']);
		});
	});

	describe('findTagByName', () => {
		it('名前でタグを検索できる', () => {
			const tag = queries.findTagByName('Work');

			expect(tag).not.toBeUndefined();
			expect(tag?.id).toBe('tag-1');
		});

		it('存在しない名前の場合はundefinedを返す', () => {
			const tag = queries.findTagByName('NonExistent');

			expect(tag).toBeUndefined();
		});
	});

	describe('searchTags', () => {
		it('クエリでタグを検索できる', () => {
			const results = queries.searchTags('pro');

			expect(results).toHaveLength(1);
			expect(results[0].name).toBe('Project');
		});

		it('大文字小文字を区別せずに検索できる', () => {
			const results = queries.searchTags('WORK');

			expect(results).toHaveLength(1);
			expect(results[0].name).toBe('Work');
		});
	});

	describe('getProjectIdByTagId', () => {
		it('タグIDからプロジェクトIDを取得できる', async () => {
			const projectId = await queries.getProjectIdByTagId('tag-1');

			expect(projectId).toBe('project-1');
		});
	});
});
