import type { SubTask } from '$lib/types/sub-task';
import { resolveBackend } from '$lib/infrastructure/backend-client';
import { errorHandler } from '$lib/stores/error-handler.svelte';
import { getCurrentUserId } from '$lib/services/domain/current-user-id';

/**
 * SubTaskBackend - サブタスクのバックエンド通信を担当
 *
 * 責務:
 * - バックエンド（Tauri/Web）へのサブタスクの永続化
 * - CRUD操作のバックエンド呼び出し
 * - バックエンドエラーのハンドリング
 *
 * 注意: このサービスはローカル状態（store）を操作しません。
 * ローカル状態の操作は SubTaskOperations が担当します。
 */
export const SubTaskBackend = {
	/**
	 * 新しいサブタスクを作成します
	 */
	async createSubTask(
		projectId: string,
		taskId: string,
		subTaskData: {
			title: string;
			description?: string;
			status?: string;
			priority?: number;
		}
	): Promise<SubTask> {
		const newSubTask: SubTask = {
			id: crypto.randomUUID(),
			taskId: taskId,
			title: subTaskData.title,
			description: subTaskData.description,
			status:
				(subTaskData.status as
					| 'not_started'
					| 'in_progress'
					| 'waiting'
					| 'completed'
					| 'cancelled') || 'not_started',
			priority: subTaskData.priority,
			orderIndex: 0,
			completed: false,
			assignedUserIds: [],
			tagIds: [],
			createdAt: new Date(),
			updatedAt: new Date(),
			deleted: false,
			updatedBy: getCurrentUserId()
		};

		try {
			const backend = await resolveBackend();
			await backend.subtask.create(projectId, newSubTask, getCurrentUserId());
			return newSubTask;
		} catch (error) {
			console.error('Failed to create subtask:', error);
			errorHandler.addSyncError('サブタスク作成', 'subtask', newSubTask.id, error);
			throw error;
		}
	},

	/**
	 * サブタスクを更新します
	 */
	async updateSubTask(
		projectId: string,
		subTaskId: string,
		updates: Partial<SubTask>
	): Promise<SubTask | null> {
		const patchData = {
			...updates,
			plan_start_date: updates.planStartDate?.toISOString() ?? undefined,
			plan_end_date: updates.planEndDate?.toISOString() ?? undefined,
			do_start_date: updates.doStartDate?.toISOString() ?? undefined,
			do_end_date: updates.doEndDate?.toISOString() ?? undefined,
			updated_at: new Date()
		} as Record<string, unknown>;

		try {
			const backend = await resolveBackend();
			const success = await backend.subtask.update(
				projectId,
				subTaskId,
				patchData,
				getCurrentUserId()
			);
			if (!success) {
				return null;
			}
			return await backend.subtask.get(projectId, subTaskId, getCurrentUserId());
		} catch (error) {
			console.error('Failed to update subtask:', error);
			errorHandler.addSyncError('サブタスク更新', 'subtask', subTaskId, error);
			throw error;
		}
	},

	/**
	 * サブタスクを削除します
	 */
	async deleteSubTask(projectId: string, subTaskId: string): Promise<boolean> {
		try {
			const backend = await resolveBackend();
			return await backend.subtask.delete(projectId, subTaskId, getCurrentUserId());
		} catch (error) {
			console.error('Failed to delete subtask:', error);
			errorHandler.addSyncError('サブタスク削除', 'subtask', subTaskId, error);
			throw error;
		}
	}
};
