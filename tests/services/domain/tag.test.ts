import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TagService } from '$lib/services/domain/tag';
import type { Tag } from '$lib/types/tag';
import * as backendClient from '$lib/infrastructure/backend-client';
import { tagStore as tagStoreInternal } from '$lib/stores/tags/tag-store.svelte';
import { errorHandler } from '$lib/stores/error-handler.svelte';
import { taskStore } from '$lib/stores/tasks.svelte';
import { buildTag } from '../../factories/domain';

// Mock modules
vi.mock('$lib/infrastructure/backend-client');
vi.mock('$lib/services/domain/tag', async () => {
	const actual = await vi.importActual<typeof import('$lib/services/domain/tag')>(
		'$lib/services/domain/tag'
	);
	return actual;
});
vi.mock('$lib/stores/tags/tag-store.svelte', () => ({
	tagStore: {
		findTagByName: vi.fn(),
		findTagById: vi.fn(),
		addTagToStore: vi.fn(),
		updateTagInStore: vi.fn(),
		deleteTagFromStore: vi.fn()
	}
}));
vi.mock('$lib/stores/error-handler.svelte', () => ({
	errorHandler: {
		addSyncError: vi.fn()
	}
}));
vi.mock('$lib/stores/tasks.svelte', () => ({
	taskStore: {
		getProjectIdByTagId: vi.fn()
	}
}));
vi.mock('$lib/utils/user-id-helper', () => ({
	getCurrentUserId: vi.fn(() => 'system')
}));

