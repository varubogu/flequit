import type { Task, TaskStatus, TaskWithSubTasks } from '$lib/types/task';
import { SvelteDate } from 'svelte/reactivity';
import type { TaskStore } from '$lib/stores/tasks.svelte';
import type {
	TaskCoreStore,
	TaskMoveContext,
	TaskRemovalContext
} from '$lib/stores/task-core-store.svelte';
import type { TaskListStore } from '$lib/stores/task-list-store.svelte';
import type { TagStore } from '$lib/stores/tags.svelte';
import type { TaggingService as TaggingServiceType } from '$lib/services/domain/tagging';
import type { ErrorHandlerStore } from '$lib/stores/error-handler.svelte';
import type { TaskRecurrenceService } from '../task-recurrence';

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

type TagStoreLike = Pick<TagStore, 'tags'>;

type TaggingServiceLike = Pick<TaggingServiceType, 'createTaskTag' | 'deleteTaskTag'>;

type ErrorHandlerLike = Pick<ErrorHandlerStore, 'addSyncError'>;

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

export class TaskMutations {
	#deps: TaskMutationDependencies;

	constructor(deps: TaskMutationDependencies) {
		this.#deps = deps;
	}

	async toggleTaskStatus(taskId: string): Promise<void> {
		const task = this.#deps.taskStore.getTaskById(taskId);
		if (!task) {
			console.error('Failed to find task:', taskId);
			return;
		}

		const newStatus = task.status === 'completed' ? 'not_started' : 'completed';
		await this.updateTask(taskId, { status: newStatus });
	}

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

	async changeTaskStatus(taskId: string, newStatus: TaskStatus): Promise<void> {
		const { taskStore, recurrenceService } = this.#deps;
		const currentTask = taskStore.getTaskById(taskId);

		if (newStatus === 'completed' && currentTask?.recurrenceRule) {
			recurrenceService.scheduleNextOccurrence(currentTask);
		}

		await this.updateTask(taskId, { status: newStatus });
	}

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

	async addTask(listId: string, taskData: Partial<TaskWithSubTasks>): Promise<TaskWithSubTasks | null> {
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

	async addTagToTaskByName(taskId: string, tagName: string): Promise<void> {
		const { taskStore, taggingService, errorHandler, tagStore } = this.#deps;
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
			tagStore.addTagWithId(tag);
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
