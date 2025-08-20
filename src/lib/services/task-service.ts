import type { Task, TaskWithSubTasks, TaskStatus, TaskPatch } from '$lib/types/task';
import type { SubTask } from '$lib/types/sub-task';
import { taskStore } from '$lib/stores/tasks.svelte';
import { tagStore } from '$lib/stores/tags.svelte';
import { RecurrenceService } from './recurrence-service';
// TODO: Tauri APIのセットアップ後に有効化
// import { invoke } from '@tauri-apps/api/tauri';

export class TaskService {
  static toggleTaskStatus(taskId: string): void {
    taskStore.toggleTaskStatus(taskId);
  }

  static selectTask(taskId: string | null): boolean {
    // Check if we need confirmation for new task mode
    if (taskStore.isNewTaskMode && taskId !== null) {
      taskStore.pendingTaskSelection = taskId;
      return false; // Indicate that task selection needs confirmation
    }

    taskStore.selectTask(taskId);
    return true;
  }

  static selectSubTask(subTaskId: string | null): boolean {
    // Check if we need confirmation for new task mode
    if (taskStore.isNewTaskMode && subTaskId !== null) {
      taskStore.pendingSubTaskSelection = subTaskId;
      return false; // Indicate that subtask selection needs confirmation
    }

    taskStore.selectSubTask(subTaskId);
    return true;
  }

  static forceSelectTask(taskId: string | null): void {
    // Cancel new task mode and force task selection
    if (taskStore.isNewTaskMode) {
      taskStore.cancelNewTaskMode();
    }

    taskStore.selectTask(taskId);
  }

  static forceSelectSubTask(subTaskId: string | null): void {
    // Cancel new task mode and force subtask selection
    if (taskStore.isNewTaskMode) {
      taskStore.cancelNewTaskMode();
    }

    taskStore.selectSubTask(subTaskId);
  }

  static updateTask(taskId: string, updates: Partial<Task>): void {
    taskStore.updateTask(taskId, updates);
  }

  static updateTaskFromForm(
    taskId: string,
    formData: {
      title: string;
      description: string;
      start_date?: Date;
      end_date?: Date;
      is_range_date?: boolean;
      priority: number;
    }
  ): void {
    const updates: Partial<Task> = {
      title: formData.title,
      description: formData.description || undefined,
      priority: formData.priority,
      start_date: formData.start_date,
      end_date: formData.end_date,
      is_range_date: formData.is_range_date || false
    };

    this.updateTask(taskId, updates);
  }

  static changeTaskStatus(taskId: string, newStatus: TaskStatus): void {
    const currentTask = taskStore.getTaskById(taskId);

    // タスクが完了状態になった場合の繰り返し処理
    if (newStatus === 'completed' && currentTask?.recurrence_rule) {
      this.handleTaskCompletion(currentTask);
    }

    this.updateTask(taskId, { status: newStatus });
  }

  /**
   * タスク完了時の繰り返し処理
   */
  private static handleTaskCompletion(task: TaskWithSubTasks): void {
    if (!task.recurrence_rule) return;

    // 基準日を決定（終了日があればそれを使用、なければ今日）
    const baseDate = task.end_date || new Date();

    // 次回実行日を計算
    const nextDate = RecurrenceService.calculateNextDate(baseDate, task.recurrence_rule);
    if (!nextDate) return; // 繰り返し終了

    // 新しいタスクを作成
    const newTaskData: Partial<Task> = {
      list_id: task.list_id,
      title: task.title,
      description: task.description,
      status: 'not_started',
      priority: task.priority,
      start_date:
        task.is_range_date && task.start_date
          ? new Date(nextDate.getTime() - (task.end_date!.getTime() - task.start_date.getTime()))
          : undefined,
      end_date: nextDate,
      is_range_date: task.is_range_date,
      recurrence_rule: task.recurrence_rule,
      order_index: 0,
      is_archived: false
    };

    // 新しいタスクをストアに追加
    taskStore.createRecurringTask(newTaskData);
  }

  static deleteTask(taskId: string): boolean {
    taskStore.deleteTask(taskId);
    return true;
  }

  static toggleSubTaskStatus(task: TaskWithSubTasks, subTaskId: string): void {
    const subTask = task.sub_tasks.find((st) => st.id === subTaskId);
    if (!subTask) return;

    const newStatus: TaskStatus = subTask.status === 'completed' ? 'not_started' : 'completed';
    const updatedSubTasks = task.sub_tasks.map((st) =>
      st.id === subTaskId ? { ...st, status: newStatus } : st
    );

    // Note: This is a simplified update - in a real app you'd want proper subtask management
    this.updateTask(task.id, { sub_tasks: updatedSubTasks } as Partial<Task>);
  }

  static async addTask(
    listId: string,
    taskData: {
      title: string;
      description?: string;
      priority?: number;
    }
  ): Promise<TaskWithSubTasks | null> {
    return await taskStore.addTask(listId, {
      list_id: listId,
      title: taskData.title,
      description: taskData.description,
      status: 'not_started',
      priority: taskData.priority || 0,
      order_index: 0,
      is_archived: false
    });
  }

