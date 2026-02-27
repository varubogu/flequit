/**
 * 選択状態管理インターフェース
 *
 * 責務: プロジェクト、タスクリスト、タスク、サブタスクの選択IDを管理
 * 依存: なし（完全独立）
 */
export interface ISelectionStore {
  // 選択状態
  selectedProjectId: string | null;
  selectedListId: string | null;
  selectedTaskId: string | null;
  selectedSubTaskId: string | null;

  // 保留中の選択
  pendingTaskSelection: string | null;
  pendingSubTaskSelection: string | null;

  // メソッド
  selectProject(projectId: string | null): void;
  selectList(listId: string | null): void;
  selectTask(taskId: string | null): void;
  selectSubTask(subTaskId: string | null): void;
  clearPendingSelections(): void;
  reset(): void;
}
