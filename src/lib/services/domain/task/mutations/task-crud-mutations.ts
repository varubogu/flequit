import type { Task, TaskWithSubTasks } from '$lib/types/task';
import { SvelteDate } from 'svelte/reactivity';
import type { TaskStore } from '$lib/stores/tasks.svelte';
import type { TaskCoreStore } from '$lib/stores/task-core-store.svelte';
import type { TaskListStore } from '$lib/stores/task-list-store.svelte';
import type { ErrorHandler } from '$lib/stores/error-handler.svelte';
import { getCurrentUserId } from '$lib/utils/user-id-helper';

type TaskStoreLike = Pick<TaskStore, 'selectedTaskId' | 'getTaskById' | 'getTaskProjectAndList'>;

type TaskCoreStoreLike = Pick<
	TaskCoreStore,
	'applyTaskUpdate' | 'updateTask' | 'insertTask' | 'removeTask' | 'restoreTask'
>;

type TaskListStoreLike = Pick<TaskListStore, 'getProjectIdByListId'>;

type ErrorHandlerLike = Pick<ErrorHandler, 'addSyncError'>;

export type TaskServiceLike = {
	createTaskWithSubTasks(listId: string, task: Task): Promise<void>;
	updateTaskWithSubTasks(
		projectId: string,
		taskId: string,
		updates: Partial<Task>
	): Promise<void>;
	deleteTaskWithSubTasks(projectId: string, taskId: string): Promise<boolean>;
	updateTask(projectId: string, taskId: string, updates: Partial<Task>): Promise<unknown>;
};

export type TaskCrudMutationDependencies = {
	taskStore: TaskStoreLike;
	taskCoreStore: TaskCoreStoreLike;
	taskListStore: TaskListStoreLike;
	errorHandler: ErrorHandlerLike;
	taskService: TaskServiceLike;
};

function cloneTask(task: TaskWithSubTasks): TaskWithSubTasks {
	return {
		...task,
		subTasks: [...task.subTasks],
		tags: [...task.tags],
		createdAt: new Date(task.createdAt),
		updatedAt: new Date(task.updatedAt)
	};
}

function toSvelteDate(date: Date | undefined): SvelteDate {
	return new SvelteDate(date ?? new Date());
}

/**
 * タスクのCRUD操作に関する機能を提供するクラス
 */
export class TaskCrudMutations {
	#deps: TaskCrudMutationDependencies;

	constructor(deps: TaskCrudMutationDependencies) {
		this.#deps = deps;
	}

	/**
	 * タスクを更新する
	 */
	async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
		const { taskStore, taskCoreStore, taskService, errorHandler } = this.#deps;
		const context = taskStore.getTaskProjectAndList(taskId);
		if (!context) {
			console.error('Failed to find task:', taskId);
			return;
		}

		const currentTask = taskStore.getTaskById(taskId);
		if (!currentTask) {
			console.error('Failed to find task for update:', taskId);
			return;
		}

		const snapshot = cloneTask(currentTask);
		const applied = taskCoreStore.applyTaskUpdate(taskId, (task) => {
			Object.assign(task, updates);
		});
		if (!applied) {
			console.error('Failed to apply task update:', taskId);
			return;
		}

