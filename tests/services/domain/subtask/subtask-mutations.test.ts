/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { SubTaskMutations } from '$lib/services/domain/subtask/subtask-mutations';
import type { TaskWithSubTasks } from '$lib/types/task';
import type { SubTask } from '$lib/types/sub-task';

const createDeps = () => {
	const mockTaskStore = {
		getTaskProjectAndList: vi.fn()
	};

	const mockTaskCoreStore = {
		updateTask: vi.fn()
	};

	const mockSubTaskStore = {
		addSubTask: vi.fn(),
		updateSubTask: vi.fn(),
		deleteSubTask: vi.fn(),
		attachTagToSubTask: vi.fn(),
		detachTagFromSubTask: vi.fn()
	};

	const mockTagStore = {
		tags: [] as Array<{ id: string; name: string }>
	};

	const mockTaggingService = {
		createSubtaskTag: vi.fn(),
		deleteSubtaskTag: vi.fn()
	};

	const mockErrorHandler = {
		addSyncError: vi.fn()
	};

	return {
		taskStore: mockTaskStore,
		taskCoreStore: mockTaskCoreStore,
		subTaskStore: mockSubTaskStore,
		tagStore: mockTagStore,
		taggingService: mockTaggingService,
		errorHandler: mockErrorHandler
	};
};

