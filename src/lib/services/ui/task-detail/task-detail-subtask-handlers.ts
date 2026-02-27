import type { TaskDetailDomainActions } from '$lib/stores/task-detail/task-detail-types';
import type { TaskDetailViewStore } from '$lib/stores/task-detail-view-store.svelte';
import { subTaskStore } from '$lib/stores/sub-task-store.svelte';
import { taskListUIState } from '$lib/stores/task-list/task-list-ui-state.svelte';

/**
 * サブタスクのステータストグルハンドラ
 */
export function handleSubTaskToggleImpl(
  store: TaskDetailViewStore,
  domain: TaskDetailDomainActions,
  subTaskId: string
): void {
  const task = store.task;
  if (!task) return;
  domain.toggleSubTaskStatus(task, subTaskId);
}

/**
 * サブタスククリックハンドラ（親タスクを展開してサブタスクを選択）
 */
export function handleSubTaskClickImpl(
  domain: TaskDetailDomainActions,
  subTaskId: string
): void {
  // Get parent task ID to expand it in task list
  const parentTaskId = subTaskStore.getTaskIdBySubTaskId(subTaskId);
  if (parentTaskId) {
    // Expand parent task in task list so subtask is visible
    taskListUIState.expandTask(parentTaskId);
  }

  // Select subtask
  domain.selectSubTask(subTaskId);
}

/**
 * サブタスク追加フォームのトグルハンドラ
 */
export function handleAddSubTaskImpl(store: TaskDetailViewStore): void {
  store.dialogs.toggleSubTaskAddForm();
}

/**
 * サブタスク追加確定ハンドラ
 */
export async function handleSubTaskAddedImpl(
  store: TaskDetailViewStore,
  domain: TaskDetailDomainActions,
  title: string
): Promise<void> {
  const task = store.task;
  if (!task || !title.trim()) return;

  const newSubTask = await domain.addSubTask(task.id, { title: title.trim() });

  if (newSubTask) {
    store.dialogs.closeSubTaskAddForm();
  }
}

/**
 * サブタスク追加キャンセルハンドラ
 */
export function handleSubTaskAddCancelImpl(store: TaskDetailViewStore): void {
  store.dialogs.closeSubTaskAddForm();
}
