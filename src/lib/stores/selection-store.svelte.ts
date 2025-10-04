import type { ISelectionStore } from '$lib/types/store-interfaces';

/**
 * 選択状態管理ストア
 *
 * プロジェクト、タスクリスト、タスク、サブタスクの選択状態を管理します。
 * TaskStoreから分離して、責務を明確化しています。
 */
export class SelectionStore implements ISelectionStore {
	// 選択状態
	selectedProjectId = $state<string | null>(null);
	selectedListId = $state<string | null>(null);
	selectedTaskId = $state<string | null>(null);
	selectedSubTaskId = $state<string | null>(null);

	// 保留中の選択（非同期処理用）
	pendingTaskSelection = $state<string | null>(null);
	pendingSubTaskSelection = $state<string | null>(null);

	/**
	 * プロジェクトを選択
	 */
	selectProject(projectId: string | null): void {
		this.selectedProjectId = projectId;
	}

	/**
	 * タスクリストを選択
	 */
	selectList(listId: string | null): void {
		this.selectedListId = listId;
	}

	/**
	 * タスクを選択
	 */
	selectTask(taskId: string | null): void {
		this.selectedTaskId = taskId;
	}

	/**
	 * サブタスクを選択
	 */
	selectSubTask(subTaskId: string | null): void {
		this.selectedSubTaskId = subTaskId;
	}

	/**
	 * 保留中の選択をクリア
	 */
	clearPendingSelections(): void {
		this.pendingTaskSelection = null;
		this.pendingSubTaskSelection = null;
	}

	/**
	 * 全ての選択状態をリセット（主にテスト用）
	 */
	reset(): void {
		this.selectedProjectId = null;
		this.selectedListId = null;
		this.selectedTaskId = null;
		this.selectedSubTaskId = null;
		this.pendingTaskSelection = null;
		this.pendingSubTaskSelection = null;
	}
}

/**
 * SelectionStoreのシングルトンインスタンス
 */
export const selectionStore = new SelectionStore();
