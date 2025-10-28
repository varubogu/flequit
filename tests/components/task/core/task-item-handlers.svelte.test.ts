import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TaskItemHandlers } from '$lib/components/task/core/task-item-handlers.svelte';
import type { TaskWithSubTasks } from '$lib/types/task';
import type { SubTask } from '$lib/types/sub-task';
import { createMockTaskWithSubTasks } from '../../../utils/mock-factories';

// Mock dependencies
vi.mock('$lib/stores/tasks.svelte', () => ({
	taskStore: {
		isNewTaskMode: false,
		selectedTaskId: null,
		selectedSubTaskId: null
	}
}));

vi.mock('$lib/services/domain/task/task-mutations-instance', () => ({
	taskMutations: {
		deleteTask: vi.fn(() => Promise.resolve()),
		toggleTaskStatus: vi.fn(() => Promise.resolve())
	}
}));

vi.mock('$lib/services/domain/subtask', () => ({
	SubTaskMutations: vi.fn().mockImplementation(() => ({
		deleteSubTask: vi.fn(() => Promise.resolve()),
		toggleSubTaskStatus: vi.fn()
	}))
}));

vi.mock('$lib/stores/selection-store.svelte', () => ({
	selectionStore: {
		selectTask: vi.fn(),
		selectSubTask: vi.fn()
	}
}));

describe('TaskItemHandlers', () => {
	let handlers: TaskItemHandlers;
	let mockTask: TaskWithSubTasks;
	let mockSubTask: SubTask;
	let mockTaskDetailUiStore: any;
	let mockDispatch: ReturnType<typeof vi.fn>;
	let mockCallbacks: {
		onTaskClick?: (taskId: string) => void;
		onSubTaskClick?: (subTaskId: string) => void;
	};

	beforeEach(() => {
		const now = new Date();
		mockTask = createMockTaskWithSubTasks({
			id: 'task-1',
			title: 'Test Task',
			subTasks: [
				{
					id: 'subtask-1',
					taskId: 'task-1',
					title: 'Test SubTask',
					description: 'Subtask description',
					status: 'not_started',
					priority: 0,
					orderIndex: 0,
					completed: false,
					assignedUserIds: [],
					tagIds: [],
					tags: [],
					createdAt: now,
					updatedAt: now
				}
			]
		});

		mockSubTask = mockTask.subTasks[0];

		mockTaskDetailUiStore = {
			openTaskDetail: vi.fn(),
			openSubTaskDetail: vi.fn()
		};

		mockDispatch = vi.fn();
		mockCallbacks = {};

		handlers = new TaskItemHandlers(
			mockTask,
			mockTaskDetailUiStore,
			mockDispatch,
			mockCallbacks
		);
	});

	describe('handleEditTask', () => {
		it('タスク詳細画面を開く', () => {
			handlers.handleEditTask();

			expect(mockTaskDetailUiStore.openTaskDetail).toHaveBeenCalledWith('task-1');
		});
	});

	describe('handleDeleteTask', () => {
		it('タスクを削除する', async () => {
			const { taskMutations } = await import(
				'$lib/services/domain/task/task-mutations-instance'
			);

			handlers.handleDeleteTask();

			expect(taskMutations.deleteTask).toHaveBeenCalledWith('task-1');
		});
	});

	describe('handleTaskClick', () => {
		it('カスタムハンドラーがある場合は優先する', () => {
			mockCallbacks.onTaskClick = vi.fn();
			handlers = new TaskItemHandlers(mockTask, mockTaskDetailUiStore, mockDispatch, mockCallbacks);

			handlers.handleTaskClick();

			expect(mockCallbacks.onTaskClick).toHaveBeenCalledWith('task-1');
		});

		it('新規タスクモード時はイベントをディスパッチ', async () => {
			const { taskStore } = await import('$lib/stores/tasks.svelte');
			taskStore.isNewTaskMode = true;

			handlers.handleTaskClick();

			expect(mockDispatch).toHaveBeenCalledWith('taskSelectionRequested', { taskId: 'task-1' });
		});

		it('通常時はタスクを選択', async () => {
			const { taskStore } = await import('$lib/stores/tasks.svelte');
			const { selectionStore } = await import('$lib/stores/selection-store.svelte');
			taskStore.isNewTaskMode = false;

			handlers.handleTaskClick();

			expect(selectionStore.selectTask).toHaveBeenCalledWith('task-1');
		});
	});

	describe('handleStatusToggle', () => {
		it('タスクのステータスをトグルする', async () => {
			const { taskMutations } = await import(
				'$lib/services/domain/task/task-mutations-instance'
			);

			handlers.handleStatusToggle();

			expect(taskMutations.toggleTaskStatus).toHaveBeenCalledWith('task-1');
		});
	});

	describe('handleEditSubTask', () => {
		it('サブタスク詳細画面を開く', () => {
			handlers.handleEditSubTask(mockSubTask);

			expect(mockTaskDetailUiStore.openSubTaskDetail).toHaveBeenCalledWith('subtask-1');
		});
	});

	describe('handleSubTaskToggle', () => {
		it('イベントの伝播を停止してステータスをトグル', () => {
			const mockEvent = {
				stopPropagation: vi.fn()
			} as unknown as Event;

			handlers.handleSubTaskToggle(mockEvent, 'subtask-1');

			expect(mockEvent.stopPropagation).toHaveBeenCalled();
		});
	});

	describe('handleSubTaskClick', () => {
		it('カスタムハンドラーがある場合は優先する', () => {
			mockCallbacks.onSubTaskClick = vi.fn();
			handlers = new TaskItemHandlers(mockTask, mockTaskDetailUiStore, mockDispatch, mockCallbacks);

			const mockEvent = {
				stopPropagation: vi.fn()
			} as unknown as Event;

			handlers.handleSubTaskClick(mockEvent, 'subtask-1');

			expect(mockEvent.stopPropagation).toHaveBeenCalled();
			expect(mockCallbacks.onSubTaskClick).toHaveBeenCalledWith('subtask-1');
		});

		it('新規タスクモード時はイベントをディスパッチ', async () => {
			const { taskStore } = await import('$lib/stores/tasks.svelte');
			taskStore.isNewTaskMode = true;

			const mockEvent = {
				stopPropagation: vi.fn()
			} as unknown as Event;

			handlers.handleSubTaskClick(mockEvent, 'subtask-1');

			expect(mockDispatch).toHaveBeenCalledWith('subTaskSelectionRequested', {
				subTaskId: 'subtask-1'
			});
		});

		it('通常時はサブタスクを選択', async () => {
			const { taskStore } = await import('$lib/stores/tasks.svelte');
			const { selectionStore } = await import('$lib/stores/selection-store.svelte');
			taskStore.isNewTaskMode = false;

			const mockEvent = {
				stopPropagation: vi.fn()
			} as unknown as Event;

			handlers.handleSubTaskClick(mockEvent, 'subtask-1');

			expect(selectionStore.selectSubTask).toHaveBeenCalledWith('subtask-1');
		});
	});
});