describe('SubTaskMutations', () => {
	let deps: ReturnType<typeof createDeps>;
	let service: SubTaskMutations;

	beforeEach(() => {
		deps = createDeps();
		service = new SubTaskMutations(deps);
	});

	describe('toggleSubTaskStatus', () => {
		test('toggles subtask status from not_started to completed', () => {
			const task: TaskWithSubTasks = {
				id: 'task-1',
				projectId: 'project-1',
				listId: 'list-1',
				title: 'Task',
				status: 'not_started',
				priority: 0,
				orderIndex: 0,
				isArchived: false,
				assignedUserIds: [],
				tagIds: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				subTasks: [
					{
						id: 'subtask-1',
						taskId: 'task-1',
						title: 'SubTask 1',
						status: 'not_started',
						priority: 0,
						orderIndex: 0,
						createdAt: new Date(),
						updatedAt: new Date(),
					} as SubTask
				],
				tags: []
			} as TaskWithSubTasks;

			service.toggleSubTaskStatus(task, 'subtask-1');

			expect(deps.taskCoreStore.updateTask).toHaveBeenCalledWith('task-1', {
				sub_tasks: [
					expect.objectContaining({
						id: 'subtask-1',
						status: 'completed'
					})
				]
			});
		});

		test('toggles subtask status from completed to not_started', () => {
			const task: TaskWithSubTasks = {
				id: 'task-1',
				projectId: 'project-1',
				listId: 'list-1',
				title: 'Task',
				status: 'not_started',
				priority: 0,
				orderIndex: 0,
				isArchived: false,
				assignedUserIds: [],
				tagIds: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				subTasks: [
					{
						id: 'subtask-1',
						taskId: 'task-1',
						title: 'SubTask 1',
						status: 'completed',
						priority: 0,
						orderIndex: 0,
						createdAt: new Date(),
						updatedAt: new Date(),
					} as SubTask
				],
				tags: []
			} as TaskWithSubTasks;

			service.toggleSubTaskStatus(task, 'subtask-1');

			expect(deps.taskCoreStore.updateTask).toHaveBeenCalledWith('task-1', {
				sub_tasks: [
					expect.objectContaining({
						id: 'subtask-1',
						status: 'not_started'
					})
				]
			});
		});

		test('does nothing when subtask is not found', () => {
			const task: TaskWithSubTasks = {
				id: 'task-1',
				projectId: 'project-1',
				listId: 'list-1',
				title: 'Task',
				status: 'not_started',
				priority: 0,
				orderIndex: 0,
				isArchived: false,
				assignedUserIds: [],
				tagIds: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				subTasks: [],
				tags: []
			} as TaskWithSubTasks;

			service.toggleSubTaskStatus(task, 'non-existent');

			expect(deps.taskCoreStore.updateTask).not.toHaveBeenCalled();
		});
	});

	describe('addSubTask', () => {
		test('creates subtask with provided data', async () => {
			const createdSubTask = {
				id: 'subtask-1',
				taskId: 'task-1',
				title: 'New SubTask',
				status: 'not_started',
				priority: 0
			} as SubTask;
			deps.subTaskStore.addSubTask.mockResolvedValueOnce(createdSubTask);

			const result = await service.addSubTask('task-1', {
				title: 'New SubTask',
				description: 'Description',
				priority: 3
			});

			expect(deps.subTaskStore.addSubTask).toHaveBeenCalledWith('task-1', {
				title: 'New SubTask',
				description: 'Description',
				status: 'not_started',
				priority: 3
			});
			expect(result).toBe(createdSubTask);
		});

		test('uses default priority when not provided', async () => {
			const createdSubTask = {
				id: 'subtask-1',
				taskId: 'task-1',
				title: 'New SubTask',
				status: 'not_started',
				priority: 0
			} as SubTask;
			deps.subTaskStore.addSubTask.mockResolvedValueOnce(createdSubTask);

			await service.addSubTask('task-1', { title: 'New SubTask' });

			expect(deps.subTaskStore.addSubTask).toHaveBeenCalledWith('task-1', {
				title: 'New SubTask',
				description: undefined,
				status: 'not_started',
				priority: 0
			});
		});
	});

	describe('updateSubTaskFromForm', () => {
		test('converts form data to subtask updates', () => {
			const formData = {
				title: 'Updated SubTask',
				description: 'Updated Description',
				planStartDate: new Date('2025-01-01'),
				planEndDate: new Date('2025-01-10'),
				isRangeDate: true,
				priority: 2
			};

			service.updateSubTaskFromForm('subtask-1', formData);

			expect(deps.subTaskStore.updateSubTask).toHaveBeenCalledWith('subtask-1', {
				title: 'Updated SubTask',
				description: 'Updated Description',
				planStartDate: formData.planStartDate,
				planEndDate: formData.planEndDate,
				isRangeDate: true,
				priority: 2
			});
		});

		test('handles empty description', () => {
			const formData = {
				title: 'Updated SubTask',
				description: '',
				priority: 1
			};

			service.updateSubTaskFromForm('subtask-1', formData);

			expect(deps.subTaskStore.updateSubTask).toHaveBeenCalledWith('subtask-1', {
				title: 'Updated SubTask',
				description: undefined,
				planStartDate: undefined,
				planEndDate: undefined,
				isRangeDate: false,
				priority: 1
			});
		});
	});

	describe('updateSubTask', () => {
		test('calls subTaskStore.updateSubTask with correct arguments', () => {
			const updates = { title: 'Updated Title', priority: 5 };

			service.updateSubTask('subtask-1', updates);

			expect(deps.subTaskStore.updateSubTask).toHaveBeenCalledWith('subtask-1', updates);
		});
	});

	describe('changeSubTaskStatus', () => {
		test('updates subtask status', () => {
			service.changeSubTaskStatus('subtask-1', 'completed');

			expect(deps.subTaskStore.updateSubTask).toHaveBeenCalledWith('subtask-1', {
				status: 'completed'
			});
		});
	});

	describe('deleteSubTask', () => {
		test('deletes subtask', async () => {
			deps.subTaskStore.deleteSubTask.mockResolvedValueOnce(undefined);

			await service.deleteSubTask('subtask-1');

			expect(deps.subTaskStore.deleteSubTask).toHaveBeenCalledWith('subtask-1');
		});
	});

	describe('addTagToSubTaskByName', () => {
		test('creates tag and attaches it to subtask', async () => {
			const createdTag = { id: 'tag-1', name: 'urgent' };
			deps.taskStore.getTaskProjectAndList.mockReturnValue({
				project: { id: 'project-1' },
				list: { id: 'list-1' },
				task: { id: 'task-1' }
			});
			deps.taggingService.createSubtaskTag.mockResolvedValueOnce(createdTag);

			await service.addTagToSubTaskByName('subtask-1', 'task-1', 'urgent');

			expect(deps.taggingService.createSubtaskTag).toHaveBeenCalledWith(
				'project-1',
				'subtask-1',
				'urgent'
			);
			expect(deps.subTaskStore.attachTagToSubTask).toHaveBeenCalledWith('subtask-1', createdTag);
		});

		test('does not create tag when name is empty', async () => {
			await service.addTagToSubTaskByName('subtask-1', 'task-1', '  ');

			expect(deps.taggingService.createSubtaskTag).not.toHaveBeenCalled();
			expect(deps.subTaskStore.attachTagToSubTask).not.toHaveBeenCalled();
		});

		test('does not create tag when task context is not found', async () => {
			deps.taskStore.getTaskProjectAndList.mockReturnValue(null);

			await service.addTagToSubTaskByName('subtask-1', 'task-1', 'urgent');

			expect(deps.taggingService.createSubtaskTag).not.toHaveBeenCalled();
			expect(deps.subTaskStore.attachTagToSubTask).not.toHaveBeenCalled();
		});

		test('handles error during tag creation', async () => {
			const error = new Error('Network error');
			deps.taskStore.getTaskProjectAndList.mockReturnValue({
				project: { id: 'project-1' },
				list: { id: 'list-1' },
				task: { id: 'task-1' }
			});
			deps.taggingService.createSubtaskTag.mockRejectedValueOnce(error);

			await service.addTagToSubTaskByName('subtask-1', 'task-1', 'urgent');

			expect(deps.errorHandler.addSyncError).toHaveBeenCalledWith(
				'サブタスクタグ追加',
				'subtask',
				'subtask-1',
				error
			);
			expect(deps.subTaskStore.attachTagToSubTask).not.toHaveBeenCalled();
		});
	});

	describe('addTagToSubTask', () => {
		test('adds existing tag to subtask by tag ID', async () => {
			const existingTag = { id: 'tag-1', name: 'urgent' };
			const createdTag = { id: 'tag-1', name: 'urgent' };
			deps.tagStore.tags = [existingTag];
			deps.taskStore.getTaskProjectAndList.mockReturnValue({
				project: { id: 'project-1' },
				list: { id: 'list-1' },
				task: { id: 'task-1' }
			});
			deps.taggingService.createSubtaskTag.mockResolvedValueOnce(createdTag);

			await service.addTagToSubTask('subtask-1', 'task-1', 'tag-1');

			expect(deps.taggingService.createSubtaskTag).toHaveBeenCalledWith(
				'project-1',
				'subtask-1',
				'urgent'
			);
			expect(deps.subTaskStore.attachTagToSubTask).toHaveBeenCalledWith('subtask-1', createdTag);
		});

		test('does nothing when tag is not found', async () => {
			deps.tagStore.tags = [];

			await service.addTagToSubTask('subtask-1', 'task-1', 'tag-1');

			expect(deps.taggingService.createSubtaskTag).not.toHaveBeenCalled();
			expect(deps.subTaskStore.attachTagToSubTask).not.toHaveBeenCalled();
		});

		test('does nothing when task context is not found', async () => {
			const existingTag = { id: 'tag-1', name: 'urgent' };
			deps.tagStore.tags = [existingTag];
			deps.taskStore.getTaskProjectAndList.mockReturnValue(null);

			await service.addTagToSubTask('subtask-1', 'task-1', 'tag-1');

			expect(deps.taggingService.createSubtaskTag).not.toHaveBeenCalled();
			expect(deps.subTaskStore.attachTagToSubTask).not.toHaveBeenCalled();
		});
	});

	describe('removeTagFromSubTask', () => {
		test('removes tag from subtask and syncs to backend', async () => {
			const removedTag = { id: 'tag-1', name: 'urgent' };
			deps.taskStore.getTaskProjectAndList.mockReturnValue({
				project: { id: 'project-1' },
				list: { id: 'list-1' },
				task: { id: 'task-1' }
			});
			deps.subTaskStore.detachTagFromSubTask.mockReturnValue(removedTag);
			deps.taggingService.deleteSubtaskTag.mockResolvedValueOnce(undefined);

			await service.removeTagFromSubTask('subtask-1', 'task-1', 'tag-1');

			expect(deps.subTaskStore.detachTagFromSubTask).toHaveBeenCalledWith('subtask-1', 'tag-1');
			expect(deps.taggingService.deleteSubtaskTag).toHaveBeenCalledWith(
				'project-1',
				'subtask-1',
				'tag-1'
			);
		});

		test('does nothing when task context is not found', async () => {
			deps.taskStore.getTaskProjectAndList.mockReturnValue(null);

			await service.removeTagFromSubTask('subtask-1', 'task-1', 'tag-1');

			expect(deps.subTaskStore.detachTagFromSubTask).not.toHaveBeenCalled();
			expect(deps.taggingService.deleteSubtaskTag).not.toHaveBeenCalled();
		});

		test('does nothing when tag was not removed from store', async () => {
			deps.taskStore.getTaskProjectAndList.mockReturnValue({
				project: { id: 'project-1' },
				list: { id: 'list-1' },
				task: { id: 'task-1' }
			});
			deps.subTaskStore.detachTagFromSubTask.mockReturnValue(null);

			await service.removeTagFromSubTask('subtask-1', 'task-1', 'tag-1');

			expect(deps.taggingService.deleteSubtaskTag).not.toHaveBeenCalled();
		});

		test('re-attaches tag when backend sync fails', async () => {
			const removedTag = { id: 'tag-1', name: 'urgent' };
			const error = new Error('Network error');
			deps.taskStore.getTaskProjectAndList.mockReturnValue({
				project: { id: 'project-1' },
				list: { id: 'list-1' },
				task: { id: 'task-1' }
			});
			deps.subTaskStore.detachTagFromSubTask.mockReturnValue(removedTag);
			deps.taggingService.deleteSubtaskTag.mockRejectedValueOnce(error);

			await service.removeTagFromSubTask('subtask-1', 'task-1', 'tag-1');

			expect(deps.subTaskStore.attachTagToSubTask).toHaveBeenCalledWith('subtask-1', removedTag);
			expect(deps.errorHandler.addSyncError).toHaveBeenCalledWith(
				'サブタスクタグ削除',
				'subtask',
				'subtask-1',
				error
			);
		});
	});

	describe('updateSubTaskDueDateForView', () => {
		test('sets due date to today for "today" view', () => {
			service.updateSubTaskDueDateForView('subtask-1', 'task-1', 'today');

			expect(deps.subTaskStore.updateSubTask).toHaveBeenCalledWith('subtask-1', {
				planEndDate: expect.any(Date)
			});
		});

		test('sets due date to tomorrow for "tomorrow" view', () => {
			service.updateSubTaskDueDateForView('subtask-1', 'task-1', 'tomorrow');

			expect(deps.subTaskStore.updateSubTask).toHaveBeenCalledWith('subtask-1', {
				planEndDate: expect.any(Date)
			});
		});

		test('sets due date for "next3days" view', () => {
			service.updateSubTaskDueDateForView('subtask-1', 'task-1', 'next3days');

			expect(deps.subTaskStore.updateSubTask).toHaveBeenCalledWith('subtask-1', {
				planEndDate: expect.any(Date)
			});
		});

		test('sets due date for "nextweek" view', () => {
			service.updateSubTaskDueDateForView('subtask-1', 'task-1', 'nextweek');

			expect(deps.subTaskStore.updateSubTask).toHaveBeenCalledWith('subtask-1', {
				planEndDate: expect.any(Date)
			});
		});

		test('sets due date for "thismonth" view', () => {
			service.updateSubTaskDueDateForView('subtask-1', 'task-1', 'thismonth');

			expect(deps.subTaskStore.updateSubTask).toHaveBeenCalledWith('subtask-1', {
				planEndDate: expect.any(Date)
			});
		});

		test('does nothing for unknown view ID', () => {
			service.updateSubTaskDueDateForView('subtask-1', 'task-1', 'unknown-view');

			expect(deps.subTaskStore.updateSubTask).not.toHaveBeenCalled();
		});
	});
});
