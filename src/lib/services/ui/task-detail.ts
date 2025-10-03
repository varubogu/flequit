import { TaskService } from '../domain/task';

interface TaskDetailDrawerState {
  open: boolean;
  onClose: () => void;
}

export class TaskDetailService {
  private static isMobileInstance: { current: boolean } | null = null;

  private static taskDetailDrawerState: TaskDetailDrawerState = {
    open: false,
    onClose: () => {}
  };

  private static subscribers: Array<() => void> = [];

  static get drawerState() {
    return this.taskDetailDrawerState;
  }

  static subscribe(callback: () => void) {
    this.subscribers.push(callback);
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  private static notifySubscribers() {
    this.subscribers.forEach((callback) => callback());
  }

  static setMobileInstance(isMobile: { current: boolean }) {
    this.isMobileInstance = isMobile;
  }

  static openTaskDetail(taskId: string) {
    // 1. ストアに選択状態を保存
    TaskService.selectTask(taskId);

    // 2. デスクトップかモバイルかで表示方法を決定
    if (this.isMobileInstance?.current) {
      this.openDrawer();
    }
    // デスクトップの場合は何もしない（右パネルに自動表示される）
  }

  static openSubTaskDetail(subTaskId: string) {
    // 1. ストアに選択状態を保存
    TaskService.selectSubTask(subTaskId);

    // 2. デスクトップかモバイルかで表示方法を決定
    if (this.isMobileInstance?.current) {
      this.openDrawer();
    }
    // デスクトップの場合は何もしない（右パネルに自動表示される）
  }

  static openNewTaskDetail() {
    // 新規タスクモードは既にストアで管理されているので、表示のみ制御
    if (this.isMobileInstance?.current) {
      this.openDrawer();
    }
  }

  private static openDrawer() {
    this.taskDetailDrawerState.open = true;
    this.notifySubscribers();
  }

  static closeTaskDetail() {
    if (this.isMobileInstance?.current) {
      this.taskDetailDrawerState.open = false;
      this.notifySubscribers();
    }
  }

  static setCloseHandler(handler: () => void) {
    this.taskDetailDrawerState.onClose = handler;
  }
}
