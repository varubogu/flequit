/**
 * TaskMutations Facade
 *
 * 既存のインポートとの互換性を維持するためのFacadeクラス。
 * 実際の処理は責務ごとに分割された各mutationクラスに委譲する。
 *
 * 新規実装では、直接分割されたクラスを使用することを推奨。
 * - TaskCrudMutations: CRUD操作
 * - TaskStatusMutations: ステータス変更
 * - TaskTagMutations: タグ管理
 * - TaskMoveMutations: 移動操作
 */

import type { Task, TaskStatus, TaskWithSubTasks } from '$lib/types/task';
import type { TaskStore } from '$lib/stores/tasks.svelte';
import type { TaskCoreStore } from '$lib/stores/task-core-store.svelte';
import type { TaskListStore } from '$lib/stores/task-list-store.svelte';
import type { TagStore } from '$lib/stores/tags.svelte';
import { TaggingService } from '$lib/services/domain/tagging';
import type { ErrorHandler } from '$lib/stores/error-handler.svelte';
import type { TaskRecurrenceService } from '../task-recurrence';
import { TaskCrudMutations, type TaskServiceLike } from './mutations/task-crud-mutations';
import { TaskStatusMutations } from './mutations/task-status-mutations';
import { TaskTagMutations } from './mutations/task-tag-mutations';
import { TaskMoveMutations } from './mutations/task-move-mutations';

// 型定義の互換性維持のためのエクスポート
export type { TaskServiceLike };

type TaskStoreLike = Pick<
	TaskStore,
	| 'selectedTaskId'
	| 'getTaskById'
	| 'getTaskProjectAndList'
	| 'attachTagToTask'
	| 'detachTagFromTask'
>;

type TaskCoreStoreLike = Pick<
	TaskCoreStore,
	| 'applyTaskUpdate'
	| 'updateTask'
	| 'insertTask'
	| 'removeTask'
	| 'restoreTask'
	| 'moveTaskBetweenLists'
	| 'restoreTaskMove'
>;

type TaskListStoreLike = Pick<TaskListStore, 'getProjectIdByListId'>;

type TagStoreLike = Pick<TagStore, 'tags' | 'addTagWithId'>;

type TaggingServiceLike = Pick<typeof TaggingService, 'createTaskTag' | 'deleteTaskTag'>;

type ErrorHandlerLike = Pick<ErrorHandler, 'addSyncError'>;

export type TaskMutationDependencies = {
	taskStore: TaskStoreLike;
	taskCoreStore: TaskCoreStoreLike;
	taskListStore: TaskListStoreLike;
	tagStore: TagStoreLike;
	taggingService: TaggingServiceLike;
	errorHandler: ErrorHandlerLike;
	taskService: TaskServiceLike;
	recurrenceService: TaskRecurrenceService;
};

/**
 * TaskMutations - タスクの変更操作を提供するFacadeクラス
 *
 * @deprecated 新規実装では分割された各mutationクラスを直接使用してください
 */
export class TaskMutations {
	#crudMutations: TaskCrudMutations;
	#statusMutations: TaskStatusMutations;
	#tagMutations: TaskTagMutations;
	#moveMutations: TaskMoveMutations;

	constructor(deps: TaskMutationDependencies) {
		this.#crudMutations = new TaskCrudMutations({
			taskStore: deps.taskStore,
			taskCoreStore: deps.taskCoreStore,
			taskListStore: deps.taskListStore,
			errorHandler: deps.errorHandler,
			taskService: deps.taskService
		});

		// TaskStatusMutationsはTaskCrudMutationsに依存
		this.#statusMutations = new TaskStatusMutations({
			taskStore: deps.taskStore,
			recurrenceService: deps.recurrenceService,
			crudMutations: this.#crudMutations
		});

		this.#tagMutations = new TaskTagMutations({
			taskStore: deps.taskStore,
			tagStore: deps.tagStore,
			taggingService: deps.taggingService,
			errorHandler: deps.errorHandler
		});

		this.#moveMutations = new TaskMoveMutations({
			taskCoreStore: deps.taskCoreStore,
			errorHandler: deps.errorHandler,
			taskService: deps.taskService
		});
	}

	// ===== ステータス変更操作 =====

	async toggleTaskStatus(taskId: string): Promise<void> {
		return this.#statusMutations.toggleTaskStatus(taskId);
	}

	async changeTaskStatus(taskId: string, newStatus: TaskStatus): Promise<void> {
		return this.#statusMutations.changeTaskStatus(taskId, newStatus);
	}

	// ===== CRUD操作 =====

	async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
		return this.#crudMutations.updateTask(taskId, updates);
	}

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
		return this.#crudMutations.updateTaskFromForm(taskId, formData);
	}

	async deleteTask(taskId: string): Promise<void> {
		return this.#crudMutations.deleteTask(taskId);
	}

	async addTask(listId: string, taskData: Partial<TaskWithSubTasks>): Promise<TaskWithSubTasks | null> {
		return this.#crudMutations.addTask(listId, taskData);
	}

	async updateTaskDueDateForView(taskId: string, viewId: string): Promise<void> {
		return this.#crudMutations.updateTaskDueDateForView(taskId, viewId);
	}

	// ===== タグ管理操作 =====

	async addTagToTaskByName(taskId: string, tagName: string): Promise<void> {
		return this.#tagMutations.addTagToTaskByName(taskId, tagName);
	}

	async addTagToTask(taskId: string, tagId: string): Promise<void> {
		return this.#tagMutations.addTagToTask(taskId, tagId);
	}

	async removeTagFromTask(taskId: string, tagId: string): Promise<void> {
		return this.#tagMutations.removeTagFromTask(taskId, tagId);
	}

	// ===== 移動操作 =====

	async moveTaskToList(taskId: string, newTaskListId: string): Promise<void> {
		return this.#moveMutations.moveTaskToList(taskId, newTaskListId);
	}
}
