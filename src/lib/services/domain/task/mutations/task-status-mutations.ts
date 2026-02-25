import type { TaskStatus, TaskWithSubTasks } from '$lib/types/task';

type TaskStoreLike = {
	getTaskById(taskId: string): TaskWithSubTasks | null | undefined;
};

type RecurrenceServiceLike = {
	scheduleNextOccurrence(task: TaskWithSubTasks): void;
};

type CrudMutationsLike = {
	updateTask(taskId: string, updates: { status: TaskStatus }): Promise<void>;
};

export type TaskStatusMutationsDependencies = {
	taskStore: TaskStoreLike;
	recurrenceService: RecurrenceServiceLike;
	crudMutations: CrudMutationsLike;
};

export class TaskStatusMutations {
	constructor(private readonly deps: TaskStatusMutationsDependencies) {}

	async toggleTaskStatus(taskId: string): Promise<void> {
		const task = this.deps.taskStore.getTaskById(taskId);
		if (!task) return;

		const status: TaskStatus = task.status === 'completed' ? 'not_started' : 'completed';
		await this.deps.crudMutations.updateTask(taskId, { status });
	}

	async changeTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
		const task = this.deps.taskStore.getTaskById(taskId);
		if (status === 'completed' && task?.recurrenceRule) {
			this.deps.recurrenceService.scheduleNextOccurrence(task);
		}

		await this.deps.crudMutations.updateTask(taskId, { status });
	}
}
