import type { TaskDetailRecurrenceActions } from '$lib/stores/task-detail/task-detail-types';
import type { TaskDetailViewStore } from '$lib/stores/task-detail-view-store.svelte';
import { isSubTask } from './task-detail-guards';
import { taskCoreStore } from '$lib/stores/task-core-store.svelte';
import { subTaskStore } from '$lib/stores/sub-task-store.svelte';

/**
 * 繰り返しダイアログの開閉制御
 */
export function handleRecurrenceDialogCloseImpl(
  store: TaskDetailViewStore,
  open?: boolean
): void {
  if (typeof open === 'boolean') {
    if (open) {
      store.dialogs.openRecurrenceDialog();
    } else {
      store.dialogs.closeRecurrenceDialog();
    }
    return;
  }

  store.dialogs.closeRecurrenceDialog();
}

/**
 * 繰り返しダイアログを開く
 */
export function handleRecurrenceDialogOpenImpl(store: TaskDetailViewStore): void {
  store.dialogs.openRecurrenceDialog();
}

/**
 * 繰り返しルールの保存処理
 */
export async function handleRecurrenceChangeImpl(
  store: TaskDetailViewStore,
  recurrence: TaskDetailRecurrenceActions,
  rule: Parameters<TaskDetailRecurrenceActions['save']>[0]['rule']
): Promise<void> {
  const current = store.currentItem;
  if (!current || store.isNewTaskMode) {
    return;
  }

  const projectInfo = store.projectInfo;
  const projectId = projectInfo?.project.id;

  if (!projectId) {
    console.error('Failed to get projectId for recurrence rule');
    return;
  }

  const userId = current.updatedBy;
  if (!userId) {
    console.error('Failed to get userId for recurrence rule');
    return;
  }

  try {
    await recurrence.save({
      projectId,
      itemId: current.id,
      isSubTask: isSubTask(current),
      rule,
      userId
    });

    // Successfully saved, update local store with new recurrence rule
    if (isSubTask(current)) {
      await subTaskStore.updateSubTask(current.id, { recurrenceRule: rule ?? undefined });
    } else {
      taskCoreStore.updateTask(current.id, { recurrenceRule: rule ?? undefined });
    }

    // Close dialog
    store.dialogs.closeRecurrenceDialog();
  } catch (error) {
    console.error('Failed to save recurrence rule:', error);
    // Keep dialog open so user can retry or review the error
    console.error('Recurrence dialog remains open for user to retry');
  }
}
