/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { TaskStatusMutations } from '$lib/services/domain/task/mutations/task-status-mutations';
import type { TaskWithSubTasks } from '$lib/types/task';

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
		getTaskById: vi.fn().mockReturnValue(task)
	};

	const recurrenceService = {
		scheduleNextOccurrence: vi.fn()
	};

	const crudMutations = {
		updateTask: vi.fn().mockResolvedValue(undefined)
	};

	return {
		taskStore,
		recurrenceService,
		crudMutations
	};
};

describe('TaskStatusMutations', () => {
	let deps: ReturnType<typeof createDeps>;
	let service: TaskStatusMutations;

	beforeEach(() => {
		deps = createDeps();
		service = new TaskStatusMutations(deps as any);
	});

	describe('toggleTaskStatus', () => {
		test('toggles from not_started to completed', async () => {
			const task = sampleTask();
			task.status = 'not_started';
			deps.taskStore.getTaskById.mockReturnValue(task);

			await service.toggleTaskStatus('task-1');

			expect(deps.crudMutations.updateTask).toHaveBeenCalledWith('task-1', {
				status: 'completed'
			});
		});

		test('toggles from completed to not_started', async () => {
			const task = sampleTask();
			task.status = 'completed';
			deps.taskStore.getTaskById.mockReturnValue(task);

			await service.toggleTaskStatus('task-1');

			expect(deps.crudMutations.updateTask).toHaveBeenCalledWith('task-1', {
				status: 'not_started'
			});
		});

		test('toggles from in_progress to completed', async () => {
			const task = sampleTask();
			task.status = 'in_progress';
			deps.taskStore.getTaskById.mockReturnValue(task);

			await service.toggleTaskStatus('task-1');

			expect(deps.crudMutations.updateTask).toHaveBeenCalledWith('task-1', {
				status: 'completed'
			});
		});

		test('handles task not found', async () => {
			deps.taskStore.getTaskById.mockReturnValue(null);

			await service.toggleTaskStatus('invalid-task');

			expect(deps.crudMutations.updateTask).not.toHaveBeenCalled();
		});
	});

	describe('changeTaskStatus', () => {
		test('changes task status', async () => {
			await service.changeTaskStatus('task-1', 'in_progress');

			expect(deps.crudMutations.updateTask).toHaveBeenCalledWith('task-1', {
				status: 'in_progress'
			});
		});

		test('schedules next occurrence when completing recurring task', async () => {
			const task = sampleTask();
			task.recurrenceRule = { unit: 'day', interval: 1 };
			deps.taskStore.getTaskById.mockReturnValue(task);

			await service.changeTaskStatus('task-1', 'completed');

			expect(deps.recurrenceService.scheduleNextOccurrence).toHaveBeenCalledWith(task);
			expect(deps.crudMutations.updateTask).toHaveBeenCalledWith('task-1', {
				status: 'completed'
			});
		});

		test('does not schedule when completing non-recurring task', async () => {
			const task = sampleTask();
			task.recurrenceRule = undefined;
			deps.taskStore.getTaskById.mockReturnValue(task);

			await service.changeTaskStatus('task-1', 'completed');

			expect(deps.recurrenceService.scheduleNextOccurrence).not.toHaveBeenCalled();
			expect(deps.crudMutations.updateTask).toHaveBeenCalledWith('task-1', {
				status: 'completed'
			});
		});

		test('does not schedule when changing to non-completed status', async () => {
			const task = sampleTask();
			task.recurrenceRule = { unit: 'day', interval: 1 };
			deps.taskStore.getTaskById.mockReturnValue(task);

			await service.changeTaskStatus('task-1', 'in_progress');

			expect(deps.recurrenceService.scheduleNextOccurrence).not.toHaveBeenCalled();
		});

		test('handles task not found for recurrence check', async () => {
			deps.taskStore.getTaskById.mockReturnValue(null);

			await service.changeTaskStatus('task-1', 'completed');

			expect(deps.recurrenceService.scheduleNextOccurrence).not.toHaveBeenCalled();
			expect(deps.crudMutations.updateTask).toHaveBeenCalledWith('task-1', {
				status: 'completed'
			});
		});
	});
});
