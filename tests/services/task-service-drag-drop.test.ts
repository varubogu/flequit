import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { TaskOperations, type TaskOperationsDependencies } from '$lib/services/domain/task/task-operations';
import type { TaskWithSubTasks } from '$lib/types/task';

// Mock TaskBackend
vi.mock('$lib/services/domain/task/task-backend', () => ({
	TaskBackend: {
		createTaskWithSubTasks: vi.fn().mockResolvedValue(undefined),
		updateTaskWithSubTasks: vi.fn().mockResolvedValue(undefined),
		deleteTaskWithSubTasks: vi.fn().mockResolvedValue(true),
		updateTask: vi.fn().mockResolvedValue(undefined)
	}
}));

// Mock TaggingService
vi.mock('$lib/services/domain/tagging', () => ({
	TaggingService: {
		createTaskTag: vi.fn(),
		deleteTaskTag: vi.fn()
	}
}));

import { TaskBackend } from '$lib/services/domain/task/task-backend';
import { TaggingService } from '$lib/services/domain/tagging';

type TestContext = {
	mutations: TaskOperations;
	deps: {
		taskStore: ReturnType<typeof createTaskStoreMock>;
		taskCoreStore: ReturnType<typeof createTaskCoreStoreMock>;
		tagStore: ReturnType<typeof createTagStoreMock>;
	};
	currentTask: TaskWithSubTasks;
};

const baseTime = new Date('2024-01-15T10:00:00Z');

function createTaskStoreMock(task: TaskWithSubTasks) {
	return {
		selectedTaskId: null as string | null,
		getTaskById: vi.fn((taskId: string) => (taskId === task.id ? task : null)),
		getTaskProjectAndList: vi.fn().mockReturnValue({
			project: { id: 'project-1' },
			taskList: { id: 'list-1' }
		}),
		attachTagToTask: vi.fn(),
		detachTagFromTask: vi.fn()
	};
}

function createTaskCoreStoreMock(task: TaskWithSubTasks) {
	return {
		applyTaskUpdate: vi.fn((_taskId: string, updater: (mutable: TaskWithSubTasks) => void) => {
			const clone: TaskWithSubTasks = {
				...task,
				subTasks: [...task.subTasks],
				tags: [...task.tags]
			};
			updater(clone);
			return true;
		}),
		updateTask: vi.fn(),
		insertTask: vi.fn(),
		removeTask: vi.fn(),
		restoreTask: vi.fn(),
		moveTaskBetweenLists: vi.fn(),
		restoreTaskMove: vi.fn()
	};
}

function createTagStoreMock() {
	return {
		tags: [
			{
				id: 'tag-1',
				name: 'Work',
				color: '#ff0000',
				createdAt: new Date('2024-01-01T00:00:00Z'),
				updatedAt: new Date('2024-01-01T00:00:00Z')
			},
			{
				id: 'tag-2',
				name: 'Personal',
				color: '#00ff00',
				createdAt: new Date('2024-01-01T00:00:00Z'),
				updatedAt: new Date('2024-01-01T00:00:00Z')
			}
		],
		addTagWithId: vi.fn()
	};
}

function createDependencies(task: TaskWithSubTasks): TestContext {
	const taskStore = createTaskStoreMock(task);
	const taskCoreStore = createTaskCoreStoreMock(task);
	const taskListStore = { getProjectIdByListId: vi.fn(() => 'project-1') };
	const tagStore = createTagStoreMock();
	const errorHandler = { addSyncError: vi.fn() };
	const recurrenceService = { scheduleNextOccurrence: vi.fn() };

	const deps: TaskOperationsDependencies = {
		taskStore,
		taskCoreStore,
		taskListStore,
		tagStore,
		errorHandler,
		recurrenceService
	};

	return {
		mutations: new TaskOperations(deps),
		deps: { taskStore, taskCoreStore, tagStore },
		currentTask: task
	};
}