describe('TagService', () => {
	const mockBackend = {
		tag: {
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn()
		}
	};

const mockTag: Tag = buildTag({ id: 'tag-1', name: 'Important', color: '#ff0000' });

	const projectId = 'project-1';

	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(backendClient.resolveBackend).mockResolvedValue(mockBackend as any);
		// Mock crypto.randomUUID
		vi.stubGlobal('crypto', {
			randomUUID: () => 'mock-uuid-123'
		});
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('createTag', () => {
		it('should create a new tag', async () => {
			vi.mocked(tagStoreInternal.findTagByName).mockReturnValue(undefined);
			mockBackend.tag.create.mockResolvedValue(undefined);

			const result = await TagService.createTag(projectId, {
				name: 'New Tag',
				color: '#00ff00'
			});

			expect(tagStoreInternal.findTagByName).toHaveBeenCalledWith('New Tag');
			expect(tagStoreInternal.addTagToStore).toHaveBeenCalled();
			expect(mockBackend.tag.create).toHaveBeenCalledWith(
				projectId,
				expect.objectContaining({
					name: 'New Tag',
					color: '#00ff00',
					id: expect.any(String),
					createdAt: expect.any(Date),
					updatedAt: expect.any(Date),
					updatedBy: 'system',
					deleted: false
				}),
				'system'
			);
			expect(result).not.toBeNull();
			expect(result?.name).toBe('New Tag');
		});

		it('should return existing tag if name already exists', async () => {
			vi.mocked(tagStoreInternal.findTagByName).mockReturnValue(mockTag);

			const result = await TagService.createTag(projectId, { name: 'Important' });

			expect(result).toEqual(mockTag);
			expect(tagStoreInternal.addTagToStore).not.toHaveBeenCalled();
			expect(mockBackend.tag.create).not.toHaveBeenCalled();
		});

		it('should trim tag name', async () => {
			vi.mocked(tagStoreInternal.findTagByName).mockReturnValue(undefined);
			mockBackend.tag.create.mockResolvedValue(undefined);

			const result = await TagService.createTag(projectId, { name: '  Spaced Tag  ' });

			expect(tagStoreInternal.findTagByName).toHaveBeenCalledWith('Spaced Tag');
			expect(result?.name).toBe('Spaced Tag');
		});

		it('should return null for empty tag name', async () => {
			const result = await TagService.createTag(projectId, { name: '   ' });

			expect(result).toBeNull();
			expect(tagStoreInternal.addTagToStore).not.toHaveBeenCalled();
		});

		it('should rollback on backend sync error', async () => {
			vi.mocked(tagStoreInternal.findTagByName).mockReturnValue(undefined);
			const error = new Error('Backend error');
			mockBackend.tag.create.mockRejectedValue(error);

			const result = await TagService.createTag(projectId, { name: 'Fail Tag' });

			expect(tagStoreInternal.addTagToStore).toHaveBeenCalled();
			expect(tagStoreInternal.deleteTagFromStore).toHaveBeenCalled();
			expect(errorHandler.addSyncError).toHaveBeenCalledWith(
				'タグ作成',
				'tag',
				expect.any(String),
				error
			);
			expect(result).toBeNull();
		});
	});

	describe('updateTag', () => {
		it('should update existing tag', async () => {
			vi.mocked(tagStoreInternal.findTagById).mockReturnValue(mockTag);
			mockBackend.tag.update.mockResolvedValue(undefined);

			await TagService.updateTag(projectId, 'tag-1', { name: 'Updated Tag' });

			expect(tagStoreInternal.updateTagInStore).toHaveBeenCalledWith('tag-1', {
				name: 'Updated Tag'
			});
			expect(mockBackend.tag.update).toHaveBeenCalledWith(
				projectId,
				'tag-1',
				expect.objectContaining({
					name: 'Updated Tag',
					updatedAt: expect.any(Date)
				}),
				'system'
			);
		});

		it('should not update if tag not found', async () => {
			vi.mocked(tagStoreInternal.findTagById).mockReturnValue(undefined);

			await TagService.updateTag(projectId, 'non-existent', { name: 'Updated' });

			expect(tagStoreInternal.updateTagInStore).not.toHaveBeenCalled();
			expect(mockBackend.tag.update).not.toHaveBeenCalled();
		});

		it('should rollback on backend sync error', async () => {
			vi.mocked(tagStoreInternal.findTagById).mockReturnValue(mockTag);
			const error = new Error('Backend error');
			mockBackend.tag.update.mockRejectedValue(error);

			await TagService.updateTag(projectId, 'tag-1', { name: 'Fail Update' });

			expect(tagStoreInternal.updateTagInStore).toHaveBeenCalledTimes(2); // Once for update, once for rollback
			expect(errorHandler.addSyncError).toHaveBeenCalledWith('タグ更新', 'tag', 'tag-1', error);
		});
	});

	describe('deleteTag', () => {
		it('should delete existing tag', async () => {
			vi.mocked(tagStoreInternal.findTagById).mockReturnValue(mockTag);
			mockBackend.tag.delete.mockResolvedValue(undefined);
			const onDelete = vi.fn();

			await TagService.deleteTag(projectId, 'tag-1', onDelete);

			expect(tagStoreInternal.deleteTagFromStore).toHaveBeenCalledWith('tag-1');
			expect(mockBackend.tag.delete).toHaveBeenCalledWith(projectId, 'tag-1', 'system');
			expect(onDelete).toHaveBeenCalledWith('tag-1');
		});

		it('should not delete if tag not found', async () => {
			vi.mocked(tagStoreInternal.findTagById).mockReturnValue(undefined);

			await TagService.deleteTag(projectId, 'non-existent');

			expect(tagStoreInternal.deleteTagFromStore).not.toHaveBeenCalled();
			expect(mockBackend.tag.delete).not.toHaveBeenCalled();
		});

		it('should rollback on backend sync error', async () => {
			vi.mocked(tagStoreInternal.findTagById).mockReturnValue(mockTag);
			const error = new Error('Backend error');
			mockBackend.tag.delete.mockRejectedValue(error);

			await TagService.deleteTag(projectId, 'tag-1');

			expect(tagStoreInternal.deleteTagFromStore).toHaveBeenCalled();
			expect(tagStoreInternal.addTagToStore).toHaveBeenCalledWith(mockTag); // Rollback
			expect(errorHandler.addSyncError).toHaveBeenCalledWith('タグ削除', 'tag', 'tag-1', error);
		});
	});

	describe('getOrCreateTag', () => {
		it('should return existing tag', async () => {
			vi.mocked(tagStoreInternal.findTagByName).mockReturnValue(mockTag);

			const result = await TagService.getOrCreateTag(projectId, 'Important');

			expect(result).toEqual(mockTag);
			expect(mockBackend.tag.create).not.toHaveBeenCalled();
		});

		it('should create new tag if not exists', async () => {
			vi.mocked(tagStoreInternal.findTagByName).mockReturnValue(undefined);
			mockBackend.tag.create.mockResolvedValue(undefined);

			const result = await TagService.getOrCreateTag(projectId, 'New Tag', '#0000ff');

			expect(tagStoreInternal.addTagToStore).toHaveBeenCalled();
			expect(mockBackend.tag.create).toHaveBeenCalled();
			expect(result?.name).toBe('New Tag');
			expect(result?.color).toBe('#0000ff');
		});

		it('should return null for empty name', async () => {
			const result = await TagService.getOrCreateTag(projectId, '  ');

			expect(result).toBeNull();
		});
	});

	describe('getProjectIdByTagId', () => {
		it('should get project id by tag id', async () => {
			vi.mocked(taskStore.getProjectIdByTagId).mockResolvedValue('project-123');

			const result = await TagService.getProjectIdByTagId('tag-1');

			expect(taskStore.getProjectIdByTagId).toHaveBeenCalledWith('tag-1');
			expect(result).toBe('project-123');
		});

		it('should return null if project not found', async () => {
			vi.mocked(taskStore.getProjectIdByTagId).mockResolvedValue(null);

			const result = await TagService.getProjectIdByTagId('non-existent');

			expect(result).toBeNull();
		});

		it('should coerce undefined responses to null', async () => {
			vi.mocked(taskStore.getProjectIdByTagId).mockResolvedValue(
				undefined as unknown as string | null
			);

			const result = await TagService.getProjectIdByTagId('tag-undefined');

			expect(result).toBeNull();
		});

		it('should handle synchronous responses from store', async () => {
			vi.mocked(taskStore.getProjectIdByTagId).mockImplementation(() => 'project-sync');

			const result = await TagService.getProjectIdByTagId('tag-sync');

			expect(result).toBe('project-sync');
		});
	});

	describe('bookmark operations', () => {
		it('should add bookmark', async () => {
			// TagBookmarkServiceをモック
			vi.doMock('$lib/services/domain/tag-bookmark', () => ({
				TagBookmarkService: {
					create: vi.fn().mockResolvedValue(undefined)
				}
			}));

			await TagService.addBookmark(projectId, 'tag-1');

			// TagBookmarkServiceのcreateが呼ばれることを確認
			const { TagBookmarkService } = await import('$lib/services/domain/tag-bookmark');
			expect(TagBookmarkService.create).toHaveBeenCalledWith(projectId, 'tag-1');
		});

		it('should remove bookmark', async () => {
			// TagBookmarkServiceとtagBookmarkStoreをモック
			vi.doMock('$lib/services/domain/tag-bookmark', () => ({
				TagBookmarkService: {
					delete: vi.fn().mockResolvedValue(undefined)
				}
			}));
			vi.doMock('$lib/stores/tags/tag-bookmark-store.svelte', () => ({
				tagBookmarkStore: {
					findBookmarkByTagId: vi.fn().mockReturnValue({ id: 'bookmark-1' })
				}
			}));

			await TagService.removeBookmark(projectId, 'tag-1');

			const { TagBookmarkService } = await import('$lib/services/domain/tag-bookmark');
			const { tagBookmarkStore } = await import('$lib/stores/tags/tag-bookmark-store.svelte');
			expect(tagBookmarkStore.findBookmarkByTagId).toHaveBeenCalledWith('tag-1');
			expect(TagBookmarkService.delete).toHaveBeenCalledWith('bookmark-1', 'tag-1');
		});

		it('should surface errors from addBookmark', async () => {
			const error = new Error('bookmark failed');
			vi.doMock('$lib/services/domain/tag-bookmark', () => ({
				TagBookmarkService: {
					create: vi.fn().mockRejectedValue(error)
				}
			}));

			await expect(TagService.addBookmark(projectId, 'tag-1')).rejects.toThrow('bookmark failed');
		});
	});

	describe('notifyTagUpdate', () => {
		it('should dispatch tag-updated event', () => {
			const dispatchEvent = vi.fn();
			global.window = { dispatchEvent } as any;

			TagService.notifyTagUpdate(mockTag);

			expect(dispatchEvent).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'tag-updated',
					detail: mockTag
				})
			);
		});

		it('should not dispatch event if window is undefined', () => {
			const originalWindow = global.window;
			// @ts-expect-error - Setting window to undefined for test
			global.window = undefined;

			expect(() => TagService.notifyTagUpdate(mockTag)).not.toThrow();

			global.window = originalWindow;
		});
	});
});
