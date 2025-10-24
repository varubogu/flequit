import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TagMutations } from '$lib/stores/tags/tag-mutations.svelte';
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
vi.mock('$lib/stores/tags/tag-store.svelte', () => ({
	tagStore: {
		tags: [] as Tag[],
		findTagByName: vi.fn(() => undefined),
		addTagWithId: vi.fn((tag: Tag) => tag),
		updateTagInStore: vi.fn(),
		deleteTagFromStore: vi.fn()
	}
}));

describe('TagMutations', () => {
	let mutations: TagMutations;

	beforeEach(() => {
		mutations = new TagMutations();
	});

	describe('createLocalTag', () => {
		it('ローカルタグを作成できる', () => {
			const result = mutations.createLocalTag({ name: 'Test Tag', color: '#FF0000' });

			expect(result).not.toBeNull();
			expect(result?.name).toBe('Test Tag');
			expect(result?.color).toBe('#FF0000');
		});

		it('空白のみの名前では作成できない', () => {
			const result = mutations.createLocalTag({ name: '   ' });

			expect(result).toBeNull();
		});
	});

	describe('addTag', () => {
		it('プロジェクトIDなしでローカルタグを作成', async () => {
			const result = await mutations.addTag({ name: 'Local Tag' });

			expect(result).not.toBeNull();
			expect(result?.name).toBe('Local Tag');
		});

		it('プロジェクトID付きでタグを作成', async () => {
			const result = await mutations.addTag({ name: 'Project Tag' }, 'project-1');

			expect(result).not.toBeNull();
			expect(result?.id).toBe('new-tag-id');
		});
	});

	describe('updateTag', () => {
		it('プロジェクトIDなしでローカル更新', async () => {
			const { tagStore } = await import('$lib/stores/tags/tag-store.svelte');

			await mutations.updateTag('tag-1', { name: 'Updated' });

			expect(tagStore.updateTagInStore).toHaveBeenCalledWith('tag-1', { name: 'Updated' });
		});

		it('プロジェクトID付きで更新', async () => {
			const { TagService } = await import('$lib/services/domain/tag');

			await mutations.updateTag('tag-1', { name: 'Updated' }, 'project-1');

			expect(TagService.updateTag).toHaveBeenCalledWith('project-1', 'tag-1', {
				name: 'Updated'
			});
		});
	});

	describe('deleteTag', () => {
		it('プロジェクトIDなしでローカル削除', async () => {
			const { tagStore } = await import('$lib/stores/tags/tag-store.svelte');
			const onDelete = vi.fn();

			await mutations.deleteTag('tag-1', undefined, onDelete);

			expect(tagStore.deleteTagFromStore).toHaveBeenCalledWith('tag-1');
			expect(onDelete).toHaveBeenCalledWith('tag-1');
		});

		it('プロジェクトID付きで削除', async () => {
			const { TagService } = await import('$lib/services/domain/tag');
			const onDelete = vi.fn();

			await mutations.deleteTag('tag-1', 'project-1', onDelete);

			expect(TagService.deleteTag).toHaveBeenCalledWith('project-1', 'tag-1', onDelete);
		});
	});

	describe('getOrCreateTag', () => {
		it('タグを取得または作成できる', async () => {
			const result = await mutations.getOrCreateTag('Tag Name', 'project-1', '#FF0000');

			expect(result).not.toBeNull();
			expect(result?.name).toBe('Tag Name');
		});
	});
});