describe('TaskOperations - Drag & Drop 相当機能', () => {
	let context: TestContext;

	beforeEach(() => {
		// Clear all mocks before each test
		vi.clearAllMocks();

		const task: TaskWithSubTasks = {
			id: 'task-1',
			projectId: 'project-1',
			listId: 'list-1',
			title: 'Sample Task',
			status: 'not_started',
			priority: 0,
			orderIndex: 0,
			isArchived: false,
			isRangeDate: false,
			assignedUserIds: [],
			tagIds: [],
			planStartDate: undefined,
			planEndDate: undefined,
			doStartDate: undefined,
			doEndDate: undefined,
			recurrenceRule: undefined,
			createdAt: new Date('2024-01-01T00:00:00Z'),
			updatedAt: new Date('2024-01-01T00:00:00Z'),
			subTasks: [],
			tags: []
		};

		context = createDependencies(task);
	});

		describe('addTagToTask', () => {
			it('タスクにタグを追加する（バックエンド連携含む）', async () => {
				const backendTag = {
					id: 'tag-1',
					name: 'Work',
					createdAt: new Date('2024-01-01T00:00:00Z'),
					updatedAt: new Date('2024-01-01T00:00:00Z')
				};
				vi.mocked(TaggingService.createTaskTag).mockResolvedValueOnce(backendTag);

			await context.mutations.addTagToTask('task-1', 'tag-1');

			expect(TaggingService.createTaskTag).toHaveBeenCalledWith(
				'project-1',
				'task-1',
				'Work'
			);
			expect(context.deps.taskStore.attachTagToTask).toHaveBeenCalledWith('task-1', backendTag);
		});

		it('存在しないタグIDの場合は何もしない', async () => {
			await context.mutations.addTagToTask('task-1', 'unknown-tag');

			expect(TaggingService.createTaskTag).not.toHaveBeenCalled();
			expect(context.deps.taskStore.attachTagToTask).not.toHaveBeenCalled();
		});
	});

	describe('updateTaskDueDateForView', () => {
		beforeEach(() => {
			vi.useFakeTimers();
			vi.setSystemTime(baseTime);
		});

			afterEach(() => {
				vi.useRealTimers();
				vi.mocked(TaskBackend.updateTaskWithSubTasks).mockClear();
				context.deps.taskStore.getTaskById.mockClear();
			});

		const views: Array<{ view: string; expected: () => Date | undefined }> = [
			{
				view: 'today',
				expected: () => new Date(baseTime)
			},
			{
				view: 'tomorrow',
				expected: () => {
					const date = new Date(baseTime);
					date.setDate(date.getDate() + 1);
					return date;
				}
			},
			{
				view: 'next3days',
				expected: () => {
					const date = new Date(baseTime);
					date.setDate(date.getDate() + 3);
					return date;
				}
			},
			{
				view: 'nextweek',
				expected: () => {
					const date = new Date(baseTime);
					date.setDate(date.getDate() + 7);
					return date;
				}
			},
			{
				view: 'thismonth',
				expected: () => new Date(baseTime.getFullYear(), baseTime.getMonth() + 1, 0)
			}
		];

		for (const { view, expected } of views) {
			it(`${view}ビューにドロップされた場合は対応する期日を設定する`, async () => {
				await context.mutations.updateTaskDueDateForView('task-1', view);

				expect(TaskBackend.updateTaskWithSubTasks).toHaveBeenCalledWith(
					'project-1',
					'task-1',
					expect.objectContaining({
						planEndDate: expect.any(Date)
					})
				);

					const [, , payload] = vi.mocked(TaskBackend.updateTaskWithSubTasks).mock.calls.at(-1)!;
				const expectedDate = expected();
				expect((payload as { planEndDate?: Date }).planEndDate?.toISOString()).toBe(
					expectedDate?.toISOString()
				);
			});
		}

		it('未対応ビューの場合は更新しない', async () => {
			await context.mutations.updateTaskDueDateForView('task-1', 'unknown-view');

			expect(TaskBackend.updateTaskWithSubTasks).not.toHaveBeenCalled();
		});
	});
});
