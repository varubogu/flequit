/**
 * TaskOperations - タスク操作の統合サービス
 *
 * 責務:
 * - タスクの CRUD 操作（作成、読み取り、更新、削除）
 * - ステータス変更（完了/未完了のトグル）
 * - タグ管理（追加/削除）
 * - リスト間移動
 * - 楽観的更新とエラーハンドリング
 *
 * アーキテクチャ:
 * UIコンポーネント
 *     ↓
 * TaskOperations (このファイル)
 *     ├─→ taskCoreStore (ローカル状態管理)
 *     ├─→ TaskBackend (バックエンド通信)
 *     └─→ errorHandler (エラー処理)
 */

import type { Task, TaskStatus, TaskWithSubTasks } from '$lib/types/task';
import { SvelteDate } from 'svelte/reactivity';
import type { TaskStore } from '$lib/stores/tasks.svelte';
import type { TaskCoreStore } from '$lib/stores/task-core-store.svelte';
import type { TaskListStore } from '$lib/stores/task-list-store.svelte';
import type { TagStore } from '$lib/stores/tags.svelte';
import type { ErrorHandler } from '$lib/stores/error-handler.svelte';
import { getCurrentUserId } from '$lib/utils/user-id-helper';
import { TaskBackend } from './task-backend';
import { TaggingService } from '$lib/services/domain/tagging';
import { TaskRecurrenceService } from '../task-recurrence';

// ===== 型定義 =====

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

type TagStoreLike = Pick<TagStore, 'tags' | 'addTagWithId'>;

type ErrorHandlerLike = Pick<ErrorHandler, 'addSyncError'>;

export type TaskOperationsDependencies = {
	taskStore: TaskStoreLike;
	taskCoreStore: TaskCoreStoreLike;
	taskListStore: TaskListStoreLike;
	tagStore: TagStoreLike;
	errorHandler: ErrorHandlerLike;
	recurrenceService?: TaskRecurrenceService;
};

// ===== ヘルパー関数 =====

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

// ===== TaskOperations クラス =====

/**
 * タスク操作を統合したサービスクラス
 *
 * すべてのタスク操作はこのクラスを通じて行われます。
 * ローカル状態の楽観的更新とバックエンドへの永続化を自動的に処理します。
 */
export class TaskOperations {
	#deps: TaskOperationsDependencies;
	#recurrenceService: TaskRecurrenceService;

	constructor(deps: TaskOperationsDependencies) {
		this.#deps = deps;
		this.#recurrenceService = deps.recurrenceService ?? new TaskRecurrenceService();
	}

	// ===== CRUD操作 =====

	/**
	 * タスクを作成する
	 *
	 * フロー:
	 * 1. ローカル状態に楽観的に追加
	 * 2. バックエンドに永続化
	 * 3. 失敗時はローカル状態をロールバック
	 */
	async addTask(
		listId: string,
		taskData: Partial<TaskWithSubTasks>
	): Promise<TaskWithSubTasks | null> {
		const { taskListStore, taskCoreStore, errorHandler } = this.#deps;
		const projectId = taskListStore.getProjectIdByListId(listId);
		if (!projectId) {
			console.error('Failed to find project for list:', listId);
			return null;
		}

		// デフォルトの期日を今日の23:59:59に設定
		const getDefaultDueDate = (): SvelteDate => {
			const today = new SvelteDate();
			today.setHours(23, 59, 59, 999);
			return today;
		};

		const newTask: TaskWithSubTasks = {
			id: crypto.randomUUID(),
			projectId,
			listId,
			title: taskData.title?.trim() ?? '',
			description: taskData.description,
			status: taskData.status ?? 'not_started',
			priority: taskData.priority ?? 2,
			planStartDate: taskData.planStartDate,
			planEndDate: taskData.planEndDate ?? getDefaultDueDate(),
			isRangeDate: taskData.isRangeDate ?? false,
			recurrenceRule: taskData.recurrenceRule,
			orderIndex: taskData.orderIndex ?? 0,
			isArchived: taskData.isArchived ?? false,
			assignedUserIds: taskData.assignedUserIds ?? [],
			tagIds: taskData.tagIds ?? [],
			createdAt: new SvelteDate(),
			updatedAt: new SvelteDate(),
			deleted: false,
			updatedBy: getCurrentUserId(),
			subTasks: taskData.subTasks ? [...taskData.subTasks] : [],
			tags: taskData.tags ? [...taskData.tags] : []
		};

		// 楽観的更新: ローカル状態に追加
		const inserted = taskCoreStore.insertTask(listId, newTask);
		if (!inserted) return null;

		try {
			// バックエンドに永続化
			await TaskBackend.createTaskWithSubTasks(listId, inserted);
			return inserted;
		} catch (error) {
			console.error('Failed to sync new task to backends:', error);
			// ロールバック: ローカル状態から削除
			taskCoreStore.removeTask(inserted.id);
			errorHandler.addSyncError('タスク作成', 'task', inserted.id, error);
			return null;
		}
	}

	/**
	 * タスクを更新する
	 *
	 * フロー:
	 * 1. 現在の状態をスナップショット
	 * 2. ローカル状態に楽観的に適用
	 * 3. バックエンドに永続化
	 * 4. 失敗時はスナップショットから復元
	 */
	async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
		const { taskStore, taskCoreStore, errorHandler } = this.#deps;
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

		// スナップショット作成
		const snapshot = cloneTask(currentTask);

		// 楽観的更新: ローカル状態に適用
		const applied = taskCoreStore.applyTaskUpdate(taskId, (task) => {
			Object.assign(task, updates);
		});
		if (!applied) {
			console.error('Failed to apply task update:', taskId);
			return;
		}

