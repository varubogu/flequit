import type { Project } from '$lib/types/project';
import type { TaskList } from '$lib/types/task-list';
import { taskStore } from '../tasks.svelte';

export type TaskProjectContext = { project: Project; taskList: TaskList } | null;

/**
 * TaskDetailViewState
 *
 * タスク詳細画面で使用する派生状態を管理します。
 * - 選択中タスク/サブタスク
 * - 新規作成モード判定
 * - 現在の表示対象アイテム
 * - プロジェクト/タスクリストのコンテキスト
 */
export class TaskDetailViewState {
  #lastSyncedItemId = $state<string | undefined>(undefined);

  task = $derived(taskStore.selectedTask);
  subTask = $derived(taskStore.selectedSubTask);
  isSubTask = $derived(!!this.subTask);
  isNewTaskMode = $derived(taskStore.isNewTaskMode);
  currentItem = $derived(
    this.task || this.subTask || (this.isNewTaskMode ? taskStore.newTaskData : null)
  );
  selectedSubTaskId = $derived(taskStore.selectedSubTaskId);
  projectInfo = $derived.by<TaskProjectContext>(() => {
    const item = this.currentItem;
    if (!item || this.isNewTaskMode) {
      return null;
    }

    if (this.isSubTask && 'taskId' in item) {
      return taskStore.getTaskProjectAndList(item.taskId);
    }
    return taskStore.getTaskProjectAndList(item.id);
  });

  clearPendingSelections() {
    taskStore.clearPendingSelections();
  }

  setLastSyncedTaskId(itemId: string | undefined) {
    this.#lastSyncedItemId = itemId;
  }

  get lastSyncedTaskId() {
    return this.#lastSyncedItemId;
  }
}
