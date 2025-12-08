import { taskOperations } from '$lib/services/domain/task';
import type { TaskWithSubTasks } from '$lib/types/task';
import { DragDropManager, type DragData, type DropTarget } from '$lib/utils/drag-drop';

/**
 * TaskItemDragDrop - タスクアイテムのドラッグ&ドロップ処理クラス
 *
 * 責務: タスクに対するドラッグ&ドロップ操作の処理
 */
export class TaskItemDragDrop {
	constructor(private task: TaskWithSubTasks) {}

	handleDragStart = (event: DragEvent) => {
		const dragData: DragData = {
			type: 'task',
			id: this.task.id
		};
		DragDropManager.startDrag(event, dragData);
	};

	handleDragOver = (event: DragEvent) => {
		const target: DropTarget = {
			type: 'task',
			id: this.task.id
		};
		DragDropManager.handleDragOver(event, target);
	};

	handleDrop = (event: DragEvent) => {
		const target: DropTarget = {
			type: 'task',
			id: this.task.id
		};

		const dragData = DragDropManager.handleDrop(event, target);
		if (!dragData) return;

		if (dragData.type === 'tag') {
			// タグをタスクにドロップした場合、タグを付与
			void taskOperations.addTagToTask(this.task.id, dragData.id);
		}
	};

	handleDragEnd = (event: DragEvent) => {
		DragDropManager.handleDragEnd(event);
	};

	handleDragEnter = (event: DragEvent, element: HTMLElement) => {
		DragDropManager.handleDragEnter(event, element);
	};

	handleDragLeave = (event: DragEvent, element: HTMLElement) => {
		DragDropManager.handleDragLeave(event, element);
	};
}
