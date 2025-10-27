import type { ISubTaskStore, IProjectStore, ISelectionStore } from '$lib/types/store-interfaces';
import type { SubTask } from '$lib/types/sub-task';
import type { Tag } from '$lib/types/tag';
import { resolveProjectStore } from '$lib/stores/providers/project-store-provider';
import { selectionStore } from './selection-store.svelte';
import { SubTaskQueries } from './sub-task/subtask-queries.svelte';
import { SubTaskMutations } from './sub-task/subtask-mutations.svelte';
import { SubTaskTagOperations } from './sub-task/subtask-tag-operations.svelte';

/**
 * SubTaskStore - サブタスク管理のFacadeストア
 *
 * 責務: サブタスク関連操作の統合管理
 * 依存: ProjectStore（データ参照）, SelectionStore（選択状態）
 */
export class SubTaskStore implements ISubTaskStore {
	private queries: SubTaskQueries;
	private mutations: SubTaskMutations;
	private tagOps: SubTaskTagOperations;

	constructor(
		private projectStoreRef: IProjectStore,
		private selection: ISelectionStore
	) {
		this.queries = new SubTaskQueries(projectStoreRef, selection);
		this.mutations = new SubTaskMutations(projectStoreRef, selection);
		this.tagOps = new SubTaskTagOperations(projectStoreRef);
	}

	// Queries
	get selectedSubTask(): SubTask | null {
		return this.queries.selectedSubTask;
	}
	getTaskIdBySubTaskId(subTaskId: string): string | null {
		return this.queries.getTaskIdBySubTaskId(subTaskId);
	}
	getProjectIdBySubTaskId(subTaskId: string): string | null {
		return this.queries.getProjectIdBySubTaskId(subTaskId);
	}

	// Mutations
	async addSubTask(
		taskId: string,
		subTask: { title: string; description?: string; status?: string; priority?: number }
	) {
		return this.mutations.addSubTask(taskId, subTask);
	}
	async updateSubTask(subTaskId: string, updates: Partial<SubTask>) {
		return this.mutations.updateSubTask(subTaskId, updates);
	}
	async deleteSubTask(subTaskId: string) {
		return this.mutations.deleteSubTask(subTaskId);
	}

	// Tag Operations
	attachTagToSubTask(subTaskId: string, tag: Tag) {
		this.tagOps.attachTagToSubTask(subTaskId, tag);
	}
	detachTagFromSubTask(subTaskId: string, tagId: string): Tag | null {
		return this.tagOps.detachTagFromSubTask(subTaskId, tagId);
	}

	// Backward compatibility (deprecated)
	async addTagToSubTask(_subTaskId: string, _tagName: string) {
		void _subTaskId;
		void _tagName;
		console.warn('addTagToSubTask is deprecated. Use TaskService.addTagToSubTaskByName instead.');
	}
	async removeTagFromSubTask(_subTaskId: string, _tagId: string) {
		void _subTaskId;
		void _tagId;
		console.warn(
			'removeTagFromSubTask is deprecated. Use TaskService.removeTagFromSubTask instead.'
		);
	}

	// テスト用
	reset() {
		// SubTaskはProjectTreeに含まれているため、ProjectStoreのresetで対応済み
		// 追加の状態がないため、このメソッドは空実装
	}
}

// シングルトンエクスポート（真の遅延初期化で循環参照を回避）
let _subTaskStore: SubTaskStore | undefined;
function getSubTaskStore(): SubTaskStore {
	if (!_subTaskStore) {
		_subTaskStore = new SubTaskStore(resolveProjectStore(), selectionStore);
	}
	return _subTaskStore;
}

// Proxyを使用してアクセス時に初期化
export const subTaskStore = new Proxy({} as SubTaskStore, {
	get(_target, prop) {
		const store = getSubTaskStore();
		const value = store[prop as keyof SubTaskStore];
		return typeof value === 'function' ? value.bind(store) : value;
	}
});
