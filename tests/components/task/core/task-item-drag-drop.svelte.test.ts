import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TaskItemDragDrop } from '$lib/components/task/core/task-item-drag-drop.svelte';
import type { TaskWithSubTasks } from '$lib/types/task';

// Mock DragDropManager
vi.mock('$lib/utils/drag-drop', () => ({
	DragDropManager: {
		startDrag: vi.fn(),
		handleDragOver: vi.fn(),
		handleDrop: vi.fn(() => null),
		handleDragEnd: vi.fn(),
		handleDragEnter: vi.fn(),
		handleDragLeave: vi.fn()
	}
}));

// Mock taskMutations
vi.mock('$lib/services/domain/task/task-mutations-instance', () => ({
	taskMutations: {
		addTagToTask: vi.fn(() => Promise.resolve())
	}
}));

describe('TaskItemDragDrop', () => {
	let dragDrop: TaskItemDragDrop;
	let mockTask: TaskWithSubTasks;

	beforeEach(() => {
		const now = new Date();
		mockTask = {
			id: 'task-1',
			title: 'Test Task',
			description: '',
			status: 'pending' as const,
			priority: 'medium' as const,
			dueDate: null,
			createdAt: now,
			updatedAt: now,
			tags: [],
			subTasks: []
		};

		dragDrop = new TaskItemDragDrop(mockTask);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('handleDragStart', () => {
		it('ドラッグ開始処理を実行', async () => {
			const { DragDropManager } = await import('$lib/utils/drag-drop');
			const mockEvent = {} as DragEvent;

			dragDrop.handleDragStart(mockEvent);

			expect(DragDropManager.startDrag).toHaveBeenCalledWith(mockEvent, {
				type: 'task',
				id: 'task-1'
			});
		});
	});

	describe('handleDragOver', () => {
		it('ドラッグオーバー処理を実行', async () => {
			const { DragDropManager } = await import('$lib/utils/drag-drop');
			const mockEvent = {} as DragEvent;

			dragDrop.handleDragOver(mockEvent);

			expect(DragDropManager.handleDragOver).toHaveBeenCalledWith(mockEvent, {
				type: 'task',
				id: 'task-1'
			});
		});
	});

	describe('handleDrop', () => {
		it('タグをドロップした場合、タスクにタグを追加', async () => {
			const { DragDropManager } = await import('$lib/utils/drag-drop');
			const { taskMutations } = await import(
				'$lib/services/domain/task/task-mutations-instance'
			);

			// Mock handleDrop to return tag drag data
			DragDropManager.handleDrop = vi.fn(() => ({
				type: 'tag',
				id: 'tag-1'
			}));

			const mockEvent = {} as DragEvent;

			dragDrop.handleDrop(mockEvent);

			expect(DragDropManager.handleDrop).toHaveBeenCalledWith(mockEvent, {
				type: 'task',
				id: 'task-1'
			});
			expect(taskMutations.addTagToTask).toHaveBeenCalledWith('task-1', 'tag-1');
		});

		it('ドラッグデータがnullの場合は何もしない', async () => {
			const { DragDropManager } = await import('$lib/utils/drag-drop');
			const { taskMutations } = await import(
				'$lib/services/domain/task/task-mutations-instance'
			);

			DragDropManager.handleDrop = vi.fn(() => null);

			const mockEvent = {} as DragEvent;

			dragDrop.handleDrop(mockEvent);

			expect(taskMutations.addTagToTask).not.toHaveBeenCalled();
		});

		it('タグ以外のドラッグデータの場合は何もしない', async () => {
			const { DragDropManager } = await import('$lib/utils/drag-drop');
			const { taskMutations } = await import(
				'$lib/services/domain/task/task-mutations-instance'
			);

			DragDropManager.handleDrop = vi.fn(() => ({
				type: 'task',
				id: 'task-2'
			}));

			const mockEvent = {} as DragEvent;

			dragDrop.handleDrop(mockEvent);

			expect(taskMutations.addTagToTask).not.toHaveBeenCalled();
		});
	});

	describe('handleDragEnd', () => {
		it('ドラッグ終了処理を実行', async () => {
			const { DragDropManager } = await import('$lib/utils/drag-drop');
			const mockEvent = {} as DragEvent;

			dragDrop.handleDragEnd(mockEvent);

			expect(DragDropManager.handleDragEnd).toHaveBeenCalledWith(mockEvent);
		});
	});

	describe('handleDragEnter', () => {
		it('ドラッグ進入処理を実行', async () => {
			const { DragDropManager } = await import('$lib/utils/drag-drop');
			const mockEvent = {} as DragEvent;
			const mockElement = {} as HTMLElement;

			dragDrop.handleDragEnter(mockEvent, mockElement);

			expect(DragDropManager.handleDragEnter).toHaveBeenCalledWith(mockEvent, mockElement);
		});
	});

	describe('handleDragLeave', () => {
		it('ドラッグ離脱処理を実行', async () => {
			const { DragDropManager } = await import('$lib/utils/drag-drop');
			const mockEvent = {} as DragEvent;
			const mockElement = {} as HTMLElement;

			dragDrop.handleDragLeave(mockEvent, mockElement);

			expect(DragDropManager.handleDragLeave).toHaveBeenCalledWith(mockEvent, mockElement);
		});
	});
});
