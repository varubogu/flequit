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
   * リスト選択は相互排他的にクリアされます
   */
  selectProject(projectId: string | null): void {
    this.selectedProjectId = projectId;
    // プロジェクトとリストは相互排他的
    this.selectedListId = null;
  }

  /**
   * タスクリストを選択
   * プロジェクト選択は相互排他的にクリアされます
   */
  selectList(listId: string | null): void {
    this.selectedListId = listId;
    // プロジェクトとリストは相互排他的
    this.selectedProjectId = null;
  }

  /**
   * タスクを選択
   * サブタスク選択は相互排他的にクリアされます
   */
  selectTask(taskId: string | null): void {
    this.selectedTaskId = taskId;
    // タスクとサブタスクは相互排他的
    this.selectedSubTaskId = null;
  }

  /**
   * サブタスクを選択
   * タスク選択は相互排他的にクリアされます
   */
  selectSubTask(subTaskId: string | null): void {
    this.selectedSubTaskId = subTaskId;
    // タスクとサブタスクは相互排他的
    this.selectedTaskId = null;
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
