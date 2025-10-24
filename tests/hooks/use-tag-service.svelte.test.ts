import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTagService } from '$lib/hooks/use-tag-service.svelte';
import type { ITagService } from '$lib/hooks/use-tag-service.svelte';
import type { Tag } from '$lib/types/tag';

// TagServiceのモック
vi.mock('$lib/services/domain/tag', () => ({
	TagService: {
		createTag: vi.fn(
			async (_projectId, tagData): Promise<Tag> => ({
				id: 'test-tag-id',
				name: tagData.name,
				color: tagData.color,
				createdAt: new Date(),
				updatedAt: new Date()
			})
		),
		updateTag: vi.fn(async () => {}),
		deleteTag: vi.fn(async () => {}),
		getOrCreateTag: vi.fn(
			async (_projectId, name, color): Promise<Tag> => ({
				id: 'test-tag-id',
				name,
				color,
				createdAt: new Date(),
				updatedAt: new Date()
			})
		),
		getProjectIdByTagId: vi.fn(async () => 'test-project-id'),
		addBookmark: vi.fn(async () => {}),
		removeBookmark: vi.fn(() => {}),
		notifyTagUpdate: vi.fn(() => {})
	}
}));

describe('useTagService', () => {
	let tagService: ITagService;

	beforeEach(() => {
		vi.clearAllMocks();
		tagService = useTagService();
	});

	it('タグサービスを取得できる', () => {
		expect(tagService).toBeDefined();
		expect(tagService.createTag).toBeDefined();
		expect(tagService.updateTag).toBeDefined();
		expect(tagService.deleteTag).toBeDefined();
	});

	it('タグを作成できる', async () => {
		const tagData = {
			name: 'Test Tag',
			color: '#FF0000'
		};

		const result = await tagService.createTag('project-1', tagData);

		expect(result).not.toBeNull();
		expect(result?.name).toBe('Test Tag');
		expect(result?.color).toBe('#FF0000');
		expect(tagService.createTag).toHaveBeenCalledWith('project-1', tagData);
	});

	it('タグを更新できる', async () => {
		const updates = {
			name: 'Updated Tag',
			color: '#00FF00'
		};

		await tagService.updateTag('project-1', 'tag-1', updates);

		expect(tagService.updateTag).toHaveBeenCalledWith('project-1', 'tag-1', updates);
	});

	it('タグを削除できる', async () => {
		const onDelete = vi.fn();

		await tagService.deleteTag('project-1', 'tag-1', onDelete);

		expect(tagService.deleteTag).toHaveBeenCalledWith('project-1', 'tag-1', onDelete);
	});

	it('タグを取得または作成できる', async () => {
		const result = await tagService.getOrCreateTag('project-1', 'Test Tag', '#FF0000');

		expect(result).not.toBeNull();
		expect(result?.name).toBe('Test Tag');
		expect(result?.color).toBe('#FF0000');
		expect(tagService.getOrCreateTag).toHaveBeenCalledWith('project-1', 'Test Tag', '#FF0000');
	});

	it('タグIDからプロジェクトIDを取得できる', async () => {
		const result = await tagService.getProjectIdByTagId('tag-1');

		expect(result).toBe('test-project-id');
		expect(tagService.getProjectIdByTagId).toHaveBeenCalledWith('tag-1');
	});

	it('タグをブックマークに追加できる', async () => {
		await tagService.addBookmark('project-1', 'tag-1');

		expect(tagService.addBookmark).toHaveBeenCalledWith('project-1', 'tag-1');
	});

	it('タグをブックマークから削除できる', () => {
		tagService.removeBookmark('tag-1');

		expect(tagService.removeBookmark).toHaveBeenCalledWith('tag-1');
	});

	it('タグ更新を通知できる', () => {
		const tag: Tag = {
			id: 'tag-1',
			name: 'Test Tag',
			color: '#FF0000',
			createdAt: new Date(),
			updatedAt: new Date()
		};

		tagService.notifyTagUpdate(tag);

		expect(tagService.notifyTagUpdate).toHaveBeenCalledWith(tag);
	});

	it('同じインスタンスを返す', () => {
		const service1 = useTagService();
		const service2 = useTagService();

		// 同じオブジェクトへの参照を返すことを確認
		expect(service1).toBe(service2);
	});
});
