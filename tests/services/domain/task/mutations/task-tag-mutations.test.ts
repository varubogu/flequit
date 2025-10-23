/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { TaskTagMutations } from '$lib/services/domain/task/mutations/task-tag-mutations';
import type { Tag } from '$lib/types/tag';

const sampleTag = (): Tag => ({
	id: 'tag-1',
	name: 'Test Tag',
	color: '#ff0000'
});

const createDeps = () => {
	const taskStore = {
		getTaskProjectAndList: vi.fn().mockReturnValue({
			project: { id: 'project-1' },
			taskList: { id: 'list-1' }
		}),
		attachTagToTask: vi.fn(),
		detachTagFromTask: vi.fn().mockReturnValue(sampleTag())
	};

	const tagStore = {
		tags: [sampleTag()],
		addTagWithId: vi.fn()
	};

	const taggingService = {
		createTaskTag: vi.fn().mockResolvedValue(sampleTag()),
		deleteTaskTag: vi.fn().mockResolvedValue(undefined)
	};

	const errorHandler = {
		addSyncError: vi.fn()
	};

	return {
		taskStore,
		tagStore,
		taggingService,
		errorHandler
	};
};

describe('TaskTagMutations', () => {
	let deps: ReturnType<typeof createDeps>;
	let service: TaskTagMutations;

	beforeEach(() => {
		deps = createDeps();
		service = new TaskTagMutations(deps as any);
	});

	describe('addTagToTaskByName', () => {
		test('creates and attaches new tag', async () => {
			const newTag = { id: 'new-tag', name: 'New Tag', color: '#00ff00' };
			deps.taggingService.createTaskTag.mockResolvedValue(newTag);

			await service.addTagToTaskByName('task-1', 'New Tag');

			expect(deps.taggingService.createTaskTag).toHaveBeenCalledWith(
				'project-1',
				'task-1',
				'New Tag'
			);
			expect(deps.tagStore.addTagWithId).toHaveBeenCalledWith(newTag);
			expect(deps.taskStore.attachTagToTask).toHaveBeenCalledWith('task-1', newTag);
		});

		test('trims tag name before creating', async () => {
			await service.addTagToTaskByName('task-1', '  Trimmed Tag  ');

			expect(deps.taggingService.createTaskTag).toHaveBeenCalledWith(
				'project-1',
				'task-1',
				'Trimmed Tag'
			);
		});

		test('ignores empty tag name', async () => {
			await service.addTagToTaskByName('task-1', '   ');

			expect(deps.taggingService.createTaskTag).not.toHaveBeenCalled();
		});

		test('handles task not found', async () => {
			deps.taskStore.getTaskProjectAndList.mockReturnValue(null);

			await service.addTagToTaskByName('invalid-task', 'Tag');

			expect(deps.taggingService.createTaskTag).not.toHaveBeenCalled();
		});

		test('handles tag creation failure', async () => {
			const error = new Error('Tag creation failed');
			deps.taggingService.createTaskTag.mockRejectedValue(error);

			await service.addTagToTaskByName('task-1', 'Failed Tag');

			expect(deps.errorHandler.addSyncError).toHaveBeenCalledWith(
				'タスクタグ追加',
				'task',
				'task-1',
				error
			);
		});
	});

	describe('addTagToTask', () => {
		test('attaches existing tag to task', async () => {
			const existingTag = sampleTag();
			deps.tagStore.tags = [existingTag];

			await service.addTagToTask('task-1', 'tag-1');

			expect(deps.taggingService.createTaskTag).toHaveBeenCalledWith(
				'project-1',
				'task-1',
				'Test Tag'
			);
			expect(deps.taskStore.attachTagToTask).toHaveBeenCalledWith('task-1', sampleTag());
		});

		test('does nothing if tag not found in store', async () => {
			deps.tagStore.tags = [];

			await service.addTagToTask('task-1', 'non-existent-tag');

			expect(deps.taggingService.createTaskTag).not.toHaveBeenCalled();
		});

		test('handles task not found', async () => {
			deps.taskStore.getTaskProjectAndList.mockReturnValue(null);

			await service.addTagToTask('invalid-task', 'tag-1');

			expect(deps.taggingService.createTaskTag).not.toHaveBeenCalled();
		});

		test('handles tag attachment failure', async () => {
			const error = new Error('Attachment failed');
			deps.taggingService.createTaskTag.mockRejectedValue(error);

			await service.addTagToTask('task-1', 'tag-1');

			expect(deps.errorHandler.addSyncError).toHaveBeenCalledWith(
				'タスクタグ追加',
				'task',
				'task-1',
				error
			);
		});
	});

	describe('removeTagFromTask', () => {
		test('removes tag from task', async () => {
			const removedTag = sampleTag();
			deps.taskStore.detachTagFromTask.mockReturnValue(removedTag);

			await service.removeTagFromTask('task-1', 'tag-1');

			expect(deps.taskStore.detachTagFromTask).toHaveBeenCalledWith('task-1', 'tag-1');
			expect(deps.taggingService.deleteTaskTag).toHaveBeenCalledWith(
				'project-1',
				'task-1',
				'tag-1'
			);
		});

		test('does nothing if tag not attached', async () => {
			deps.taskStore.detachTagFromTask.mockReturnValue(null);

			await service.removeTagFromTask('task-1', 'tag-1');

			expect(deps.taggingService.deleteTaskTag).not.toHaveBeenCalled();
		});

		test('handles task not found', async () => {
			deps.taskStore.getTaskProjectAndList.mockReturnValue(null);

			await service.removeTagFromTask('invalid-task', 'tag-1');

			expect(deps.taskStore.detachTagFromTask).not.toHaveBeenCalled();
		});

		test('restores tag on deletion failure', async () => {
			const removedTag = sampleTag();
			deps.taskStore.detachTagFromTask.mockReturnValue(removedTag);
			const error = new Error('Deletion failed');
			deps.taggingService.deleteTaskTag.mockRejectedValue(error);

			await service.removeTagFromTask('task-1', 'tag-1');

			expect(deps.taskStore.attachTagToTask).toHaveBeenCalledWith('task-1', removedTag);
			expect(deps.errorHandler.addSyncError).toHaveBeenCalledWith(
				'タスクタグ削除',
				'task',
				'task-1',
				error
			);
		});
	});
});
