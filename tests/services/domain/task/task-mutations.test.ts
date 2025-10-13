import { beforeEach, describe, expect, test, vi } from 'vitest';
import { TaskMutations } from '$lib/services/domain/task/task-mutations';
import type { TaskWithSubTasks } from '$lib/types/task';

const createDeps = () => {
	const mockTaskStore = {
		selectedTaskId: null as string | null,
		getTaskById: vi.fn(),
		getTaskProjectAndList: vi.fn(),
		attachTagToTask: vi.fn(),
		detachTagFromTask: vi.fn()
	};

	const mockTaskCoreStore = {
		toggleTaskStatus: vi.fn(),
		updateTask: vi.fn(),
		deleteTask: vi.fn(),
		addTask: vi.fn()
	};

	const mockTaskListStore = {
		getProjectIdByListId: vi.fn()
	};

	const mockTagStore = {
		tags: [] as Array<{ id: string; name: string }>
	};

	const mockTaggingService = {
		createTaskTag: vi.fn(),
		deleteTaskTag: vi.fn()
	};

	const mockErrorHandler = {
		addSyncError: vi.fn()
	};

	const mockRecurrenceService = {
		scheduleNextOccurrence: vi.fn()
	};

	return {
		taskStore: mockTaskStore,
		taskCoreStore: mockTaskCoreStore,
		taskListStore: mockTaskListStore,
		tagStore: mockTagStore,
		taggingService: mockTaggingService,
		errorHandler: mockErrorHandler,
		recurrenceService: mockRecurrenceService
	};
};

