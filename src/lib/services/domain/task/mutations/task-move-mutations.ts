type TaskMoveContextLike = {
	targetProject: { id: string };
	targetTaskList: { id: string };
};

type TaskCoreStoreLike = {
	moveTaskBetweenLists(taskId: string, newTaskListId: string): TaskMoveContextLike | null | undefined;
	restoreTaskMove(context: TaskMoveContextLike): void;
};

type ErrorHandlerLike = {
	addSyncError(action: string, entity: 'task', itemId: string, error: unknown): void;
};

type TaskServiceLike = {
	updateTask(projectId: string, taskId: string, updates: { listId: string }): Promise<unknown>;
};

export type TaskMoveMutationsDependencies = {
	taskCoreStore: TaskCoreStoreLike;
	errorHandler: ErrorHandlerLike;
	taskService: TaskServiceLike;
};

export class TaskMoveMutations {
	constructor(private readonly deps: TaskMoveMutationsDependencies) {}

	async moveTaskToList(taskId: string, newTaskListId: string): Promise<void> {
		const moveContext = this.deps.taskCoreStore.moveTaskBetweenLists(taskId, newTaskListId);
		if (!moveContext) return;

		try {
			await this.deps.taskService.updateTask(moveContext.targetProject.id, taskId, {
				listId: newTaskListId
			});
		} catch (error) {
			this.deps.taskCoreStore.restoreTaskMove(moveContext);
			this.deps.errorHandler.addSyncError('タスク移動', 'task', taskId, error);
		}
	}
}
