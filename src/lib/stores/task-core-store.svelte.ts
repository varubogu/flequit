import type { ProjectTree } from '$lib/types/project';
import type { Task, TaskWithSubTasks } from '$lib/types/task';
import { ProjectTreeTraverser } from '$lib/utils/project-tree-traverser';
import { SvelteDate } from 'svelte/reactivity';
import { TaskService as TaskDomainService } from '$lib/services/domain/task';
import { errorHandler } from './error-handler.svelte';

/**
 * TaskCoreStore
 * タスクのCRUD操作のみを担当する専門ストア
 * プロジェクトツリー構造内のタスクに対する基本的な操作を提供
 */
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
	async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
		const success = ProjectTreeTraverser.updateTask(this.projects, taskId, (task) => {
			Object.assign(task, updates);
			task.updatedAt = new SvelteDate();
		});

		if (!success) {
			console.error(`Task not found: ${taskId}`);
			return;
		}

		const projectId = ProjectTreeTraverser.getProjectIdByTaskId(this.projects, taskId);
		if (!projectId) {
			console.error(`Project not found for task: ${taskId}`);
			return;
		}

		// バックエンドに同期（自動保存は個別に実行せず、定期保存に任せる）
		try {
			await TaskDomainService.updateTaskWithSubTasks(
				projectId,
				taskId,
				updates as Partial<TaskWithSubTasks>
			);
		} catch (error) {
			console.error('Failed to sync task update to backends:', error);
			errorHandler.addSyncError('タスク更新', 'task', taskId, error);
		}
	}

	/**
	 * タスクのステータスを切り替え
	 */
	async toggleTaskStatus(taskId: string): Promise<void> {
		const task = this.getTaskById(taskId);
		if (!task) return;

		const newStatus = task.status === 'completed' ? 'not_started' : 'completed';
		await this.updateTask(taskId, { status: newStatus });
	}

	/**
	 * 新しいタスクを追加
	 */
	async addTask(listId: string, taskData: Partial<Task>): Promise<TaskWithSubTasks | null> {
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

		// まずローカル状態に追加
		taskList.tasks.push(newTask);

		// バックエンドに同期（作成操作は即座に保存）
		try {
			await TaskDomainService.createTaskWithSubTasks(listId, newTask);
		} catch (error) {
			console.error('Failed to sync new task to backends:', error);
			errorHandler.addSyncError('タスク作成', 'task', newTask.id, error);
			// エラーが発生した場合はローカル状態から削除
			const taskIndex = taskList.tasks.findIndex((t) => t.id === newTask.id);
			if (taskIndex !== -1) {
				taskList.tasks.splice(taskIndex, 1);
			}
			return null;
		}

		return newTask;
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
	async moveTaskToList(taskId: string, newTaskListId: string): Promise<void> {
		const targetTaskList = ProjectTreeTraverser.findTaskList(this.projects, newTaskListId);
		if (!targetTaskList) return;

		const targetProject = ProjectTreeTraverser.findProject(this.projects, targetTaskList.projectId);
		if (!targetProject) return;

		const sourceContext = ProjectTreeTraverser.findTaskContext(this.projects, taskId);
		if (!sourceContext) return;

		const { taskList: sourceTaskList } = sourceContext;
		const taskIndex = sourceTaskList.tasks.findIndex((t) => t.id === taskId);
		if (taskIndex === -1) return;

		const taskToMove = sourceTaskList.tasks[taskIndex];
		sourceTaskList.tasks.splice(taskIndex, 1);
		sourceTaskList.updatedAt = new SvelteDate();

		taskToMove.listId = newTaskListId;
		taskToMove.updatedAt = new SvelteDate();

		targetTaskList.tasks.push(taskToMove);
		targetTaskList.updatedAt = new SvelteDate();
		targetProject.updatedAt = new SvelteDate();

		try {
			await TaskDomainService.updateTask(targetProject.id, taskId, { listId: newTaskListId });
		} catch (error) {
			console.error('Failed to sync task move to backends:', error);
			errorHandler.addSyncError('タスク移動', 'task', taskId, error);
		}
	}

	/**
	 * タスクを削除
	 */
	async deleteTask(taskId: string): Promise<void> {
		const context = ProjectTreeTraverser.findTaskContext(this.projects, taskId);
		if (!context) {
			console.error(`Task not found: ${taskId}`);
			return;
		}

		const { project, taskList } = context;
		const taskIndex = taskList.tasks.findIndex((t) => t.id === taskId);
		if (taskIndex === -1) return;

		// バックアップとして削除するタスクを保持
		const deletedTask = taskList.tasks[taskIndex];

		// まずローカル状態から削除
		taskList.tasks.splice(taskIndex, 1);

		// バックエンドに同期（削除操作は即座に保存）
		try {
			await TaskDomainService.deleteTaskWithSubTasks(project.id, taskId);
		} catch (error) {
			console.error('Failed to sync task deletion to backends:', error);
			errorHandler.addSyncError('タスク削除', 'task', taskId, error);
			// エラーが発生した場合はローカル状態を復元
			taskList.tasks.splice(taskIndex, 0, deletedTask);
		}
	}

}

export const taskCoreStore = new TaskCoreStore();
