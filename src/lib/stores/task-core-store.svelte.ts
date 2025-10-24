import type { ProjectTree } from '$lib/types/project';
import type { Task, TaskWithSubTasks } from '$lib/types/task';
import { TaskCoreQueries } from './task-core/task-core-queries.svelte';
import { TaskCoreMutations } from './task-core/task-core-mutations.svelte';
import { TaskCoreOperations, type TaskRemovalContext, type TaskMoveContext } from './task-core/task-core-operations.svelte';

// 型を再エクスポート（既存コードとの互換性維持）
export type { TaskRemovalContext, TaskMoveContext };

/**
 * TaskCoreStore
 * タスクのCRUD操作のみを担当する専門ストア（Facadeパターン）
 * プロジェクトツリー構造内のタスクに対する基本的な操作を提供
 */
export class TaskCoreStore {
	projects = $state<ProjectTree[]>([]);

	private queries: TaskCoreQueries;
	private mutations: TaskCoreMutations;
	private operations: TaskCoreOperations;

	constructor() {
		// projectsへの参照を関数として渡すことでリアクティビティを維持
		const projectsRef = () => this.projects;
		this.queries = new TaskCoreQueries(projectsRef);
		this.mutations = new TaskCoreMutations(projectsRef);
		this.operations = new TaskCoreOperations(projectsRef);
	}

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

	// ===== クエリ操作 =====
	getTaskById(taskId: string): TaskWithSubTasks | null {
		return this.queries.getTaskById(taskId);
	}

	// ===== 更新操作 =====
	applyTaskUpdate(taskId: string, updater: (task: TaskWithSubTasks) => void): boolean {
		return this.mutations.applyTaskUpdate(taskId, updater);
	}

	updateTask(taskId: string, updates: Partial<Task>): boolean {
		return this.mutations.updateTask(taskId, updates);
	}

	toggleTaskStatus(taskId: string): void {
		this.mutations.toggleTaskStatus(taskId);
	}

	// ===== 作成操作 =====
	addTask(listId: string, taskData: Partial<Task>): TaskWithSubTasks | null {
		return this.mutations.addTask(listId, taskData);
	}

	createRecurringTask(taskData: Partial<Task>): void {
		this.mutations.createRecurringTask(taskData);
	}

	insertTask(
		listId: string,
		task: TaskWithSubTasks,
		options: { index?: number } = {}
	): TaskWithSubTasks | null {
		return this.mutations.insertTask(listId, task, options);
	}

	// ===== 移動・削除・復元操作 =====
	moveTaskBetweenLists(
		taskId: string,
		newTaskListId: string,
		options: { targetIndex?: number } = {}
	): TaskMoveContext | null {
		return this.operations.moveTaskBetweenLists(taskId, newTaskListId, options);
	}

	removeTask(taskId: string): TaskRemovalContext | null {
		return this.operations.removeTask(taskId);
	}

	restoreTask(removal: TaskRemovalContext): void {
		this.operations.restoreTask(removal);
	}

	restoreTaskMove(context: TaskMoveContext): void {
		this.operations.restoreTaskMove(context);
	}
}

export const taskCoreStore = new TaskCoreStore();
