import type { Task } from '$lib/types/task';
import type { TaskCoreStore } from '$lib/stores/task-core-store.svelte';
import type { ErrorHandler } from '$lib/stores/error-handler.svelte';

type TaskCoreStoreLike = Pick<TaskCoreStore, 'moveTaskBetweenLists' | 'restoreTaskMove'>;

type ErrorHandlerLike = Pick<ErrorHandler, 'addSyncError'>;

export type TaskServiceLike = {
	updateTask(projectId: string, taskId: string, updates: Partial<Task>): Promise<unknown>;
};

export type TaskMoveMutationDependencies = {
	taskCoreStore: TaskCoreStoreLike;
	errorHandler: ErrorHandlerLike;
	taskService: TaskServiceLike;
};

/**
 * タスクの移動操作に関する機能を提供するクラス
 */
export class TaskMoveMutations {
	#deps: TaskMoveMutationDependencies;

	constructor(deps: TaskMoveMutationDependencies) {
		this.#deps = deps;
	}

	/**
	 * タスクを別のリストに移動する
	 */
	async moveTaskToList(taskId: string, newTaskListId: string): Promise<void> {
		const { taskCoreStore, taskService, errorHandler } = this.#deps;
		const moveContext = taskCoreStore.moveTaskBetweenLists(taskId, newTaskListId);
		if (!moveContext) return;

		try {
			await taskService.updateTask(moveContext.targetProject.id, taskId, { listId: newTaskListId });
		} catch (error) {
			console.error('Failed to sync task move to backends:', error);
			taskCoreStore.restoreTaskMove(moveContext);
			errorHandler.addSyncError('タスク移動', 'task', taskId, error);
		}
	}
}
