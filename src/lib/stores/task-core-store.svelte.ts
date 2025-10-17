import type { ProjectTree } from '$lib/types/project';
import type { Task, TaskWithSubTasks } from '$lib/types/task';
import type { TaskListWithTasks } from '$lib/types/task-list';
import { ProjectTreeTraverser } from '$lib/utils/project-tree-traverser';
import { SvelteDate } from 'svelte/reactivity';

/**
 * TaskCoreStore
 * タスクのCRUD操作のみを担当する専門ストア
 * プロジェクトツリー構造内のタスクに対する基本的な操作を提供
 */
export type TaskRemovalContext = {
	project: ProjectTree;
	taskList: TaskListWithTasks;
	task: TaskWithSubTasks;
	index: number;
};

export type TaskMoveContext = {
	task: TaskWithSubTasks;
	sourceProject: ProjectTree;
	sourceTaskList: TaskListWithTasks;
	sourceIndex: number;
	targetProject: ProjectTree;
	targetTaskList: TaskListWithTasks;
	targetIndex: number;
};

export class TaskCoreStore {
	projects = $state<ProjectTree[]>([]);

	/**
	 * プロジェクトデータを設定
	 */
	setProjects(projects: ProjectTree[]): void {
		this.projects = projects;
	}

	/**
	 * プロジェクトデータを読み込み
	 */
	loadProjectsData(data: ProjectTree[]): void {
		this.setProjects(data);
	}

	/**
	 * タスクIDでタスクを取得
	 */
	getTaskById(taskId: string): TaskWithSubTasks | null {
		return ProjectTreeTraverser.findTask(this.projects, taskId);
	}

	/**
	 * タスクを更新
	 */
	applyTaskUpdate(taskId: string, updater: (task: TaskWithSubTasks) => void): boolean {
		return ProjectTreeTraverser.updateTask(this.projects, taskId, (task) => {
			updater(task);
			task.updatedAt = new SvelteDate();
		});
	}

	updateTask(taskId: string, updates: Partial<Task>): boolean {
		return this.applyTaskUpdate(taskId, (task) => {
			Object.assign(task, updates);
		});
	}

	/**
	 * タスクのステータスを切り替え
	 */
	toggleTaskStatus(taskId: string): void {
		const task = this.getTaskById(taskId);
		if (!task) return;

		const newStatus = task.status === 'completed' ? 'not_started' : 'completed';
		this.updateTask(taskId, { status: newStatus });
	}

	/**
	 * 新しいタスクを追加
	 */
	addTask(listId: string, taskData: Partial<Task>): TaskWithSubTasks | null {
		const taskList = ProjectTreeTraverser.findTaskList(this.projects, listId);
		if (!taskList) {
			console.error(`Task list not found: ${listId}`);
			return null;
		}

		const newTask: TaskWithSubTasks = {
			id: crypto.randomUUID(),
			projectId: taskData.projectId!,
			listId: listId,
			title: taskData.title || '',
			description: taskData.description,
			status: taskData.status || 'not_started',
			priority: taskData.priority || 0,
			planStartDate: taskData.planStartDate,
			planEndDate: taskData.planEndDate,
			isRangeDate: taskData.isRangeDate || false,
			orderIndex: taskData.orderIndex || 0,
			isArchived: taskData.isArchived || false,
			assignedUserIds: taskData.assignedUserIds || [],
			tagIds: taskData.tagIds || [],
			createdAt: new SvelteDate(),
			updatedAt: new SvelteDate(),
			subTasks: [],
			tags: []
		};

		return this.insertTask(listId, newTask);
	}

	/**
	 * 繰り返しタスクを作成
	 */
	createRecurringTask(taskData: Partial<Task>): void {
		if (!taskData.listId) {
			console.error('listId is required for recurring task');
			return;
		}

		const taskList = ProjectTreeTraverser.findTaskList(this.projects, taskData.listId);
		if (!taskList) {
			console.error(`Task list not found: ${taskData.listId}`);
			return;
		}

		const newTask: TaskWithSubTasks = {
			id: crypto.randomUUID(),
			projectId: taskData.projectId || taskList.projectId,
			listId: taskData.listId,
			title: taskData.title || '',
			description: taskData.description,
			status: taskData.status || 'not_started',
			priority: taskData.priority || 0,
			planStartDate: taskData.planStartDate,
			planEndDate: taskData.planEndDate,
			isRangeDate: taskData.isRangeDate || false,
			recurrenceRule: taskData.recurrenceRule,
			orderIndex: taskData.orderIndex || 0,
			isArchived: taskData.isArchived || false,
			assignedUserIds: [],
			tagIds: [],
			createdAt: new SvelteDate(),
			updatedAt: new SvelteDate(),
			subTasks: [],
			tags: []
		};

		taskList.tasks.push(newTask);
	}

	/**
	 * タスクを別のタスクリストへ移動
	 */
	moveTaskBetweenLists(
		taskId: string,
		newTaskListId: string,
		options: { targetIndex?: number } = {}
	): TaskMoveContext | null {
		const targetTaskList = ProjectTreeTraverser.findTaskList(this.projects, newTaskListId);
		if (!targetTaskList) {
			console.error(`Target task list not found: ${newTaskListId}`);
			return null;
		}

		const targetProject = ProjectTreeTraverser.findProject(this.projects, targetTaskList.projectId);
		if (!targetProject) {
			console.error(`Target project not found for task list: ${newTaskListId}`);
			return null;
		}

		const sourceContext = ProjectTreeTraverser.findTaskContext(this.projects, taskId);
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
		const context = ProjectTreeTraverser.findTaskContext(this.projects, taskId);
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

	restoreTask(removal: TaskRemovalContext): void {
		const insertIndex = Math.min(removal.index, removal.taskList.tasks.length);
		removal.taskList.tasks.splice(insertIndex, 0, removal.task);
		removal.taskList.updatedAt = new SvelteDate();
		removal.project.updatedAt = new SvelteDate();
		removal.task.listId = removal.taskList.id;
		removal.task.updatedAt = new SvelteDate();
	}

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

	insertTask(
		listId: string,
		task: TaskWithSubTasks,
		options: { index?: number } = {}
	): TaskWithSubTasks | null {
		const taskList = ProjectTreeTraverser.findTaskList(this.projects, listId);
		if (!taskList) {
			console.error(`Task list not found: ${listId}`);
			return null;
		}

		const project = ProjectTreeTraverser.findProject(this.projects, taskList.projectId);
		if (!project) {
			console.error(`Project not found for task list: ${listId}`);
			return null;
		}

		const createdAt = task.createdAt ? new SvelteDate(task.createdAt) : new SvelteDate();
		const updatedAt = task.updatedAt ? new SvelteDate(task.updatedAt) : new SvelteDate();
		const taskToInsert: TaskWithSubTasks = {
			...task,
			createdAt,
			updatedAt,
			subTasks: task.subTasks ? [...task.subTasks] : [],
			tags: task.tags ? [...task.tags] : []
		};

		const insertIndex = Math.min(options.index ?? taskList.tasks.length, taskList.tasks.length);
		taskList.tasks.splice(insertIndex, 0, taskToInsert);
		taskList.updatedAt = new SvelteDate();
		project.updatedAt = new SvelteDate();

		return taskToInsert;
	}

}

export const taskCoreStore = new TaskCoreStore();
