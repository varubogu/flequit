/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { TaskCrudMutations } from '$lib/services/domain/task/mutations/task-crud-mutations';
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
		getTaskProjectAndList: vi.fn().mockReturnValue({
			project: { id: 'project-1' },
			taskList: { id: 'list-1' }
		})
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
		restoreTask: vi.fn()
	};

	const taskListStore = {
		getProjectIdByListId: vi.fn().mockReturnValue('project-1')
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

	return {
		taskStore,
		taskCoreStore,
		taskListStore,
		errorHandler,
		taskService
	};
};

describe('TaskCrudMutations', () => {
	let deps: ReturnType<typeof createDeps>;
	let service: TaskCrudMutations;

	beforeEach(() => {
		deps = createDeps();
		service = new TaskCrudMutations(deps as any);
	});

	describe('updateTask', () => {
		test('applies changes and syncs to service', async () => {
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

		test('rolls back when service fails', async () => {
			const error = new Error('sync failed');
			deps.taskService.updateTaskWithSubTasks.mockRejectedValueOnce(error);

			await service.updateTask('task-1', { title: 'Updated' });

			expect(deps.errorHandler.addSyncError).toHaveBeenCalledWith(
				'タスク更新',
				'task',
				'task-1',
				error
			);
			expect(deps.taskCoreStore.applyTaskUpdate).toHaveBeenCalledTimes(2);
		});

		test('handles task not found', async () => {
			deps.taskStore.getTaskProjectAndList.mockReturnValueOnce(null);

			await service.updateTask('invalid-task', { title: 'Updated' });

			expect(deps.taskCoreStore.applyTaskUpdate).not.toHaveBeenCalled();
		});

		test('handles missing task for update', async () => {
			deps.taskStore.getTaskById.mockReturnValueOnce(null);

			await service.updateTask('task-1', { title: 'Updated' });

			expect(deps.taskCoreStore.applyTaskUpdate).not.toHaveBeenCalled();
		});
	});

	describe('updateTaskFromForm', () => {
		test('updates task with form data', async () => {
			const formData = {
				title: 'New Title',
				description: 'New Description',
				priority: 5,
				planStartDate: new Date('2025-01-01'),
				planEndDate: new Date('2025-12-31'),
				isRangeDate: true
			};

			await service.updateTaskFromForm('task-1', formData);

			expect(deps.taskCoreStore.applyTaskUpdate).toHaveBeenCalled();
			expect(deps.taskService.updateTaskWithSubTasks).toHaveBeenCalledWith(
				'project-1',
				'task-1',
				expect.objectContaining({
					title: 'New Title',
					description: 'New Description',
					priority: 5,
					isRangeDate: true
				})
			);
		});
	});

	describe('deleteTask', () => {
		test('removes task and syncs deletion', async () => {
			await service.deleteTask('task-1');

			expect(deps.taskCoreStore.removeTask).toHaveBeenCalledWith('task-1');
			expect(deps.taskService.deleteTaskWithSubTasks).toHaveBeenCalledWith(
				'project-1',
				'task-1'
			);
		});

		test('restores task when sync fails', async () => {
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
			expect(deps.errorHandler.addSyncError).toHaveBeenCalledWith(
				'タスク削除',
				'task',
				'task-1',
				error
			);
		});

		test('clears selected task when deleting selected task', async () => {
			deps.taskStore.selectedTaskId = 'task-1';

			await service.deleteTask('task-1');

			expect(deps.taskStore.selectedTaskId).toBeNull();
		});
	});

	describe('addTask', () => {
		test('inserts task locally and syncs', async () => {
			const result = await service.addTask('list-1', { title: 'New' });

			expect(result).not.toBeNull();
			expect(deps.taskCoreStore.insertTask).toHaveBeenCalled();
			expect(deps.taskService.createTaskWithSubTasks).toHaveBeenCalled();
		});

		test('removes inserted task when sync fails', async () => {
			deps.taskService.createTaskWithSubTasks.mockRejectedValueOnce(new Error('fail'));

			const result = await service.addTask('list-1', { title: 'New' });

			expect(result).toBeNull();
			expect(deps.taskCoreStore.removeTask).toHaveBeenCalledWith(expect.any(String));
		});

		test('returns null when project not found', async () => {
			deps.taskListStore.getProjectIdByListId.mockReturnValueOnce(null);

			const result = await service.addTask('invalid-list', { title: 'New' });

			expect(result).toBeNull();
			expect(deps.taskCoreStore.insertTask).not.toHaveBeenCalled();
		});

		test('creates task with default values', async () => {
			await service.addTask('list-1', { title: 'Minimal Task' });

			expect(deps.taskCoreStore.insertTask).toHaveBeenCalledWith(
				'list-1',
				expect.objectContaining({
					title: 'Minimal Task',
					status: 'not_started',
					priority: 0,
					isRangeDate: false,
					isArchived: false
				})
			);
		});
	});

	describe('updateTaskDueDateForView', () => {
		test('updates due date for today view', async () => {
			await service.updateTaskDueDateForView('task-1', 'today');

			expect(deps.taskService.updateTaskWithSubTasks).toHaveBeenCalledWith(
				'project-1',
				'task-1',
				expect.objectContaining({ planEndDate: expect.any(Date) })
			);
		});

		test('updates due date for tomorrow view', async () => {
			await service.updateTaskDueDateForView('task-1', 'tomorrow');

			expect(deps.taskService.updateTaskWithSubTasks).toHaveBeenCalled();
		});

		test('updates due date for next3days view', async () => {
			await service.updateTaskDueDateForView('task-1', 'next3days');

			expect(deps.taskService.updateTaskWithSubTasks).toHaveBeenCalled();
		});

		test('updates due date for nextweek view', async () => {
			await service.updateTaskDueDateForView('task-1', 'nextweek');

			expect(deps.taskService.updateTaskWithSubTasks).toHaveBeenCalled();
		});

		test('updates due date for thismonth view', async () => {
			await service.updateTaskDueDateForView('task-1', 'thismonth');

			expect(deps.taskService.updateTaskWithSubTasks).toHaveBeenCalled();
		});

		test('does nothing for unknown view', async () => {
			await service.updateTaskDueDateForView('task-1', 'unknown-view');

			expect(deps.taskService.updateTaskWithSubTasks).not.toHaveBeenCalled();
		});
	});
});
