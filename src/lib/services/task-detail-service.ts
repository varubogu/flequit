import { TaskService } from './task-service';
import { IsMobile } from '$lib/hooks/is-mobile.svelte';

export interface TaskDetailDisplayOptions {
  mode?: 'view' | 'edit';
  isNewTask?: boolean;
}

interface TaskDetailDrawerState {
  open: boolean;
  onClose: () => void;
}

export class TaskDetailService {
  private static isMobile = new IsMobile();
  
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
    this.subscribers.forEach(callback => callback());
  }

  static openTaskDetail(taskId: string | null, options: TaskDetailDisplayOptions = {}) {
    const { mode = 'view', isNewTask = false } = options;

    if (isNewTask) {
      return this.openNewTaskDetail();
    }

    if (!taskId) {
      return;
    }

    if (this.isMobile.current) {
      this.openTaskDetailMobile(taskId);
    } else {
      this.openTaskDetailDesktop(taskId);
    }
  }

  static openNewTaskDetail() {
    if (this.isMobile.current) {
      this.openNewTaskDetailMobile();
    } else {
      this.openNewTaskDetailDesktop();
    }
  }

  private static openTaskDetailMobile(taskId: string) {
    TaskService.selectTask(taskId);
    this.taskDetailDrawerState.open = true;
    this.notifySubscribers();
  }

  private static openTaskDetailDesktop(taskId: string) {
    TaskService.selectTask(taskId);
  }

  private static openNewTaskDetailMobile() {
    this.taskDetailDrawerState.open = true;
    this.notifySubscribers();
  }

  private static openNewTaskDetailDesktop() {
  }

  static closeTaskDetail() {
    if (this.isMobile.current) {
      this.taskDetailDrawerState.open = false;
      this.notifySubscribers();
    }
  }

  static setCloseHandler(handler: () => void) {
    this.taskDetailDrawerState.onClose = handler;
  }
}