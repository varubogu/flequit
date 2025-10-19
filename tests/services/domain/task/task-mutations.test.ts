/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { TaskMutations } from '$lib/services/domain/task/task-mutations';
import type { TaskWithSubTasks } from '$lib/types/task';
import type { TaskRemovalContext } from '$lib/stores/task-core-store.svelte';

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
		getTaskProjectAndList: vi.fn().mockReturnValue({ project: { id: 'project-1' }, taskList: { id: 'list-1' } }),
		attachTagToTask: vi.fn(),
		detachTagFromTask: vi.fn()
	};

	const taskCoreStore = {
		applyTaskUpdate: vi.fn().mockReturnValue(true),
		updateTask: vi.fn().mockReturnValue(true),
		insertTask: vi.fn().mockImplementation((_listId, newTask) => newTask),
		removeTask: vi.fn().mockReturnValue({ project: { id: 'project-1' }, taskList: { id: 'list-1', tasks: [] }, task, index: 0 }),
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

	const tagStore = { tags: [] };
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

describe('TaskMutations', () => {
	let deps: ReturnType<typeof createDeps>;
	let service: TaskMutations;

	beforeEach(() => {
		deps = createDeps();
		service = new TaskMutations(deps as any);
	});

	test('updateTask applies changes and syncs to service', async () => {
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

	test('updateTask rolls back when service fails', async () => {
		const error = new Error('sync failed');
		deps.taskService.updateTaskWithSubTasks.mockRejectedValueOnce(error);

		await service.updateTask('task-1', { title: 'Updated' });

		expect(deps.errorHandler.addSyncError).toHaveBeenCalledWith('タスク更新', 'task', 'task-1', error);
		expect(deps.taskCoreStore.applyTaskUpdate).toHaveBeenCalledTimes(2);
	});

	test('addTask inserts locally and syncs', async () => {
		const result = await service.addTask('list-1', { title: 'New' });
		expect(result).not.toBeNull();
		expect(deps.taskCoreStore.insertTask).toHaveBeenCalled();
		expect(deps.taskService.createTaskWithSubTasks).toHaveBeenCalled();
	});

	test('addTask removes inserted task when sync fails', async () => {
		deps.taskService.createTaskWithSubTasks.mockRejectedValueOnce(new Error('fail'));
		await service.addTask('list-1', { title: 'New' });
		expect(deps.taskCoreStore.removeTask).toHaveBeenCalledWith(expect.any(String));
	});

	test('deleteTask restores task when sync fails', async () => {
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
		expect(deps.errorHandler.addSyncError).toHaveBeenCalledWith('タスク削除', 'task', 'task-1', error);
	});

	test('moveTaskToList restores on failure', async () => {
		const error = new Error('fail');
		deps.taskService.updateTask.mockRejectedValueOnce(error);

		await service.moveTaskToList('task-1', 'list-2');
		expect(deps.taskService.updateTask).toHaveBeenCalledWith('project-2', 'task-1', {
			listId: 'list-2'
		});
		expect(deps.taskCoreStore.restoreTaskMove).toHaveBeenCalled();
		expect(deps.errorHandler.addSyncError).toHaveBeenCalledWith('タスク移動', 'task', 'task-1', error);
	});
});
