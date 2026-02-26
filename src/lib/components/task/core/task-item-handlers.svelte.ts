import { taskOperations } from '$lib/services/domain/task';
import type { TaskWithSubTasks } from '$lib/types/task';
import type { SubTask } from '$lib/types/sub-task';
import { taskStore } from '$lib/stores/tasks.svelte';
import { subTaskOperations } from '$lib/services/domain/subtask';
import { selectionStore } from '$lib/stores/selection-store.svelte';
import type { useTaskDetailUiStore } from '$lib/services/ui/task-detail-ui-store.svelte';

type TaskItemEventMap = {
  taskSelectionRequested: { taskId: string };
  subTaskSelectionRequested: { subTaskId: string };
};

type TaskItemEventDispatcher = <T extends keyof TaskItemEventMap>(
  type: T,
  detail: TaskItemEventMap[T]
) => void;

/**
 * TaskItemHandlers - タスクアイテムのイベントハンドラークラス
 *
 * 責務: タスクとサブタスクに対するユーザー操作の処理
 */
export class TaskItemHandlers {
  private subTaskMutations = subTaskOperations;

  constructor(
    private task: TaskWithSubTasks,
    private taskDetailUiStore: ReturnType<typeof useTaskDetailUiStore> | undefined,
    private dispatchEvent: TaskItemEventDispatcher,
    private callbacks?: {
      onTaskClick?: (taskId: string) => void;
      onSubTaskClick?: (subTaskId: string) => void;
    }
  ) {}

  // Task handlers
  handleEditTask = () => {
    // タスク詳細画面を開いて編集モードにする
    this.taskDetailUiStore?.openTaskDetail(this.task.id);
  };

  handleDeleteTask = () => {
    void taskOperations.deleteTask(this.task.id);
  };

  handleTaskClick = () => {
    // モバイル時のカスタムハンドラーがある場合は優先
    if (this.callbacks?.onTaskClick) {
      this.callbacks.onTaskClick(this.task.id);
      return;
    }

    // Try to select task, but if blocked due to new task mode, dispatch event for confirmation
    if (taskStore.isNewTaskMode) {
      this.dispatchEvent('taskSelectionRequested', { taskId: this.task.id });
    } else {
      selectionStore.selectTask(this.task.id);
    }
  };

  handleStatusToggle = () => {
    void taskOperations.toggleTaskStatus(this.task.id);
  };

  // SubTask handlers
  handleEditSubTask = (subTask: SubTask) => {
    // サブタスク詳細画面を開いて編集モードにする
    this.taskDetailUiStore?.openSubTaskDetail(subTask.id);
  };

  handleDeleteSubTask = (subTask: SubTask) => {
    // サブタスクを削除
    void this.subTaskMutations.deleteSubTask(subTask.id);
  };

  handleSubTaskToggle = (event: Event | undefined, subTaskId: string) => {
    event?.stopPropagation();
    this.subTaskMutations.toggleSubTaskStatus(this.task, subTaskId);
  };

  handleSubTaskClick = (event: Event | undefined, subTaskId: string) => {
    event?.stopPropagation();

    if (this.callbacks?.onSubTaskClick) {
      this.callbacks.onSubTaskClick(subTaskId);
    } else {
      // フォールバック: 統一的なアプローチを使わない場合
      if (taskStore.isNewTaskMode) {
        this.dispatchEvent('subTaskSelectionRequested', { subTaskId });
      } else {
        selectionStore.selectSubTask(subTaskId);
      }
    }
  };
}
