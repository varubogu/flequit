import type { Task, TaskWithSubTasks, TaskStatus } from '$lib/types/task';
import type { SubTask } from '$lib/types/sub-task';
import { taskStore } from '$lib/stores/tasks.svelte';
import { subTaskStore } from '$lib/stores/sub-task-store.svelte';
import { taskCoreStore } from '$lib/stores/task-core-store.svelte';
import { TaggingService } from '$lib/services/domain/tagging';
import { tagStore } from '$lib/stores/tags.svelte';
import { errorHandler } from '$lib/stores/error-handler.svelte';

type TaskStoreLike = Pick<typeof taskStore, 'getTaskProjectAndList'>;

type TaskCoreStoreLike = Pick<typeof taskCoreStore, 'updateTask'>;

type SubTaskStoreLike = Pick<
	typeof subTaskStore,
	'addSubTask' | 'updateSubTask' | 'deleteSubTask' | 'attachTagToSubTask' | 'detachTagFromSubTask'
>;

type TagStoreLike = Pick<typeof tagStore, 'tags'>;

type TaggingServiceLike = Pick<typeof TaggingService, 'createSubtaskTag' | 'deleteSubtaskTag'>;

type ErrorHandlerLike = Pick<typeof errorHandler, 'addSyncError'>;

type SubTaskMutationDependencies = {
	taskStore: TaskStoreLike;
	taskCoreStore: TaskCoreStoreLike;
	subTaskStore: SubTaskStoreLike;
	tagStore: TagStoreLike;
	taggingService: TaggingServiceLike;
	errorHandler: ErrorHandlerLike;
};

function getDefaultDependencies(): SubTaskMutationDependencies {
	return {
		taskStore,
		taskCoreStore,
		subTaskStore,
		tagStore,
		taggingService: TaggingService,
		errorHandler
	};
}

/**
 * サブタスク変更操作サービス
 *
 * 責務:
 * 1. サブタスクのステータス変更
 * 2. サブタスクの更新（フォームからの更新を含む）
 * 3. サブタスクの削除
 * 4. サブタスクの作成
 * 5. サブタスクへのタグ操作
 * 6. ビュー用の期日更新
 */
export class SubTaskMutations {
	#deps: SubTaskMutationDependencies;

	constructor(deps?: SubTaskMutationDependencies) {
		this.#deps = deps ?? getDefaultDependencies();
	}

	toggleSubTaskStatus(task: TaskWithSubTasks, subTaskId: string): void {
		const { taskCoreStore } = this.#deps;
		const subTask = task.subTasks.find((st) => st.id === subTaskId);
		if (!subTask) return;

		const newStatus: TaskStatus = subTask.status === 'completed' ? 'not_started' : 'completed';
		const updatedSubTasks = task.subTasks.map((st) =>
			st.id === subTaskId ? { ...st, status: newStatus } : st
		);

		void taskCoreStore.updateTask(task.id, { sub_tasks: updatedSubTasks } as Partial<Task>);
	}

	async addSubTask(
		taskId: string,
		subTaskData: {
			title: string;
			description?: string;
			priority?: number;
		}
	) {
		const { subTaskStore } = this.#deps;
		return subTaskStore.addSubTask(taskId, {
			title: subTaskData.title,
			description: subTaskData.description,
			status: 'not_started',
			priority: subTaskData.priority || 0
		});
	}

	updateSubTaskFromForm(
		subTaskId: string,
		formData: {
			title: string;
			description: string;
			planStartDate?: Date;
			planEndDate?: Date;
			isRangeDate?: boolean;
			priority: number;
		}
	): void {
		const updates: Partial<SubTask> = {
			title: formData.title,
			description: formData.description || undefined,
			priority: formData.priority || undefined,
			planStartDate: formData.planStartDate,
			planEndDate: formData.planEndDate,
			isRangeDate: formData.isRangeDate || false
		};

		void this.#deps.subTaskStore.updateSubTask(subTaskId, updates);
	}

	updateSubTask(subTaskId: string, updates: Partial<SubTask>): void {
		void this.#deps.subTaskStore.updateSubTask(subTaskId, updates);
	}

	changeSubTaskStatus(subTaskId: string, newStatus: TaskStatus): void {
		void this.#deps.subTaskStore.updateSubTask(subTaskId, { status: newStatus });
	}

	async deleteSubTask(subTaskId: string): Promise<void> {
		await this.#deps.subTaskStore.deleteSubTask(subTaskId);
	}

	async addTagToSubTaskByName(subTaskId: string, taskId: string, tagName: string): Promise<void> {
		const { taskStore, taggingService, subTaskStore, errorHandler } = this.#deps;
		const trimmed = tagName.trim();
		if (!trimmed) {
			console.warn('Empty tag name provided');
			return;
		}

		const context = taskStore.getTaskProjectAndList(taskId);
		if (!context) {
			console.error('Failed to find task for subtask tag:', subTaskId);
			return;
		}

		try {
			const tag = await taggingService.createSubtaskTag(context.project.id, subTaskId, trimmed);
			subTaskStore.attachTagToSubTask(subTaskId, tag);
		} catch (error) {
			console.error('Failed to sync subtask tag addition to backends:', error);
			errorHandler.addSyncError('サブタスクタグ追加', 'subtask', subTaskId, error);
		}
	}

	async addTagToSubTask(subTaskId: string, taskId: string, tagId: string): Promise<void> {
		const { tagStore, taskStore, taggingService, subTaskStore, errorHandler } = this.#deps;
		const tag = tagStore.tags.find((t) => t.id === tagId);
		if (!tag) return;

		const context = taskStore.getTaskProjectAndList(taskId);
		if (!context) {
			console.error('Failed to find task for subtask tag:', subTaskId);
			return;
		}

		try {
			const created = await taggingService.createSubtaskTag(
				context.project.id,
				subTaskId,
				tag.name
			);
			subTaskStore.attachTagToSubTask(subTaskId, created);
		} catch (error) {
			console.error('Failed to sync subtask tag addition to backends:', error);
			errorHandler.addSyncError('サブタスクタグ追加', 'subtask', subTaskId, error);
		}
	}

	async removeTagFromSubTask(subTaskId: string, taskId: string, tagId: string): Promise<void> {
		const { taskStore, taggingService, subTaskStore, errorHandler } = this.#deps;
		const context = taskStore.getTaskProjectAndList(taskId);
		if (!context) return;

		const removed = subTaskStore.detachTagFromSubTask(subTaskId, tagId);
		if (!removed) return;

		try {
			await taggingService.deleteSubtaskTag(context.project.id, subTaskId, tagId);
		} catch (error) {
			console.error('Failed to sync subtask tag removal to backends:', error);
			subTaskStore.attachTagToSubTask(subTaskId, removed);
			errorHandler.addSyncError('サブタスクタグ削除', 'subtask', subTaskId, error);
		}
	}

	updateSubTaskDueDateForView(subTaskId: string, _taskId: string, viewId: string): void {
		const { subTaskStore } = this.#deps;
		const today = new Date();
		let newDueDate: Date | undefined;

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
			void subTaskStore.updateSubTask(subTaskId, { planEndDate: newDueDate });
		}
	}
}