		try {
			await taskService.updateTaskWithSubTasks(
				context.project.id,
				taskId,
				updates as Partial<TaskWithSubTasks>
			);
		} catch (error) {
			console.error('Failed to sync task update to backends:', error);
			taskCoreStore.applyTaskUpdate(taskId, (task) => {
				Object.assign(task, snapshot);
				task.updatedAt = toSvelteDate(snapshot.updatedAt);
			});
			errorHandler.addSyncError('タスク更新', 'task', taskId, error);
		}
	}

	/**
	 * フォームデータからタスクを更新する
	 */
	async updateTaskFromForm(
		taskId: string,
		formData: {
			title: string;
			description: string;
			planStartDate?: Date;
			planEndDate?: Date;
			isRangeDate?: boolean;
			priority: number;
		}
	): Promise<void> {
		const updates: Partial<Task> = {
			title: formData.title,
			description: formData.description || undefined,
			priority: formData.priority,
			planStartDate: formData.planStartDate,
			planEndDate: formData.planEndDate,
			isRangeDate: formData.isRangeDate || false
		};

		await this.updateTask(taskId, updates);
	}

	/**
	 * タスクを削除する
	 */
	async deleteTask(taskId: string): Promise<void> {
		const { taskStore, taskCoreStore, taskService, errorHandler } = this.#deps;
		if (taskStore.selectedTaskId === taskId) {
			taskStore.selectedTaskId = null;
		}

		const removal = taskCoreStore.removeTask(taskId);
		if (!removal) return;

		try {
			await taskService.deleteTaskWithSubTasks(removal.project.id, taskId);
		} catch (error) {
			console.error('Failed to sync task deletion to backends:', error);
			taskCoreStore.restoreTask(removal);
			errorHandler.addSyncError('タスク削除', 'task', taskId, error);
		}
	}

	/**
	 * タスクを追加する
	 */
	async addTask(
		listId: string,
		taskData: Partial<TaskWithSubTasks>
	): Promise<TaskWithSubTasks | null> {
		const { taskListStore, taskCoreStore, taskService, errorHandler } = this.#deps;
		const projectId = taskListStore.getProjectIdByListId(listId);
		if (!projectId) {
			console.error('Failed to find project for list:', listId);
			return null;
		}

		const newTask: TaskWithSubTasks = {
			id: crypto.randomUUID(),
			projectId,
			listId,
			title: taskData.title?.trim() ?? '',
			description: taskData.description,
			status: taskData.status ?? 'not_started',
			priority: taskData.priority ?? 0,
			planStartDate: taskData.planStartDate,
			planEndDate: taskData.planEndDate,
			isRangeDate: taskData.isRangeDate ?? false,
			recurrenceRule: taskData.recurrenceRule,
			orderIndex: taskData.orderIndex ?? 0,
			isArchived: taskData.isArchived ?? false,
			assignedUserIds: taskData.assignedUserIds ?? [],
			tagIds: taskData.tagIds ?? [],
			createdAt: new SvelteDate(),
			updatedAt: new SvelteDate(),
			deleted: false,
			updatedBy: getCurrentUserId(),
			subTasks: taskData.subTasks ? [...taskData.subTasks] : [],
			tags: taskData.tags ? [...taskData.tags] : []
		};

		const inserted = taskCoreStore.insertTask(listId, newTask);
		if (!inserted) return null;

		try {
			await taskService.createTaskWithSubTasks(listId, inserted);
			return inserted;
		} catch (error) {
			console.error('Failed to sync new task to backends:', error);
			taskCoreStore.removeTask(inserted.id);
			errorHandler.addSyncError('タスク作成', 'task', inserted.id, error);
			return null;
		}
	}

	/**
	 * ビューに応じてタスクの期日を更新する
	 */
	async updateTaskDueDateForView(taskId: string, viewId: string): Promise<void> {
		let newDueDate: Date | undefined;
		const today = new Date();

		switch (viewId) {
			case 'today':
				newDueDate = new Date(today);
				break;
			case 'tomorrow':
				newDueDate = new Date(today);
				newDueDate.setDate(today.getDate() + 1);
				break;
			case 'next3days':
				newDueDate = new Date(today);
				newDueDate.setDate(today.getDate() + 3);
				break;
			case 'nextweek':
				newDueDate = new Date(today);
				newDueDate.setDate(today.getDate() + 7);
				break;
			case 'thismonth':
				newDueDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
				break;
			default:
				return;
		}

		if (newDueDate) {
			await this.updateTask(taskId, { planEndDate: newDueDate });
		}
	}
}