		try {
			// バックエンドに永続化
			await TaskBackend.updateTaskWithSubTasks(
				context.project.id,
				taskId,
				updates as Partial<TaskWithSubTasks>
			);
		} catch (error) {
			console.error('Failed to sync task update to backends:', error);
			// ロールバック: スナップショットから復元
			taskCoreStore.applyTaskUpdate(taskId, (task) => {
				Object.assign(task, snapshot);
				task.updatedAt = toSvelteDate(snapshot.updatedAt);
			});
			errorHandler.addSyncError('タスク更新', 'task', taskId, error);
		}
	}

	/**
	 * フォームデータからタスクを更新する
	 */
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

	/**
	 * タスクを削除する
	 *
	 * フロー:
	 * 1. 選択状態をクリア
	 * 2. ローカル状態から削除
	 * 3. バックエンドに永続化
	 * 4. 失敗時はローカル状態を復元
	 */
	async deleteTask(taskId: string): Promise<void> {
		const { taskStore, taskCoreStore, errorHandler } = this.#deps;
		if (taskStore.selectedTaskId === taskId) {
			taskStore.selectedTaskId = null;
		}

		// 楽観的更新: ローカル状態から削除
		const removal = taskCoreStore.removeTask(taskId);
		if (!removal) return;

		try {
			// バックエンドに永続化
			await TaskBackend.deleteTaskWithSubTasks(removal.project.id, taskId);
		} catch (error) {
			console.error('Failed to sync task deletion to backends:', error);
			// ロールバック: ローカル状態を復元
			taskCoreStore.restoreTask(removal);
			errorHandler.addSyncError('タスク削除', 'task', taskId, error);
		}
	}

	/**
	 * ビューに応じてタスクの期日を更新する
	 */
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

	// ===== ステータス変更操作 =====

	/**
	 * タスクのステータスをトグルする（完了 ⇔ 未開始）
	 */
	async toggleTaskStatus(taskId: string): Promise<void> {
		const task = this.#deps.taskStore.getTaskById(taskId);
		if (!task) {
			console.error('Failed to find task:', taskId);
			return;
		}

		const newStatus = task.status === 'completed' ? 'not_started' : 'completed';
		await this.changeTaskStatus(taskId, newStatus);
	}

	/**
	 * タスクのステータスを変更する
	 * 完了時に繰り返しルールがある場合は次の発生をスケジュールする
	 */
	async changeTaskStatus(taskId: string, newStatus: TaskStatus): Promise<void> {
		const { taskStore } = this.#deps;
		const currentTask = taskStore.getTaskById(taskId);

		if (newStatus === 'completed' && currentTask?.recurrenceRule) {
			this.#recurrenceService.scheduleNextOccurrence(currentTask);
		}

		await this.updateTask(taskId, { status: newStatus });
	}

	// ===== タグ管理操作 =====

	/**
	 * タスクにタグを名前で追加する（タグが存在しない場合は作成）
	 */
	async addTagToTaskByName(taskId: string, tagName: string): Promise<void> {
		const { taskStore, tagStore, errorHandler } = this.#deps;
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
			const tag = await TaggingService.createTaskTag(context.project.id, taskId, trimmed);
			tagStore.addTagWithId(tag);
			taskStore.attachTagToTask(taskId, tag);
		} catch (error) {
			console.error('Failed to sync tag addition to backends:', error);
			errorHandler.addSyncError('タスクタグ追加', 'task', taskId, error);
		}
	}

	/**
	 * タスクに既存のタグを追加する
	 */
	async addTagToTask(taskId: string, tagId: string): Promise<void> {
		const { tagStore, taskStore, errorHandler } = this.#deps;
		const tag = tagStore.tags.find((t) => t.id === tagId);
		if (!tag) return;

		const context = taskStore.getTaskProjectAndList(taskId);
		if (!context) {
			console.error('Failed to find task:', taskId);
			return;
		}

		try {
			const created = await TaggingService.createTaskTag(context.project.id, taskId, tag.name);
			taskStore.attachTagToTask(taskId, created);
		} catch (error) {
			console.error('Failed to sync tag addition to backends:', error);
			errorHandler.addSyncError('タスクタグ追加', 'task', taskId, error);
		}
	}

	/**
	 * タスクからタグを削除する
	 */
	async removeTagFromTask(taskId: string, tagId: string): Promise<void> {
		const { taskStore, errorHandler } = this.#deps;
		const context = taskStore.getTaskProjectAndList(taskId);
		if (!context) return;

		const removed = taskStore.detachTagFromTask(taskId, tagId);
		if (!removed) return;

		try {
			await TaggingService.deleteTaskTag(context.project.id, taskId, tagId);
		} catch (error) {
			console.error('Failed to sync tag removal to backends:', error);
			taskStore.attachTagToTask(taskId, removed);
			errorHandler.addSyncError('タスクタグ削除', 'task', taskId, error);
		}
	}

	// ===== 移動操作 =====

	/**
	 * タスクを別のリストに移動する
	 */
	async moveTaskToList(taskId: string, newTaskListId: string): Promise<void> {
		const { taskCoreStore, errorHandler } = this.#deps;
		const moveContext = taskCoreStore.moveTaskBetweenLists(taskId, newTaskListId);
		if (!moveContext) return;

		try {
			await TaskBackend.updateTask(moveContext.targetProject.id, taskId, {
				listId: newTaskListId
			});
		} catch (error) {
			console.error('Failed to sync task move to backends:', error);
			taskCoreStore.restoreTaskMove(moveContext);
			errorHandler.addSyncError('タスク移動', 'task', taskId, error);
		}
	}
}
