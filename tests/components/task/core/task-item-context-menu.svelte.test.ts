import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TaskItemContextMenu } from '$lib/components/task/core/task-item-context-menu.svelte';
import type { SubTask } from '$lib/types/sub-task';
import type { TranslationService } from '$lib/services/i18n/translation-service';

// Mock lucide-svelte icons
vi.mock('lucide-svelte', () => ({
	Edit: {},
	Trash2: {}
}));

describe('TaskItemContextMenu', () => {
	let contextMenu: TaskItemContextMenu;
	let mockTranslationService: TranslationService;
	let mockHandlers: {
		handleEditTask: ReturnType<typeof vi.fn>;
		handleDeleteTask: ReturnType<typeof vi.fn>;
		handleEditSubTask: ReturnType<typeof vi.fn>;
		handleDeleteSubTask: ReturnType<typeof vi.fn>;
	};
	let mockSubTask: SubTask;

	beforeEach(() => {
		mockTranslationService = {
			getMessage: vi.fn((key: string) => {
				const translations: Record<string, string> = {
					edit_task: 'Edit Task',
					delete_task: 'Delete Task',
					edit_subtask: 'Edit Subtask',
					delete_subtask: 'Delete Subtask'
				};
				return translations[key] || key;
			})
		} as unknown as TranslationService;

		mockHandlers = {
			handleEditTask: vi.fn(),
			handleDeleteTask: vi.fn(),
			handleEditSubTask: vi.fn(),
			handleDeleteSubTask: vi.fn()
		};

		const now = new Date();
		mockSubTask = {
			id: 'subtask-1',
			title: 'Test SubTask',
			status: 'pending' as const,
			createdAt: now,
			updatedAt: now,
			tags: []
		};

		contextMenu = new TaskItemContextMenu(mockTranslationService, mockHandlers);
	});

	describe('createTaskContextMenu', () => {
		it('タスク用のコンテキストメニューを生成', () => {
			const menu = contextMenu.createTaskContextMenu();

			expect(menu.length).toBe(3); // edit, separator, delete
			expect(menu[0].id).toBe('edit-task');
			expect(menu[0].label).toBe('Edit Task');
			expect(menu[2].id).toBe('delete-task');
			expect(menu[2].label).toBe('Delete Task');
			expect(menu[2].destructive).toBe(true);
		});

		it('編集メニューをクリックするとhandleEditTaskが呼ばれる', () => {
			const menu = contextMenu.createTaskContextMenu();
			const editItem = menu[0];

			if (editItem.type !== 'separator' && editItem.action) {
				editItem.action();
			}

			expect(mockHandlers.handleEditTask).toHaveBeenCalled();
		});

		it('削除メニューをクリックするとhandleDeleteTaskが呼ばれる', () => {
			const menu = contextMenu.createTaskContextMenu();
			const deleteItem = menu[2];

			if (deleteItem.type !== 'separator' && deleteItem.action) {
				deleteItem.action();
			}

			expect(mockHandlers.handleDeleteTask).toHaveBeenCalled();
		});
	});

	describe('createSubTaskContextMenu', () => {
		it('サブタスク用のコンテキストメニューを生成', () => {
			const menu = contextMenu.createSubTaskContextMenu(mockSubTask);

			expect(menu.length).toBe(3); // edit, separator, delete
			expect(menu[0].id).toBe('edit-subtask');
			expect(menu[0].label).toBe('Edit Subtask');
			expect(menu[2].id).toBe('delete-subtask');
			expect(menu[2].label).toBe('Delete Subtask');
			expect(menu[2].destructive).toBe(true);
		});

		it('編集メニューをクリックするとhandleEditSubTaskが呼ばれる', () => {
			const menu = contextMenu.createSubTaskContextMenu(mockSubTask);
			const editItem = menu[0];

			if (editItem.type !== 'separator' && editItem.action) {
				editItem.action();
			}

			expect(mockHandlers.handleEditSubTask).toHaveBeenCalledWith(mockSubTask);
		});

		it('削除メニューをクリックするとhandleDeleteSubTaskが呼ばれる', () => {
			const menu = contextMenu.createSubTaskContextMenu(mockSubTask);
			const deleteItem = menu[2];

			if (deleteItem.type !== 'separator' && deleteItem.action) {
				deleteItem.action();
			}

			expect(mockHandlers.handleDeleteSubTask).toHaveBeenCalledWith(mockSubTask);
		});
	});
});
