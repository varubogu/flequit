import type { Task, TaskWithSubTasks, TaskStatus } from '$lib/types/task';
import { taskStore } from '$lib/stores/tasks.svelte';
import { taskCoreStore } from '$lib/stores/task-core-store.svelte';
import { taskListStore } from '$lib/stores/task-list-store.svelte';
import { TaggingService } from '$lib/services/domain/tagging';
import { tagStore } from '$lib/stores/tags.svelte';
import { errorHandler } from '$lib/stores/error-handler.svelte';
import { TaskRecurrenceService } from '../task-recurrence';

type TaskStoreLike = Pick<
	typeof taskStore,
	| 'selectedTaskId'
	| 'getTaskById'
	| 'getTaskProjectAndList'
	| 'attachTagToTask'
	| 'detachTagFromTask'
>;

type TaskCoreStoreLike = Pick<
	typeof taskCoreStore,
	'toggleTaskStatus' | 'updateTask' | 'deleteTask' | 'addTask'
>;

type TaskListStoreLike = Pick<typeof taskListStore, 'getProjectIdByListId'>;

type TagStoreLike = Pick<typeof tagStore, 'tags'>;

type TaggingServiceLike = Pick<typeof TaggingService, 'createTaskTag' | 'deleteTaskTag'>;

type ErrorHandlerLike = Pick<typeof errorHandler, 'addSyncError'>;

type TaskMutationDependencies = {
	taskStore: TaskStoreLike;
	taskCoreStore: TaskCoreStoreLike;
	taskListStore: TaskListStoreLike;
	tagStore: TagStoreLike;
	taggingService: TaggingServiceLike;
	errorHandler: ErrorHandlerLike;
	recurrenceService: TaskRecurrenceService;
};

function getDefaultDependencies(): TaskMutationDependencies {
	return {
		taskStore,
		taskCoreStore,
		taskListStore,
		tagStore,
		taggingService: TaggingService,
		errorHandler,
		recurrenceService: new TaskRecurrenceService()
	};
}

/**
 * タスク変更操作サービス
 *
 * 責務:
 * 1. タスクのステータス変更
 * 2. タスクの更新（フォームからの更新を含む）
 * 3. タスクの削除
 * 4. タスクの作成
 * 5. タスクへのタグ操作
 * 6. ビュー用の期日更新
 */
export class TaskMutations {
	#deps: TaskMutationDependencies;

	constructor(deps?: TaskMutationDependencies) {
		this.#deps = deps ?? getDefaultDependencies();
	}

	async toggleTaskStatus(taskId: string): Promise<void> {
		await this.#deps.taskCoreStore.toggleTaskStatus(taskId);
	}

	updateTask(taskId: string, updates: Partial<Task>): void {
		void this.#deps.taskCoreStore.updateTask(taskId, updates);
	}

	updateTaskFromForm(
		taskId: string,
		formData: {
			title: string;
			description: string;
			planStartDate?: Date;
			planEndDate?: Date;
			isRangeDate?: boolean;
			priority: number;
		}
	): void {
		const updates: Partial<Task> = {
			title: formData.title,
			description: formData.description || undefined,
			priority: formData.priority,
			planStartDate: formData.planStartDate,
			planEndDate: formData.planEndDate,
			isRangeDate: formData.isRangeDate || false
		};

		this.updateTask(taskId, updates);
	}

	async changeTaskStatus(taskId: string, newStatus: TaskStatus): Promise<void> {
		const { taskStore, taskCoreStore, recurrenceService } = this.#deps;
		const currentTask = taskStore.getTaskById(taskId);

		if (newStatus === 'completed' && currentTask?.recurrenceRule) {
			recurrenceService.scheduleNextOccurrence(currentTask);
		}

		await taskCoreStore.updateTask(taskId, { status: newStatus });
	}

	async deleteTask(taskId: string): Promise<void> {
		const { taskStore, taskCoreStore } = this.#deps;
		if (taskStore.selectedTaskId === taskId) {
			taskStore.selectedTaskId = null;
		}

		await taskCoreStore.deleteTask(taskId);
	}

	async addTask(
		listId: string,
		taskData: {
			title: string;
			description?: string;
			priority?: number;
		}
	): Promise<TaskWithSubTasks | null> {
		const { taskListStore, taskCoreStore } = this.#deps;
		const projectId = taskListStore.getProjectIdByListId(listId);
		if (!projectId) {
			console.error('Failed to find project for list:', listId);
			return null;
		}

		return taskCoreStore.addTask(listId, {
			projectId,
			listId,
			title: taskData.title,
			description: taskData.description,
			status: 'not_started',
			priority: taskData.priority || 0,
			assignedUserIds: [],
			tagIds: [],
			orderIndex: 0,
			isArchived: false,
			createdAt: new Date(),
			updatedAt: new Date()
		});
	}

	async addTagToTaskByName(taskId: string, tagName: string): Promise<void> {
		const { taskStore, taggingService, errorHandler } = this.#deps;
		const trimmed = tagName.trim();
		if (!trimmed) {
			console.warn('Empty tag name provided');
			return;
		}

		const context = taskStore.getTaskProjectAndList(taskId);
		if (!context) {
			console.error('Failed to find task:', taskId);
			return;
		}

		try {
			const tag = await taggingService.createTaskTag(context.project.id, taskId, trimmed);
			taskStore.attachTagToTask(taskId, tag);
		} catch (error) {
			console.error('Failed to sync tag addition to backends:', error);
			errorHandler.addSyncError('タスクタグ追加', 'task', taskId, error);
		}
	}

	async addTagToTask(taskId: string, tagId: string): Promise<void> {
		const { tagStore, taggingService, taskStore, errorHandler } = this.#deps;
		const tag = tagStore.tags.find((t) => t.id === tagId);
		if (!tag) return;

		const context = taskStore.getTaskProjectAndList(taskId);
		if (!context) {
			console.error('Failed to find task:', taskId);
			return;
		}

		try {
			const created = await taggingService.createTaskTag(context.project.id, taskId, tag.name);
			taskStore.attachTagToTask(taskId, created);
		} catch (error) {
			console.error('Failed to sync tag addition to backends:', error);
			errorHandler.addSyncError('タスクタグ追加', 'task', taskId, error);
		}
	}

	async removeTagFromTask(taskId: string, tagId: string): Promise<void> {
		const { taskStore, taggingService, errorHandler } = this.#deps;
		const context = taskStore.getTaskProjectAndList(taskId);
		if (!context) return;

		const removed = taskStore.detachTagFromTask(taskId, tagId);
		if (!removed) return;

		try {
			await taggingService.deleteTaskTag(context.project.id, taskId, tagId);
		} catch (error) {
			console.error('Failed to sync tag removal to backends:', error);
			taskStore.attachTagToTask(taskId, removed);
			errorHandler.addSyncError('タスクタグ削除', 'task', taskId, error);
		}
	}

	updateTaskDueDateForView(taskId: string, viewId: string): void {
		const { taskCoreStore } = this.#deps;
		const today = new Date();
		let newDueDate: Date | undefined;

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
			void taskCoreStore.updateTask(taskId, { planEndDate: newDueDate });
		}
	}
}
