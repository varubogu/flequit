/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { TaskMutations } from '$lib/services/domain/task/task-mutations';
import type { TaskWithSubTasks } from '$lib/types/task';
import type { TaskRemovalContext } from '$lib/stores/task-core-store.svelte';

/**
 * TaskMutations Facade統合テスト
 *
 * このテストは、Facadeが各mutationクラスに正しく委譲していることを確認します。
 * 個別のmutationクラスの詳細なテストは、mutations/配下の各テストファイルで実施されます。
 */

const sampleTask = (): TaskWithSubTasks => ({
	id: 'task-1',
	projectId: 'project-1',
	listId: 'list-1',
	title: 'Sample',
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
});

const createDeps = () => {
	const task = sampleTask();
	const taskStore = {
		selectedTaskId: null as string | null,
		getTaskById: vi.fn().mockReturnValue(task),
		getTaskProjectAndList: vi.fn().mockReturnValue({
			project: { id: 'project-1' },
			taskList: { id: 'list-1' }
		}),
		attachTagToTask: vi.fn(),
		detachTagFromTask: vi.fn()
	};

	const taskCoreStore = {
		applyTaskUpdate: vi.fn().mockReturnValue(true),
		updateTask: vi.fn().mockReturnValue(true),
		insertTask: vi.fn().mockImplementation((_listId, newTask) => newTask),
		removeTask: vi.fn().mockReturnValue({
			project: { id: 'project-1' },
			taskList: { id: 'list-1', tasks: [] },
			task,
			index: 0
		}),
		restoreTask: vi.fn(),
		moveTaskBetweenLists: vi.fn().mockReturnValue({
			task,
			sourceProject: { id: 'project-1' },
			sourceTaskList: { id: 'list-1', tasks: [] },
			sourceIndex: 0,
			targetProject: { id: 'project-2' },
			targetTaskList: { id: 'list-2', tasks: [] },
			targetIndex: 0
		}),
		restoreTaskMove: vi.fn()
	};

	const taskListStore = {
		getProjectIdByListId: vi.fn().mockReturnValue('project-1')
	};

	const tagStore = { tags: [], addTagWithId: vi.fn() };
	const taggingService = {
		createTaskTag: vi.fn(),
		deleteTaskTag: vi.fn()
	};
	const errorHandler = {
		addSyncError: vi.fn()
	};
	const taskService = {
		createTaskWithSubTasks: vi.fn().mockResolvedValue(undefined),
		updateTaskWithSubTasks: vi.fn().mockResolvedValue(undefined),
		deleteTaskWithSubTasks: vi.fn().mockResolvedValue(true),
		updateTask: vi.fn().mockResolvedValue(undefined)
	};
	const recurrenceService = {
		scheduleNextOccurrence: vi.fn()
	};

	return {
		taskStore,
		taskCoreStore,
		taskListStore,
		tagStore,
		taggingService,
		errorHandler,
		taskService,
		recurrenceService
	};
};

