import type { TaskStatus } from '$lib/types/task';
import type { TaskStore } from '$lib/stores/tasks.svelte';
import type { TaskRecurrenceService } from '../../task-recurrence';
import type { TaskCrudMutations } from './task-crud-mutations';

type TaskStoreLike = Pick<TaskStore, 'getTaskById'>;

export type TaskStatusMutationDependencies = {
	taskStore: TaskStoreLike;
	recurrenceService: TaskRecurrenceService;
	crudMutations: TaskCrudMutations;
};

/**
 * タスクのステータス変更に関する操作を提供するクラス
 */
export class TaskStatusMutations {
	#deps: TaskStatusMutationDependencies;

	constructor(deps: TaskStatusMutationDependencies) {
		this.#deps = deps;
	}

	/**
	 * タスクのステータスをトグルする（完了 ⇔ 未開始）
	 */
	async toggleTaskStatus(taskId: string): Promise<void> {
		const task = this.#deps.taskStore.getTaskById(taskId);
		if (!task) {
			console.error('Failed to find task:', taskId);
			return;
		}

		const newStatus = task.status === 'completed' ? 'not_started' : 'completed';
		await this.changeTaskStatus(taskId, newStatus);
	}

	/**
	 * タスクのステータスを変更する
	 * 完了時に繰り返しルールがある場合は次の発生をスケジュールする
	 */
	async changeTaskStatus(taskId: string, newStatus: TaskStatus): Promise<void> {
		const { taskStore, recurrenceService, crudMutations } = this.#deps;
		const currentTask = taskStore.getTaskById(taskId);

		if (newStatus === 'completed' && currentTask?.recurrenceRule) {
			recurrenceService.scheduleNextOccurrence(currentTask);
		}

		await crudMutations.updateTask(taskId, { status: newStatus });
	}
}
