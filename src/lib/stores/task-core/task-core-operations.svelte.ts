import type { ProjectTree } from '$lib/types/project';
import type { TaskWithSubTasks } from '$lib/types/task';
import type { TaskListWithTasks } from '$lib/types/task-list';
import { ProjectTreeTraverser } from '$lib/utils/project-tree-traverser';
import { SvelteDate } from 'svelte/reactivity';

/**
 * タスク削除コンテキスト
 */
export type TaskRemovalContext = {
	project: ProjectTree;
	taskList: TaskListWithTasks;
	task: TaskWithSubTasks;
	index: number;
};

/**
 * タスク移動コンテキスト
 */
export type TaskMoveContext = {
	task: TaskWithSubTasks;
	sourceProject: ProjectTree;
	sourceTaskList: TaskListWithTasks;
	sourceIndex: number;
	targetProject: ProjectTree;
	targetTaskList: TaskListWithTasks;
	targetIndex: number;
};

/**
 * タスク操作
 *
 * 責務: タスクの移動、削除、復元などの複雑な操作
 */
export class TaskCoreOperations {
	constructor(private projectsRef: () => ProjectTree[]) {}

	/**
	 * タスクを別のタスクリストへ移動
	 */
	moveTaskBetweenLists(
		taskId: string,
		newTaskListId: string,
		options: { targetIndex?: number } = {}
	): TaskMoveContext | null {
		const targetTaskList = ProjectTreeTraverser.findTaskList(this.projectsRef(), newTaskListId);
		if (!targetTaskList) {
			console.error(`Target task list not found: ${newTaskListId}`);
			return null;
		}

		const targetProject = ProjectTreeTraverser.findProject(this.projectsRef(), targetTaskList.projectId);
		if (!targetProject) {
			console.error(`Target project not found for task list: ${newTaskListId}`);
			return null;
		}

		const sourceContext = ProjectTreeTraverser.findTaskContext(this.projectsRef(), taskId);
		if (!sourceContext) {
			console.error(`Task not found for move: ${taskId}`);
			return null;
		}

		const { project: sourceProject, taskList: sourceTaskList } = sourceContext;
		const sourceIndex = sourceTaskList.tasks.findIndex((t) => t.id === taskId);
		if (sourceIndex === -1) return null;

		const [taskToMove] = sourceTaskList.tasks.splice(sourceIndex, 1);
		sourceTaskList.updatedAt = new SvelteDate();
		sourceProject.updatedAt = new SvelteDate();

		taskToMove.listId = newTaskListId;
		taskToMove.updatedAt = new SvelteDate();

		const targetIndex = Math.min(
			options.targetIndex ?? targetTaskList.tasks.length,
			targetTaskList.tasks.length
		);
		targetTaskList.tasks.splice(targetIndex, 0, taskToMove);
		targetTaskList.updatedAt = new SvelteDate();
		targetProject.updatedAt = new SvelteDate();

		return {
			task: taskToMove,
			sourceProject,
			sourceTaskList,
			sourceIndex,
			targetProject,
			targetTaskList,
			targetIndex
		};
	}

	/**
	 * タスクを削除
	 */
	removeTask(taskId: string): TaskRemovalContext | null {
		const context = ProjectTreeTraverser.findTaskContext(this.projectsRef(), taskId);
		if (!context) {
			console.error(`Task not found: ${taskId}`);
			return null;
		}

		const { project, taskList } = context;
		const taskIndex = taskList.tasks.findIndex((t) => t.id === taskId);
		if (taskIndex === -1) return null;

		const deletedTask = taskList.tasks[taskIndex];

		taskList.tasks.splice(taskIndex, 1);
		taskList.updatedAt = new SvelteDate();
		project.updatedAt = new SvelteDate();

		return {
			project,
			taskList,
			task: deletedTask,
			index: taskIndex
		};
	}

	/**
	 * 削除したタスクを復元
	 */
	restoreTask(removal: TaskRemovalContext): void {
		const insertIndex = Math.min(removal.index, removal.taskList.tasks.length);
		removal.taskList.tasks.splice(insertIndex, 0, removal.task);
		removal.taskList.updatedAt = new SvelteDate();
		removal.project.updatedAt = new SvelteDate();
		removal.task.listId = removal.taskList.id;
		removal.task.updatedAt = new SvelteDate();
	}

	/**
	 * 移動したタスクを元に戻す
	 */
	restoreTaskMove(context: TaskMoveContext): void {
		context.targetTaskList.tasks.splice(context.targetIndex, 1);
		context.targetTaskList.updatedAt = new SvelteDate();
		context.targetProject.updatedAt = new SvelteDate();

		const insertIndex = Math.min(context.sourceIndex, context.sourceTaskList.tasks.length);
		context.sourceTaskList.tasks.splice(insertIndex, 0, context.task);
		context.task.listId = context.sourceTaskList.id;
		context.task.updatedAt = new SvelteDate();
		context.sourceTaskList.updatedAt = new SvelteDate();
		context.sourceProject.updatedAt = new SvelteDate();
	}
}
