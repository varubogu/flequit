import type { TaskStore } from '$lib/stores/tasks.svelte';
import type { TagStore } from '$lib/stores/tags.svelte';
import { TaggingService } from '$lib/services/domain/tagging';
import type { ErrorHandler } from '$lib/stores/error-handler.svelte';

type TaskStoreLike = Pick<
	TaskStore,
	'getTaskProjectAndList' | 'attachTagToTask' | 'detachTagFromTask'
>;

type TagStoreLike = Pick<TagStore, 'tags' | 'addTagWithId'>;

type TaggingServiceLike = Pick<typeof TaggingService, 'createTaskTag' | 'deleteTaskTag'>;

type ErrorHandlerLike = Pick<ErrorHandler, 'addSyncError'>;

export type TaskTagMutationDependencies = {
	taskStore: TaskStoreLike;
	tagStore: TagStoreLike;
	taggingService: TaggingServiceLike;
	errorHandler: ErrorHandlerLike;
};

/**
 * タスクのタグ管理に関する操作を提供するクラス
 */
export class TaskTagMutations {
	#deps: TaskTagMutationDependencies;

	constructor(deps: TaskTagMutationDependencies) {
		this.#deps = deps;
	}

	/**
	 * タスクにタグを名前で追加する（タグが存在しない場合は作成）
	 */
	async addTagToTaskByName(taskId: string, tagName: string): Promise<void> {
		const { taskStore, taggingService, errorHandler, tagStore } = this.#deps;
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
			const tag = await taggingService.createTaskTag(context.project.id, taskId, trimmed);
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
		const { tagStore, taggingService, taskStore, errorHandler } = this.#deps;
		const tag = tagStore.tags.find((t) => t.id === tagId);
		if (!tag) return;

		const context = taskStore.getTaskProjectAndList(taskId);
		if (!context) {
			console.error('Failed to find task:', taskId);
			return;
		}

		try {
			const created = await taggingService.createTaskTag(context.project.id, taskId, tag.name);
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
		const { taskStore, taggingService, errorHandler } = this.#deps;
		const context = taskStore.getTaskProjectAndList(taskId);
		if (!context) return;

		const removed = taskStore.detachTagFromTask(taskId, tagId);
		if (!removed) return;

		try {
			await taggingService.deleteTaskTag(context.project.id, taskId, tagId);
		} catch (error) {
			console.error('Failed to sync tag removal to backends:', error);
			taskStore.attachTagToTask(taskId, removed);
			errorHandler.addSyncError('タスクタグ削除', 'task', taskId, error);
		}
	}
}