describe('TaskMutations (Facade)', () => {
	let deps: ReturnType<typeof createDeps>;
	let service: TaskMutations;

	beforeEach(() => {
		deps = createDeps();
		service = new TaskMutations(deps as any);
	});

	describe('CRUD operations delegation', () => {
		test('updateTask delegates to TaskCrudMutations', async () => {
			await service.updateTask('task-1', { title: 'Updated' });

			expect(deps.taskCoreStore.applyTaskUpdate).toHaveBeenCalledWith(
				'task-1',
				expect.any(Function)
			);
			expect(deps.taskService.updateTaskWithSubTasks).toHaveBeenCalledWith(
				'project-1',
				'task-1',
				expect.objectContaining({ title: 'Updated' })
			);
		});

		test('addTask delegates to TaskCrudMutations', async () => {
			const result = await service.addTask('list-1', { title: 'New' });

			expect(result).not.toBeNull();
			expect(deps.taskCoreStore.insertTask).toHaveBeenCalled();
			expect(deps.taskService.createTaskWithSubTasks).toHaveBeenCalled();
		});

		test('deleteTask delegates to TaskCrudMutations', async () => {
			await service.deleteTask('task-1');

			expect(deps.taskCoreStore.removeTask).toHaveBeenCalledWith('task-1');
			expect(deps.taskService.deleteTaskWithSubTasks).toHaveBeenCalled();
		});

		test('updateTaskFromForm delegates to TaskCrudMutations', async () => {
			const formData = {
				title: 'New Title',
				description: 'Description',
				priority: 5,
				planStartDate: new Date(),
				planEndDate: new Date(),
				isRangeDate: true
			};

			await service.updateTaskFromForm('task-1', formData);

			expect(deps.taskCoreStore.applyTaskUpdate).toHaveBeenCalled();
		});

		test('updateTaskDueDateForView delegates to TaskCrudMutations', async () => {
			await service.updateTaskDueDateForView('task-1', 'today');

			expect(deps.taskService.updateTaskWithSubTasks).toHaveBeenCalled();
		});
	});

	describe('Status operations delegation', () => {
		test('toggleTaskStatus delegates to TaskStatusMutations', async () => {
			await service.toggleTaskStatus('task-1');

			expect(deps.taskCoreStore.applyTaskUpdate).toHaveBeenCalled();
		});

		test('changeTaskStatus delegates to TaskStatusMutations', async () => {
			await service.changeTaskStatus('task-1', 'in_progress');

			expect(deps.taskCoreStore.applyTaskUpdate).toHaveBeenCalled();
		});

		test('changeTaskStatus handles recurrence', async () => {
			const task = sampleTask();
			task.recurrenceRule = { unit: 'day', interval: 1 };
			deps.taskStore.getTaskById.mockReturnValue(task);

			await service.changeTaskStatus('task-1', 'completed');

			expect(deps.recurrenceService.scheduleNextOccurrence).toHaveBeenCalled();
		});
	});

	describe('Tag operations delegation', () => {
		test('addTagToTaskByName delegates to TaskTagMutations', async () => {
			const tag = { id: 'tag-1', name: 'Test Tag', color: '#ff0000' };
			deps.taggingService.createTaskTag.mockResolvedValue(tag);

			await service.addTagToTaskByName('task-1', 'Test Tag');

			expect(deps.taggingService.createTaskTag).toHaveBeenCalledWith(
				'project-1',
				'task-1',
				'Test Tag'
			);
		});

		test('addTagToTask delegates to TaskTagMutations', async () => {
			const tag = { id: 'tag-1', name: 'Test Tag', color: '#ff0000' };
			deps.tagStore.tags = [tag];
			deps.taggingService.createTaskTag.mockResolvedValue(tag);

			await service.addTagToTask('task-1', 'tag-1');

			expect(deps.taggingService.createTaskTag).toHaveBeenCalled();
		});

		test('removeTagFromTask delegates to TaskTagMutations', async () => {
			const tag = { id: 'tag-1', name: 'Test Tag', color: '#ff0000' };
			deps.taskStore.detachTagFromTask.mockReturnValue(tag);

			await service.removeTagFromTask('task-1', 'tag-1');

			expect(deps.taggingService.deleteTaskTag).toHaveBeenCalled();
		});
	});

	describe('Move operations delegation', () => {
		test('moveTaskToList delegates to TaskMoveMutations', async () => {
			await service.moveTaskToList('task-1', 'list-2');

			expect(deps.taskCoreStore.moveTaskBetweenLists).toHaveBeenCalledWith('task-1', 'list-2');
			expect(deps.taskService.updateTask).toHaveBeenCalledWith('project-2', 'task-1', {
				listId: 'list-2'
			});
		});

		test('moveTaskToList handles restore on failure', async () => {
			const error = new Error('fail');
			deps.taskService.updateTask.mockRejectedValueOnce(error);

			await service.moveTaskToList('task-1', 'list-2');

			expect(deps.taskCoreStore.restoreTaskMove).toHaveBeenCalled();
			expect(deps.errorHandler.addSyncError).toHaveBeenCalledWith(
				'タスク移動',
				'task',
				'task-1',
				error
			);
		});
	});

	describe('Error handling integration', () => {
		test('CRUD errors are handled correctly', async () => {
			const error = new Error('sync failed');
			deps.taskService.updateTaskWithSubTasks.mockRejectedValueOnce(error);

			await service.updateTask('task-1', { title: 'Updated' });

			expect(deps.errorHandler.addSyncError).toHaveBeenCalledWith(
				'タスク更新',
				'task',
				'task-1',
				error
			);
		});

		test('deletion errors restore task', async () => {
			const removal = {
				project: { id: 'project-1' },
				taskList: { id: 'list-1', tasks: [] as TaskWithSubTasks[] },
				task: sampleTask(),
				index: 0
			} satisfies TaskRemovalContext;
			deps.taskCoreStore.removeTask.mockReturnValue(removal);
			const error = new Error('fail');
			deps.taskService.deleteTaskWithSubTasks.mockRejectedValueOnce(error);

			await service.deleteTask('task-1');

			expect(deps.taskCoreStore.restoreTask).toHaveBeenCalledWith(removal);
		});
	});
});
