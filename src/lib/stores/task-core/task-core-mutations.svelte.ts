import type { ProjectTree } from '$lib/types/project';
import type { Task, TaskWithSubTasks } from '$lib/types/task';
import type { TaskListWithTasks } from '$lib/types/task-list';
import { ProjectTreeTraverser } from '$lib/utils/project-tree-traverser';
import { SvelteDate } from 'svelte/reactivity';

/**
 * タスク更新・作成操作
 *
 * 責務: タスクの更新、作成、ステータス変更
 */
export class TaskCoreMutations {
	constructor(private projectsRef: () => ProjectTree[]) {}

	/**
	 * タスクを更新
	 */
	applyTaskUpdate(taskId: string, updater: (task: TaskWithSubTasks) => void): boolean {
		return ProjectTreeTraverser.updateTask(this.projectsRef(), taskId, (task) => {
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
		const task = ProjectTreeTraverser.findTask(this.projectsRef(), taskId);
		if (!task) return;

		const newStatus = task.status === 'completed' ? 'not_started' : 'completed';
		this.updateTask(taskId, { status: newStatus });
	}

	/**
	 * 新しいタスクを追加
	 */
	addTask(listId: string, taskData: Partial<Task>): TaskWithSubTasks | null {
		const taskList = ProjectTreeTraverser.findTaskList(this.projectsRef(), listId);
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

		const taskList = ProjectTreeTraverser.findTaskList(this.projectsRef(), taskData.listId);
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
	 * タスクを挿入
	 */
	insertTask(
		listId: string,
		task: TaskWithSubTasks,
		options: { index?: number } = {}
	): TaskWithSubTasks | null {
		const taskList = ProjectTreeTraverser.findTaskList(this.projectsRef(), listId);
		if (!taskList) {
			console.error(`Task list not found: ${listId}`);
			return null;
		}

		const project = ProjectTreeTraverser.findProject(this.projectsRef(), taskList.projectId);
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
