import { SvelteSet } from 'svelte/reactivity';

/**
 * TaskListUIState - タスク一覧のUI状態管理
 *
 * 責務: タスクアコーディオンの展開状態を管理
 * 依存: なし（独立した状態管理）
 */
export class TaskListUIState {
  // 展開されているタスクのIDセット
  private expandedTaskIds = $state<SvelteSet<string>>(new SvelteSet());

  /**
   * タスクのサブタスクが展開されているかチェック
   * @param taskId - チェックするタスクID
   * @returns 展開されている場合true
   */
  isTaskExpanded(taskId: string): boolean {
    return this.expandedTaskIds.has(taskId);
  }

  /**
   * タスクの展開状態をトグル
   * @param taskId - トグルするタスクID
   */
  toggleTaskExpansion(taskId: string): void {
    if (this.expandedTaskIds.has(taskId)) {
      this.expandedTaskIds.delete(taskId);
    } else {
      this.expandedTaskIds.add(taskId);
    }
    // SvelteSetは自動的にリアクティブなので、再代入不要
  }

  /**
   * タスクのサブタスクを展開
   * @param taskId - 展開するタスクID
   */
  expandTask(taskId: string): void {
    if (!this.expandedTaskIds.has(taskId)) {
      this.expandedTaskIds.add(taskId);
    }
  }

  /**
   * タスクのサブタスクを折りたたみ
   * @param taskId - 折りたたむタスクID
   */
  collapseTask(taskId: string): void {
    if (this.expandedTaskIds.has(taskId)) {
      this.expandedTaskIds.delete(taskId);
    }
  }

  /**
   * すべてのタスクを展開
   */
  expandAll(taskIds: string[]): void {
    this.expandedTaskIds.clear();
    for (const id of taskIds) {
      this.expandedTaskIds.add(id);
    }
  }

  /**
   * すべてのタスクを折りたたみ
   */
  collapseAll(): void {
    this.expandedTaskIds.clear();
  }

  /**
   * すべての展開状態をリセット（主にテスト用）
   */
  reset(): void {
    this.expandedTaskIds.clear();
  }
}

/**
 * TaskListUIStateのシングルトンインスタンス
 */
export const taskListUIState = new TaskListUIState();
