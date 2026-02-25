import type { Task, TaskWithSubTasks } from '$lib/types/task';
import { SvelteDate } from 'svelte/reactivity';

type TaskProjectContext = {
	project: { id: string };
	taskList: { id: string };
};

type TaskRemovalContextLike = {
	project: { id: string };
	taskList: { id: string; tasks: TaskWithSubTasks[] };
	task: TaskWithSubTasks;
	index: number;
};

type TaskStoreLike = {
	selectedTaskId: string | null;
	getTaskById(taskId: string): TaskWithSubTasks | null | undefined;
	getTaskProjectAndList(taskId: string): TaskProjectContext | null | undefined;
};

type TaskCoreStoreLike = {
	applyTaskUpdate(taskId: string, updater: (task: TaskWithSubTasks) => void): boolean;
	insertTask(listId: string, task: TaskWithSubTasks): TaskWithSubTasks | null | undefined;
	removeTask(taskId: string): TaskRemovalContextLike | null | undefined;
	restoreTask(removal: TaskRemovalContextLike): void;
};

type TaskListStoreLike = {
	getProjectIdByListId(listId: string): string | null | undefined;
};

type ErrorHandlerLike = {
	addSyncError(action: string, entity: 'task', itemId: string, error: unknown): void;
};

type TaskServiceLike = {
	createTaskWithSubTasks(listId: string, task: TaskWithSubTasks): Promise<unknown>;
	updateTaskWithSubTasks(
		projectId: string,
		taskId: string,
		updates: Partial<TaskWithSubTasks>
	): Promise<unknown>;
	deleteTaskWithSubTasks(projectId: string, taskId: string): Promise<unknown>;
	updateTask(projectId: string, taskId: string, updates: Partial<Task>): Promise<unknown>;
};

export type TaskCrudMutationsDependencies = {
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

export class TaskCrudMutations {
	constructor(private readonly deps: TaskCrudMutationsDependencies) {}

	async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
		const context = this.deps.taskStore.getTaskProjectAndList(taskId);
		if (!context) return;

		const currentTask = this.deps.taskStore.getTaskById(taskId);
		if (!currentTask) return;

		const snapshot = cloneTask(currentTask);
		const applied = this.deps.taskCoreStore.applyTaskUpdate(taskId, (task) => {
			Object.assign(task, updates);
		});
		if (!applied) return;

		try {
			await this.deps.taskService.updateTaskWithSubTasks(context.project.id, taskId, {
				...updates
			});
		} catch (error) {
			this.deps.taskCoreStore.applyTaskUpdate(taskId, (task) => {
				Object.assign(task, snapshot);
				task.updatedAt = new SvelteDate(snapshot.updatedAt);
			});
			this.deps.errorHandler.addSyncError('タスク更新', 'task', taskId, error);
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
		await this.updateTask(taskId, {
			title: formData.title,
			description: formData.description || undefined,
			planStartDate: formData.planStartDate,
			planEndDate: formData.planEndDate,
			isRangeDate: formData.isRangeDate ?? false,
			priority: formData.priority
		});
	}

	async deleteTask(taskId: string): Promise<void> {
		if (this.deps.taskStore.selectedTaskId === taskId) {
			this.deps.taskStore.selectedTaskId = null;
		}

		const removal = this.deps.taskCoreStore.removeTask(taskId);
		if (!removal) return;

		try {
			await this.deps.taskService.deleteTaskWithSubTasks(removal.project.id, taskId);
		} catch (error) {
			this.deps.taskCoreStore.restoreTask(removal);
			this.deps.errorHandler.addSyncError('タスク削除', 'task', taskId, error);
		}
	}

	async addTask(
		listId: string,
		taskData: Partial<TaskWithSubTasks>
	): Promise<TaskWithSubTasks | null> {
		const projectId = this.deps.taskListStore.getProjectIdByListId(listId);
		if (!projectId) {
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
			updatedBy: 'system',
			subTasks: taskData.subTasks ? [...taskData.subTasks] : [],
			tags: taskData.tags ? [...taskData.tags] : []
		};

		const inserted = this.deps.taskCoreStore.insertTask(listId, newTask);
		if (!inserted) {
			return null;
		}

		try {
			await this.deps.taskService.createTaskWithSubTasks(listId, inserted);
			return inserted;
		} catch {
			this.deps.taskCoreStore.removeTask(inserted.id);
			return null;
		}
	}

	async updateTaskDueDateForView(taskId: string, viewId: string): Promise<void> {
		const context = this.deps.taskStore.getTaskProjectAndList(taskId);
		if (!context) return;

		const today = new Date();
		let planEndDate: Date | undefined;

		switch (viewId) {
			case 'today':
				planEndDate = new Date(today);
				break;
			case 'tomorrow':
				planEndDate = new Date(today);
				planEndDate.setDate(today.getDate() + 1);
				break;
			case 'next3days':
				planEndDate = new Date(today);
				planEndDate.setDate(today.getDate() + 3);
				break;
			case 'nextweek':
				planEndDate = new Date(today);
				planEndDate.setDate(today.getDate() + 7);
				break;
			case 'thismonth':
				planEndDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
				break;
			default:
				return;
		}

		await this.deps.taskService.updateTaskWithSubTasks(context.project.id, taskId, {
			planEndDate
		});
	}
}