  static async addSubTask(
    taskId: string,
    subTaskData: {
      title: string;
      description?: string;
      priority?: number;
    }
  ): Promise<SubTask | null> {
    return await taskStore.addSubTask(taskId, {
      title: subTaskData.title,
      description: subTaskData.description,
      status: 'not_started',
      priority: subTaskData.priority || 0
    });
  }

  static updateSubTaskFromForm(
    subTaskId: string,
    formData: {
      title: string;
      description: string;
      start_date?: Date;
      end_date?: Date;
      is_range_date?: boolean;
      priority: number;
    }
  ): void {
    const updates: Partial<SubTask> = {
      title: formData.title,
      description: formData.description || undefined,
      priority: formData.priority || undefined,
      start_date: formData.start_date,
      end_date: formData.end_date,
      is_range_date: formData.is_range_date || false
    };

    this.updateSubTask(subTaskId, updates);
  }

  static updateSubTask(subTaskId: string, updates: Partial<SubTask>): void {
    taskStore.updateSubTask(subTaskId, updates);
  }

  static changeSubTaskStatus(subTaskId: string, newStatus: TaskStatus): void {
    this.updateSubTask(subTaskId, { status: newStatus });
  }

  static deleteSubTask(subTaskId: string): boolean {
    taskStore.deleteSubTask(subTaskId);
    return true;
  }

  static addTagToTask(taskId: string, tagId: string): void {
    // IDからタグを取得してタグ名を渡す
    const tag = tagStore.tags.find((t) => t.id === tagId);
    if (tag) {
      taskStore.addTagToTask(taskId, tag.name);
    }
  }

  static updateTaskDueDateForView(taskId: string, viewId: string): void {
    const today = new Date();
    let newDueDate: Date | undefined;

    switch (viewId) {
      case 'today':
        newDueDate = new Date(today);
        break;
      case 'tomorrow':
        newDueDate = new Date(today);
        newDueDate.setDate(today.getDate() + 1);
        break;
      case 'next3days':
        newDueDate = new Date(today);
        newDueDate.setDate(today.getDate() + 3);
        break;
      case 'nextweek':
        newDueDate = new Date(today);
        newDueDate.setDate(today.getDate() + 7);
        break;
      case 'thismonth':
        newDueDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      default:
        // Other views don't change the due date
        return;
    }

    if (newDueDate) {
      this.updateTask(taskId, { end_date: newDueDate });
    }
  }

  static updateSubTaskDueDateForView(subTaskId: string, taskId: string, viewId: string): void {
    const today = new Date();
    let newDueDate: Date | undefined;

    switch (viewId) {
      case 'today':
        newDueDate = new Date(today);
        break;
      case 'tomorrow':
        newDueDate = new Date(today);
        newDueDate.setDate(today.getDate() + 1);
        break;
      case 'next3days':
        newDueDate = new Date(today);
        newDueDate.setDate(today.getDate() + 3);
        break;
      case 'nextweek':
        newDueDate = new Date(today);
        newDueDate.setDate(today.getDate() + 7);
        break;
      case 'thismonth':
        newDueDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      default:
        // Other views don't change the due date
        return;
    }

    if (newDueDate) {
      this.updateSubTask(subTaskId, { end_date: newDueDate });
    }
  }

  static addTagToSubTask(subTaskId: string, taskId: string, tagId: string): void {
    // IDからタグを取得してタグ名を渡す
    const tag = tagStore.tags.find((t) => t.id === tagId);
    if (tag) {
      taskStore.addTagToSubTask(subTaskId, tag.name);
    }
  }

  // TODO: Tauri APIのセットアップ後に有効化
  /*
  /**
   * 汎用パッチ更新 - Tauriバックエンドを使用
   */
  /*
  static async updateTaskPatch(id: string, patch: TaskPatch): Promise<boolean> {
    return await invoke<boolean>('update_task_patch', { id, patch });
  }

  /**
   * タスクタイトルの更新 - Tauriバックエンドを使用
   */
  /*
  static async updateTaskTitle(id: string, title: string): Promise<boolean> {
    const patch: TaskPatch = { title };
    return await this.updateTaskPatch(id, patch);
  }

  /**
   * タスクステータスの更新 - Tauriバックエンドを使用
   */
  /*
  static async updateTaskStatusTauri(id: string, status: TaskStatus): Promise<boolean> {
    const patch: TaskPatch = { status };
    return await this.updateTaskPatch(id, patch);
  }

  /**
   * タスクの説明の更新 - Tauriバックエンドを使用
   */
  /*
  static async updateTaskDescription(id: string, description: string | null): Promise<boolean> {
    const patch: TaskPatch = { description };
    return await this.updateTaskPatch(id, patch);
  }

  /**
   * タスクの優先度の更新 - Tauriバックエンドを使用
   */
  /*
  static async updateTaskPriority(id: string, priority: number): Promise<boolean> {
    const patch: TaskPatch = { priority };
    return await this.updateTaskPatch(id, patch);
  }

  /**
   * タスクの期日の更新 - Tauriバックエンドを使用
   */
  /*
  static async updateTaskDueDate(id: string, end_date: Date | null): Promise<boolean> {
    const patch: TaskPatch = { 
      end_date: end_date ? end_date.toISOString() : null 
    };
    return await this.updateTaskPatch(id, patch);
  }
  */
}
