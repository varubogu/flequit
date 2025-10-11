import { getContext, setContext } from 'svelte';
import { TaskService } from '$lib/services/task-service';

export type TaskDetailUiStoreOptions = {
  /**
   * モバイル判定を提供するフックインスタンス。
   * IsMobileなど、`current`プロパティを持つオブジェクトを想定。
   */
  isMobile: { current: boolean };
};

const TASK_DETAIL_CONTEXT_KEY = Symbol.for('task-detail-ui-store');

export class TaskDetailUiStore {
  #isMobile: { current: boolean };

  drawerOpen = $state(false);
  drawerOnClose = $state<() => void>(() => {});
  drawerState = $derived.by(() => ({
    open: this.drawerOpen,
    onClose: this.drawerOnClose
  }));

  constructor({ isMobile }: TaskDetailUiStoreOptions) {
    this.#isMobile = isMobile;
  }

  get isMobile() {
    return this.#isMobile.current;
  }

  openTaskDetail(taskId: string) {
    TaskService.selectTask(taskId);
    if (this.isMobile) {
      this.openDrawer();
    }
  }

  openSubTaskDetail(subTaskId: string) {
    TaskService.selectSubTask(subTaskId);
    if (this.isMobile) {
      this.openDrawer();
    }
  }

  openNewTaskDetail() {
    if (this.isMobile) {
      this.openDrawer();
    }
  }

  closeTaskDetail() {
    if (!this.isMobile) {
      return;
    }
    if (this.drawerOpen) {
      this.drawerOnClose();
    }
    this.drawerOpen = false;
  }

  setCloseHandler(handler: () => void) {
    this.drawerOnClose = handler;
  }

  private openDrawer() {
    this.drawerOpen = true;
  }
}

export function createTaskDetailUiStore(options: TaskDetailUiStoreOptions) {
  return new TaskDetailUiStore(options);
}

export function initTaskDetailUiStore(options: TaskDetailUiStoreOptions) {
  const store = createTaskDetailUiStore(options);
  setContext(TASK_DETAIL_CONTEXT_KEY, store);
  return store;
}

export function useTaskDetailUiStore() {
  return getContext<TaskDetailUiStore | null>(TASK_DETAIL_CONTEXT_KEY) ?? null;
}
