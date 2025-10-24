import type { SubTask } from '$lib/types/sub-task';
import type { ContextMenuList } from '$lib/types/context-menu';
import { createContextMenu, createSeparator } from '$lib/types/context-menu';
import { Edit, Trash2 } from 'lucide-svelte';
import type { ITranslationService } from '$lib/services/translation-service';

/**
 * TaskItemContextMenu - タスクアイテムのコンテキストメニュー生成クラス
 *
 * 責務: タスクとサブタスクのコンテキストメニューの生成
 */
export class TaskItemContextMenu {
	constructor(
		private translationService: ITranslationService,
		private handlers: {
			handleEditTask: () => void;
			handleDeleteTask: () => void;
			handleEditSubTask: (subTask: SubTask) => void;
			handleDeleteSubTask: (subTask: SubTask) => void;
		}
	) {}

	createTaskContextMenu(): ContextMenuList {
		const editTask = this.translationService.getMessage('edit_task');
		const deleteTask = this.translationService.getMessage('delete_task');

		return createContextMenu([
			{
				id: 'edit-task',
				label: editTask,
				action: this.handlers.handleEditTask,
				icon: Edit
			},
			createSeparator(),
			{
				id: 'delete-task',
				label: deleteTask,
				action: this.handlers.handleDeleteTask,
				icon: Trash2,
				destructive: true
			}
		]);
	}

	createSubTaskContextMenu(subTask: SubTask): ContextMenuList {
		const editSubtask = this.translationService.getMessage('edit_subtask');
		const deleteSubtask = this.translationService.getMessage('delete_subtask');

		return createContextMenu([
			{
				id: 'edit-subtask',
				label: editSubtask,
				action: () => this.handlers.handleEditSubTask(subTask),
				icon: Edit
			},
			createSeparator(),
			{
				id: 'delete-subtask',
				label: deleteSubtask,
				action: () => this.handlers.handleDeleteSubTask(subTask),
				icon: Trash2,
				destructive: true
			}
		]);
	}
}
