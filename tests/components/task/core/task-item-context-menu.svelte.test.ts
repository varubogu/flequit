import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TaskItemContextMenu } from '$lib/components/task/core/task-item-context-menu.svelte';
import type { SubTask } from '$lib/types/sub-task';
import type { TaskStatus } from '$lib/types/task';
import type { ContextMenuItem } from '$lib/types/context-menu';
import type { ITranslationService } from '$lib/services/translation-service';

// Mock lucide-svelte icons
vi.mock('lucide-svelte', () => ({
    Edit: {},
    Trash2: {}
}));

describe('TaskItemContextMenu', () => {
    let contextMenu: TaskItemContextMenu;
    let mockTranslationService: ITranslationService;
    let mockHandlers: {
        handleEditTask: ReturnType<typeof vi.fn>;
        handleDeleteTask: ReturnType<typeof vi.fn>;
        handleEditSubTask: ReturnType<typeof vi.fn>;
        handleDeleteSubTask: ReturnType<typeof vi.fn>;
    };
    let mockSubTask: SubTask;

    beforeEach(() => {
        mockTranslationService = {
            getCurrentLocale: vi.fn(() => 'en'),
            setLocale: vi.fn(),
            getAvailableLocales: vi.fn(() => ['en']),
            reactiveMessage: vi.fn((fn) => fn),
            getMessage: vi.fn((key: string) => () => {
                const translations: Record<string, string> = {
                    edit_task: 'Edit Task',
                    delete_task: 'Delete Task',
                    edit_subtask: 'Edit Subtask',
                    delete_subtask: 'Delete Subtask'
                };
                return translations[key] || key;
            })
        } as unknown as ITranslationService;

        mockHandlers = {
            handleEditTask: vi.fn(),
            handleDeleteTask: vi.fn(),
            handleEditSubTask: vi.fn(),
            handleDeleteSubTask: vi.fn()
        };

        const now = new Date();
        mockSubTask = {
            id: 'subtask-1',
            taskId: 'task-1',
            title: 'Test SubTask',
            description: 'Test subtask description',
            status: 'not_started' as TaskStatus,
            priority: 0,
            orderIndex: 0,
            completed: false,
            assignedUserIds: [],
            tagIds: [],
            tags: [],
            createdAt: now,
            updatedAt: now
        };

        contextMenu = new TaskItemContextMenu(mockTranslationService, mockHandlers);
    });

    describe('createTaskContextMenu', () => {
        it('タスク用のコンテキストメニューを生成', () => {
            const menu = contextMenu.createTaskContextMenu();

            expect(menu).toHaveLength(3); // edit, separator, delete
            const editItem = menu[0] as ContextMenuItem;
            const deleteItem = menu[2] as ContextMenuItem;

            expect(editItem.id).toBe('edit-task');
            expect(getLabelText(editItem.label)).toBe('Edit Task');
            expect(deleteItem.id).toBe('delete-task');
            expect(getLabelText(deleteItem.label)).toBe('Delete Task');
            expect(deleteItem.destructive).toBe(true);
        });

        it('編集メニューをクリックするとhandleEditTaskが呼ばれる', () => {
            const menu = contextMenu.createTaskContextMenu();
            const editItem = menu[0] as ContextMenuItem;
            editItem.action();

            expect(mockHandlers.handleEditTask).toHaveBeenCalled();
        });

        it('削除メニューをクリックするとhandleDeleteTaskが呼ばれる', () => {
            const menu = contextMenu.createTaskContextMenu();
            const deleteItem = menu[2] as ContextMenuItem;
            deleteItem.action();

            expect(mockHandlers.handleDeleteTask).toHaveBeenCalled();
        });
    });

    describe('createSubTaskContextMenu', () => {
        it('サブタスク用のコンテキストメニューを生成', () => {
            const menu = contextMenu.createSubTaskContextMenu(mockSubTask);

            expect(menu).toHaveLength(3);
            const editItem = menu[0] as ContextMenuItem;
            const deleteItem = menu[2] as ContextMenuItem;

            expect(editItem.id).toBe('edit-subtask');
            expect(getLabelText(editItem.label)).toBe('Edit Subtask');
            expect(deleteItem.id).toBe('delete-subtask');
            expect(getLabelText(deleteItem.label)).toBe('Delete Subtask');
            expect(deleteItem.destructive).toBe(true);
        });

        it('編集メニューをクリックするとhandleEditSubTaskが呼ばれる', () => {
            const menu = contextMenu.createSubTaskContextMenu(mockSubTask);
            const editItem = menu[0] as ContextMenuItem;
            editItem.action();

            expect(mockHandlers.handleEditSubTask).toHaveBeenCalledWith(mockSubTask);
        });

        it('削除メニューをクリックするとhandleDeleteSubTaskが呼ばれる', () => {
            const menu = contextMenu.createSubTaskContextMenu(mockSubTask);
            const deleteItem = menu[2] as ContextMenuItem;
            deleteItem.action();

            expect(mockHandlers.handleDeleteSubTask).toHaveBeenCalledWith(mockSubTask);
        });
    });
});

function getLabelText(label: ContextMenuItem['label']): string {
    return typeof label === 'function' ? label() : label;
}
