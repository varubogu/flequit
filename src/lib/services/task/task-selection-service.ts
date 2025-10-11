import { selectionStore } from '$lib/stores/selection-store.svelte';
import { taskStore } from '$lib/stores/tasks.svelte';

type TaskStoreLike = {
    isNewTaskMode: boolean;
    pendingTaskSelection: string | null;
    pendingSubTaskSelection: string | null;
    cancelNewTaskMode(): void;
};

type SelectionStoreLike = {
    selectTask(taskId: string | null): void;
    selectSubTask(subTaskId: string | null): void;
};

type TaskSelectionDependencies = {
  taskStore: TaskStoreLike;
  selectionStore: SelectionStoreLike;
};

function getDefaultDependencies(): TaskSelectionDependencies {
  return {
    taskStore,
    selectionStore
  };
}

export class TaskSelectionService {
  #deps: TaskSelectionDependencies;

  constructor(deps?: TaskSelectionDependencies) {
    this.#deps = deps ?? getDefaultDependencies();
  }

  selectTask(taskId: string | null): boolean {
    const { taskStore, selectionStore } = this.#deps;
    if (taskStore.isNewTaskMode && taskId !== null) {
      taskStore.pendingTaskSelection = taskId;
      return false;
    }

    selectionStore.selectTask(taskId);
    return true;
  }

  selectSubTask(subTaskId: string | null): boolean {
    const { taskStore, selectionStore } = this.#deps;
    if (taskStore.isNewTaskMode && subTaskId !== null) {
      taskStore.pendingSubTaskSelection = subTaskId;
      return false;
    }

    selectionStore.selectSubTask(subTaskId);
    return true;
  }

  forceSelectTask(taskId: string | null): void {
    const { taskStore, selectionStore } = this.#deps;
    if (taskStore.isNewTaskMode) {
      taskStore.cancelNewTaskMode();
    }
    selectionStore.selectTask(taskId);
  }

  forceSelectSubTask(subTaskId: string | null): void {
    const { taskStore, selectionStore } = this.#deps;
    if (taskStore.isNewTaskMode) {
      taskStore.cancelNewTaskMode();
    }
    selectionStore.selectSubTask(subTaskId);
  }
}
