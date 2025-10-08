import { selectionStore } from '$lib/stores/selection-store.svelte';
import { taskStore } from '$lib/stores/tasks.svelte';

export class TaskSelectionService {
  selectTask(taskId: string | null): boolean {
    if (taskStore.isNewTaskMode && taskId !== null) {
      taskStore.pendingTaskSelection = taskId;
      return false;
    }

    selectionStore.selectTask(taskId);
    return true;
  }

  selectSubTask(subTaskId: string | null): boolean {
    if (taskStore.isNewTaskMode && subTaskId !== null) {
      taskStore.pendingSubTaskSelection = subTaskId;
      return false;
    }

    selectionStore.selectSubTask(subTaskId);
    return true;
  }

  forceSelectTask(taskId: string | null): void {
    if (taskStore.isNewTaskMode) {
      taskStore.cancelNewTaskMode();
    }
    selectionStore.selectTask(taskId);
  }

  forceSelectSubTask(subTaskId: string | null): void {
    if (taskStore.isNewTaskMode) {
      taskStore.cancelNewTaskMode();
    }
    selectionStore.selectSubTask(subTaskId);
  }
}