describe('TaskMutations', () => {
	let deps: ReturnType<typeof createDeps>;
	let service: TaskMutations;

	beforeEach(() => {
		deps = createDeps();
		service = new TaskMutations(deps);
	});

	describe('toggleTaskStatus', () => {
		test('awaits underlying store call', async () => {
			deps.taskCoreStore.toggleTaskStatus.mockResolvedValueOnce(undefined);

			const promise = service.toggleTaskStatus('task-1');

			await expect(promise).resolves.toBeUndefined();
			expect(deps.taskCoreStore.toggleTaskStatus).toHaveBeenCalledWith('task-1');
		});
	});

	describe('updateTask', () => {
		test('calls taskCoreStore.updateTask with correct arguments', () => {
			const updates = { title: 'Updated Title', priority: 5 };

			service.updateTask('task-1', updates);

			expect(deps.taskCoreStore.updateTask).toHaveBeenCalledWith('task-1', updates);
		});
	});

	describe('updateTaskFromForm', () => {
		test('converts form data to task updates and calls updateTask', () => {
			const formData = {
				title: 'Task Title',
				description: 'Task Description',
				planStartDate: new Date('2025-01-01'),
				planEndDate: new Date('2025-01-10'),
				isRangeDate: true,
				priority: 3
			};

			service.updateTaskFromForm('task-1', formData);

			expect(deps.taskCoreStore.updateTask).toHaveBeenCalledWith('task-1', {
				title: 'Task Title',
				description: 'Task Description',
				planStartDate: formData.planStartDate,
				planEndDate: formData.planEndDate,
				isRangeDate: true,
				priority: 3
			});
		});
	});

	describe('changeTaskStatus', () => {
		test('triggers recurrence scheduling when task completed with recurrence rule', async () => {
			const task: TaskWithSubTasks = {
				id: 'task-1',
				projectId: 'project-1',
				listId: 'list-1',
				title: 'recurring task',
				status: 'not_started',
				priority: 0,
				orderIndex: 0,
				isArchived: false,
				assignedUserIds: [],
				tagIds: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				subTasks: [],
				tags: [],
				recurrenceRule: {
					unit: 'day',
					interval: 1
				}
			} as TaskWithSubTasks;

			deps.taskStore.getTaskById.mockReturnValue(task);
			deps.taskCoreStore.updateTask.mockResolvedValueOnce(undefined);

			await service.changeTaskStatus('task-1', 'completed');

			expect(deps.recurrenceService.scheduleNextOccurrence).toHaveBeenCalledWith(task);
			expect(deps.taskCoreStore.updateTask).toHaveBeenCalledWith('task-1', {
				status: 'completed'
			});
		});

		test('does not trigger recurrence when task has no recurrence rule', async () => {
			const task: TaskWithSubTasks = {
				id: 'task-1',
				projectId: 'project-1',
				listId: 'list-1',
				title: 'normal task',
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

			deps.taskStore.getTaskById.mockReturnValue(task);
			deps.taskCoreStore.updateTask.mockResolvedValueOnce(undefined);

			await service.changeTaskStatus('task-1', 'completed');

			expect(deps.recurrenceService.scheduleNextOccurrence).not.toHaveBeenCalled();
			expect(deps.taskCoreStore.updateTask).toHaveBeenCalledWith('task-1', {
				status: 'completed'
			});
		});
	});

	describe('deleteTask', () => {
		test('clears selection and awaits deletion', async () => {
			deps.taskStore.selectedTaskId = 'task-1';
			deps.taskCoreStore.deleteTask.mockResolvedValueOnce(undefined);

			const promise = service.deleteTask('task-1');

			await expect(promise).resolves.toBeUndefined();
			expect(deps.taskStore.selectedTaskId).toBeNull();
			expect(deps.taskCoreStore.deleteTask).toHaveBeenCalledWith('task-1');
		});

		test('does not clear selection if different task is selected', async () => {
			deps.taskStore.selectedTaskId = 'task-2';
			deps.taskCoreStore.deleteTask.mockResolvedValueOnce(undefined);

			await service.deleteTask('task-1');

			expect(deps.taskStore.selectedTaskId).toBe('task-2');
			expect(deps.taskCoreStore.deleteTask).toHaveBeenCalledWith('task-1');
		});
	});

	describe('addTask', () => {
		test('resolves with created task when successful', async () => {
			const returnedTask = {
				id: 'new-task',
				title: 'New Task'
			} as TaskWithSubTasks;
			deps.taskListStore.getProjectIdByListId.mockReturnValue('project-1');
			deps.taskCoreStore.addTask.mockResolvedValueOnce(returnedTask);

			const result = await service.addTask('list-1', { title: 'New Task' });

			expect(result).toBe(returnedTask);
			expect(deps.taskCoreStore.addTask).toHaveBeenCalledWith('list-1', {
				projectId: 'project-1',
				listId: 'list-1',
				title: 'New Task',
				description: undefined,
				status: 'not_started',
				priority: 0,
				assignedUserIds: [],
				tagIds: [],
				orderIndex: 0,
				isArchived: false,
				createdAt: expect.any(Date),
				updatedAt: expect.any(Date)
			});
		});

		test('returns null when project resolution fails', async () => {
			deps.taskListStore.getProjectIdByListId.mockReturnValue(null);

			const result = await service.addTask('list-1', { title: 'New Task' });

			expect(result).toBeNull();
			expect(deps.taskCoreStore.addTask).not.toHaveBeenCalled();
		});
	});

	describe('addTagToTaskByName', () => {
		test('creates tag and attaches it to task', async () => {
			const createdTag = { id: 'tag-1', name: 'urgent' };
			deps.taskStore.getTaskProjectAndList.mockReturnValue({
				project: { id: 'project-1' },
				list: { id: 'list-1' },
				task: { id: 'task-1' }
			});
			deps.taggingService.createTaskTag.mockResolvedValueOnce(createdTag);

			await service.addTagToTaskByName('task-1', 'urgent');

			expect(deps.taggingService.createTaskTag).toHaveBeenCalledWith(
				'project-1',
				'task-1',
				'urgent'
			);
			expect(deps.taskStore.attachTagToTask).toHaveBeenCalledWith('task-1', createdTag);
		});

		test('does not create tag when name is empty', async () => {
			await service.addTagToTaskByName('task-1', '  ');

			expect(deps.taggingService.createTaskTag).not.toHaveBeenCalled();
			expect(deps.taskStore.attachTagToTask).not.toHaveBeenCalled();
		});

		test('does not create tag when task context is not found', async () => {
			deps.taskStore.getTaskProjectAndList.mockReturnValue(null);

			await service.addTagToTaskByName('task-1', 'urgent');

			expect(deps.taggingService.createTaskTag).not.toHaveBeenCalled();
			expect(deps.taskStore.attachTagToTask).not.toHaveBeenCalled();
		});

		test('handles error during tag creation', async () => {
			const error = new Error('Network error');
			deps.taskStore.getTaskProjectAndList.mockReturnValue({
				project: { id: 'project-1' },
				list: { id: 'list-1' },
				task: { id: 'task-1' }
			});
			deps.taggingService.createTaskTag.mockRejectedValueOnce(error);

			await service.addTagToTaskByName('task-1', 'urgent');

			expect(deps.errorHandler.addSyncError).toHaveBeenCalledWith(
				'タスクタグ追加',
				'task',
				'task-1',
				error
			);
			expect(deps.taskStore.attachTagToTask).not.toHaveBeenCalled();
		});
	});

	describe('addTagToTask', () => {
		test('adds existing tag to task by tag ID', async () => {
			const existingTag = { id: 'tag-1', name: 'urgent' };
			const createdTag = { id: 'tag-1', name: 'urgent' };
			deps.tagStore.tags = [existingTag];
			deps.taskStore.getTaskProjectAndList.mockReturnValue({
				project: { id: 'project-1' },
				list: { id: 'list-1' },
				task: { id: 'task-1' }
			});
			deps.taggingService.createTaskTag.mockResolvedValueOnce(createdTag);

			await service.addTagToTask('task-1', 'tag-1');

			expect(deps.taggingService.createTaskTag).toHaveBeenCalledWith(
				'project-1',
				'task-1',
				'urgent'
			);
			expect(deps.taskStore.attachTagToTask).toHaveBeenCalledWith('task-1', createdTag);
		});

		test('does nothing when tag is not found', async () => {
			deps.tagStore.tags = [];

			await service.addTagToTask('task-1', 'tag-1');

			expect(deps.taggingService.createTaskTag).not.toHaveBeenCalled();
			expect(deps.taskStore.attachTagToTask).not.toHaveBeenCalled();
		});
	});

	describe('removeTagFromTask', () => {
		test('removes tag from task and syncs to backend', async () => {
			const removedTag = { id: 'tag-1', name: 'urgent' };
			deps.taskStore.getTaskProjectAndList.mockReturnValue({
				project: { id: 'project-1' },
				list: { id: 'list-1' },
				task: { id: 'task-1' }
			});
			deps.taskStore.detachTagFromTask.mockReturnValue(removedTag);
			deps.taggingService.deleteTaskTag.mockResolvedValueOnce(undefined);

			await service.removeTagFromTask('task-1', 'tag-1');

			expect(deps.taskStore.detachTagFromTask).toHaveBeenCalledWith('task-1', 'tag-1');
			expect(deps.taggingService.deleteTaskTag).toHaveBeenCalledWith(
				'project-1',
				'task-1',
				'tag-1'
			);
		});

		test('does nothing when task context is not found', async () => {
			deps.taskStore.getTaskProjectAndList.mockReturnValue(null);

			await service.removeTagFromTask('task-1', 'tag-1');

			expect(deps.taskStore.detachTagFromTask).not.toHaveBeenCalled();
			expect(deps.taggingService.deleteTaskTag).not.toHaveBeenCalled();
		});

		test('does nothing when tag was not removed from store', async () => {
			deps.taskStore.getTaskProjectAndList.mockReturnValue({
				project: { id: 'project-1' },
				list: { id: 'list-1' },
				task: { id: 'task-1' }
			});
			deps.taskStore.detachTagFromTask.mockReturnValue(null);

			await service.removeTagFromTask('task-1', 'tag-1');

			expect(deps.taggingService.deleteTaskTag).not.toHaveBeenCalled();
		});

		test('re-attaches tag when backend sync fails', async () => {
			const removedTag = { id: 'tag-1', name: 'urgent' };
			const error = new Error('Network error');
			deps.taskStore.getTaskProjectAndList.mockReturnValue({
				project: { id: 'project-1' },
				list: { id: 'list-1' },
				task: { id: 'task-1' }
			});
			deps.taskStore.detachTagFromTask.mockReturnValue(removedTag);
			deps.taggingService.deleteTaskTag.mockRejectedValueOnce(error);

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

	describe('updateTaskDueDateForView', () => {
		test('sets due date to today for "today" view', () => {
			const today = new Date();

			service.updateTaskDueDateForView('task-1', 'today');

			expect(deps.taskCoreStore.updateTask).toHaveBeenCalledWith('task-1', {
				planEndDate: expect.any(Date)
			});
		});

		test('sets due date to tomorrow for "tomorrow" view', () => {
			service.updateTaskDueDateForView('task-1', 'tomorrow');

			expect(deps.taskCoreStore.updateTask).toHaveBeenCalledWith('task-1', {
				planEndDate: expect.any(Date)
			});
		});

		test('does nothing for unknown view ID', () => {
			service.updateTaskDueDateForView('task-1', 'unknown-view');

			expect(deps.taskCoreStore.updateTask).not.toHaveBeenCalled();
		});
	});
});
