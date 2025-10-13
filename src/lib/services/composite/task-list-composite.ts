import type { TaskList } from '$lib/types/task-list';
import { TaskListService } from '$lib/services/domain/task-list';
import { taskListStore } from '$lib/stores/task-list-store.svelte';

/**
 * タスクリストコンポジットサービス（CRUD + Store更新）
 *
 * 責務:
 * 1. バックエンド操作（TaskListServiceを使用）
 * 2. Store更新（taskListStoreを使用）
 * 3. エラーハンドリング
 *
 * 使用例:
 * - コンポーネントから直接呼び出す
 * - バックエンドとStoreの両方を更新したい場合
 */
export const TaskListCompositeService = {
	/**
	 * タスクリスト作成（バックエンド + Store更新）
	 */
	async createTaskList(
		projectId: string,
		taskListData: {
			name: string;
			description?: string;
			color?: string;
			order_index?: number;
		}
	): Promise<TaskList | null> {
		try {
			const newTaskList = await TaskListService.createTaskList(projectId, taskListData);
			// ローカルストアも更新
			await taskListStore.addTaskList(projectId, taskListData);
			return newTaskList;
		} catch (error) {
			console.error('Failed to create task list:', error);
			return null;
		}
	},

	/**
	 * タスクリスト更新（バックエンド + Store更新）
	 */
	async updateTaskList(
		taskListId: string,
		updates: {
			name?: string;
			description?: string;
			color?: string;
			order_index?: number;
			is_archived?: boolean;
			project_id?: string;
		}
	): Promise<TaskList | null> {
		try {
			// taskListIdからprojectIdを取得
			const projectId = taskListStore.getProjectIdByListId(taskListId);
			if (!projectId) {
				throw new Error(`タスクリストID ${taskListId} に対応するプロジェクトが見つかりません。`);
			}

			const updatedTaskList = await TaskListService.updateTaskList(projectId, taskListId, updates);
			if (!updatedTaskList) return null;

			// ローカルストアも更新
			await taskListStore.updateTaskList(taskListId, updates);
			return updatedTaskList;
		} catch (error) {
			console.error('Failed to update task list:', error);
			return null;
		}
	},

	/**
	 * タスクリスト削除（バックエンド + Store更新）
	 */
	async deleteTaskList(taskListId: string): Promise<boolean> {
		try {
			// taskListIdからprojectIdを取得
			const projectId = taskListStore.getProjectIdByListId(taskListId);
			if (!projectId) {
				throw new Error(`タスクリストID ${taskListId} に対応するプロジェクトが見つかりません。`);
			}

			const success = await TaskListService.deleteTaskList(projectId, taskListId);
			if (success) {
				// ローカルストアからも削除
				await taskListStore.deleteTaskList(taskListId);
			}
			return success;
		} catch (error) {
			console.error('Failed to delete task list:', error);
			return false;
		}
	},

	/**
	 * タスクリスト並べ替え（Store操作）
	 */
	async reorderTaskLists(
		projectId: string,
		fromIndex: number,
		toIndex: number
	): Promise<void> {
		await taskListStore.reorderTaskLists(projectId, fromIndex, toIndex);
	},

	/**
	 * タスクリストをプロジェクト間移動（Store操作）
	 */
	async moveTaskListToProject(
		taskListId: string,
		targetProjectId: string,
		targetIndex?: number
	): Promise<void> {
		await taskListStore.moveTaskListToProject(taskListId, targetProjectId, targetIndex);
	},

	/**
	 * タスクリスト位置移動（Store操作）
	 */
	async moveTaskListToPosition(
		taskListId: string,
		targetProjectId: string,
		targetIndex: number
	): Promise<void> {
		await taskListStore.moveTaskListToPosition(taskListId, targetProjectId, targetIndex);
	},

	/**
	 * タスクリストのアーカイブ状態変更（バックエンド + Store更新）
	 */
	async archiveTaskList(taskListId: string, isArchived: boolean): Promise<boolean> {
		const result = await this.updateTaskList(taskListId, { is_archived: isArchived });
		return result !== null;
	}
};
