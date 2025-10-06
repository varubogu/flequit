import type { Task, TaskWithSubTasks, TaskStatus } from '$lib/types/task';
import type { SubTask } from '$lib/types/sub-task';
import { taskStore } from '$lib/stores/tasks.svelte';
import { tagStore } from '$lib/stores/tags.svelte';
import { selectionStore } from '$lib/stores/selection-store.svelte';
import { subTaskStore } from '$lib/stores/sub-task-store.svelte';
import { taskListStore } from '$lib/stores/task-list-store.svelte';
import { taskCoreStore } from '$lib/stores/task-core-store.svelte';
import { RecurrenceService } from './composite/recurrence-composite';
// TODO: Tauri APIのセットアップ後に有効化
// import { invoke } from '@tauri-apps/api/tauri';

export class TaskService {
  static toggleTaskStatus(taskId: string): void {
    taskCoreStore.toggleTaskStatus(taskId);
  }

  static selectTask(taskId: string | null): boolean {
    // Check if we need confirmation for new task mode
    if (taskStore.isNewTaskMode && taskId !== null) {
      taskStore.pendingTaskSelection = taskId;
      return false; // Indicate that task selection needs confirmation
    }

    selectionStore.selectTask(taskId);
    // Note: selectTask() automatically clears subtask selection via mutual exclusivity
    return true;
  }

  static selectSubTask(subTaskId: string | null): boolean {
    // Check if we need confirmation for new task mode
    if (taskStore.isNewTaskMode && subTaskId !== null) {
      taskStore.pendingSubTaskSelection = subTaskId;
      return false; // Indicate that subtask selection needs confirmation
    }

    selectionStore.selectSubTask(subTaskId);
    // Note: selectSubTask() automatically clears task selection via mutual exclusivity
    return true;
  }

  static forceSelectTask(taskId: string | null): void {
    // Cancel new task mode and force task selection
    if (taskStore.isNewTaskMode) {
      taskStore.cancelNewTaskMode();
    }

    selectionStore.selectTask(taskId);
    // Note: selectTask() automatically clears subtask selection via mutual exclusivity
  }

  static forceSelectSubTask(subTaskId: string | null): void {
    // Cancel new task mode and force subtask selection
    if (taskStore.isNewTaskMode) {
      taskStore.cancelNewTaskMode();
    }

    selectionStore.selectSubTask(subTaskId);
    // Note: selectSubTask() automatically clears task selection via mutual exclusivity
  }

  static updateTask(taskId: string, updates: Partial<Task>): void {
    taskCoreStore.updateTask(taskId, updates);
  }

  static updateTaskFromForm(
    taskId: string,
    formData: {
      title: string;
      description: string;
      planStartDate?: Date;
      planEndDate?: Date;
      isRangeDate?: boolean;
      priority: number;
    }
  ): void {
    const updates: Partial<Task> = {
      title: formData.title,
      description: formData.description || undefined,
      priority: formData.priority,
      planStartDate: formData.planStartDate,
      planEndDate: formData.planEndDate,
      isRangeDate: formData.isRangeDate || false
    };

    this.updateTask(taskId, updates);
  }

  static changeTaskStatus(taskId: string, newStatus: TaskStatus): void {
    const currentTask = taskStore.getTaskById(taskId);

    // タスクが完了状態になった場合の繰り返し処理
    if (newStatus === 'completed' && currentTask?.recurrenceRule) {
      this.handleTaskCompletion(currentTask);
    }

    this.updateTask(taskId, { status: newStatus });
  }

  /**
   * タスク完了時の繰り返し処理
   */
  private static handleTaskCompletion(task: TaskWithSubTasks): void {
    if (!task.recurrenceRule) return;

    // 基準日を決定（終了日があればそれを使用、なければ今日）
    const baseDate = task.planEndDate || new Date();

    // 次回実行日を計算
    const nextDate = RecurrenceService.calculateNextDate(baseDate, task.recurrenceRule);
    if (!nextDate) return; // 繰り返し終了

    // 新しいタスクを作成
    const newTaskData: Partial<Task> = {
      listId: task.listId,
      title: task.title,
      description: task.description,
      status: 'not_started',
      priority: task.priority,
      planStartDate:
        task.isRangeDate && task.planStartDate
          ? new Date(nextDate.getTime() - (task.planEndDate!.getTime() - task.planStartDate.getTime()))
          : undefined,
      planEndDate: nextDate,
      isRangeDate: task.isRangeDate,
      recurrenceRule: task.recurrenceRule,
      orderIndex: 0,
      isArchived: false
    };

    // 新しいタスクをストアに追加
    taskCoreStore.createRecurringTask(newTaskData);
  }

  static deleteTask(taskId: string): boolean {
    if (taskStore.selectedTaskId === taskId) {
      selectionStore.selectTask(null);
    }

    taskCoreStore.deleteTask(taskId);
    return true;
  }

  static toggleSubTaskStatus(task: TaskWithSubTasks, subTaskId: string): void {
    const subTask = task.subTasks.find((st) => st.id === subTaskId);
    if (!subTask) return;

    const newStatus: TaskStatus = subTask.status === 'completed' ? 'not_started' : 'completed';
    const updatedSubTasks = task.subTasks.map((st) =>
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
    // listIdからproject_idを取得
    const projectId = taskListStore.getProjectIdByListId(listId);
    if (!projectId) {
      console.error('Failed to find project for list:', listId);
      return null;
    }

    return await taskCoreStore.addTask(listId, {
      projectId: projectId,
      listId: listId,
      title: taskData.title,
      description: taskData.description,
      status: 'not_started',
      priority: taskData.priority || 0,
      assignedUserIds: [],
      tagIds: [],
      orderIndex: 0,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date()
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
    return await subTaskStore.addSubTask(taskId, {
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
      planStartDate?: Date;
      planEndDate?: Date;
      isRangeDate?: boolean;
      priority: number;
    }
  ): void {
    const updates: Partial<SubTask> = {
      title: formData.title,
      description: formData.description || undefined,
      priority: formData.priority || undefined,
      planStartDate: formData.planStartDate,
      planEndDate: formData.planEndDate,
      isRangeDate: formData.isRangeDate || false
    };

    this.updateSubTask(subTaskId, updates);
  }

  static updateSubTask(subTaskId: string, updates: Partial<SubTask>): void {
    subTaskStore.updateSubTask(subTaskId, updates);
  }

  static changeSubTaskStatus(subTaskId: string, newStatus: TaskStatus): void {
    this.updateSubTask(subTaskId, { status: newStatus });
  }

  static deleteSubTask(subTaskId: string): boolean {
    subTaskStore.deleteSubTask(subTaskId);
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
      this.updateTask(taskId, { planEndDate: newDueDate });
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
      this.updateSubTask(subTaskId, { planEndDate: newDueDate });
    }
  }

  static addTagToSubTask(subTaskId: string, taskId: string, tagId: string): void {
    // IDからタグを取得してタグ名を渡す
    const tag = tagStore.tags.find((t) => t.id === tagId);
    if (tag) {
      subTaskStore.addTagToSubTask(subTaskId, tag.name);
    }
  }

  // TODO: Tauri APIのセットアップ後に有効化
  /*
  /**
   * 汎用パッチ更新 - Tauriバックエンドを使用
   */
  /*
  static async updatePartial<Task>(id: string, patch: Partial<Task>): Promise<boolean> {
    return await invoke<boolean>('update_task_patch', { id, patch });
  }

  /**
   * タスクタイトルの更新 - Tauriバックエンドを使用
   */
  /*
  static async updateTaskTitle(id: string, title: string): Promise<boolean> {
    const patch: Partial<Task> = { title };
    return await this.updatePartial<Task>(id, patch);
  }

  /**
   * タスクステータスの更新 - Tauriバックエンドを使用
   */
  /*
  static async updateTaskStatusTauri(id: string, status: TaskStatus): Promise<boolean> {
    const patch: Partial<Task> = { status };
    return await this.updatePartial<Task>(id, patch);
  }

  /**
   * タスクの説明の更新 - Tauriバックエンドを使用
   */
  /*
  static async updateTaskDescription(id: string, description: string | null): Promise<boolean> {
    const patch: Partial<Task> = { description };
    return await this.updatePartial<Task>(id, patch);
  }

  /**
   * タスクの優先度の更新 - Tauriバックエンドを使用
   */
  /*
  static async updateTaskPriority(id: string, priority: number): Promise<boolean> {
    const patch: Partial<Task> = { priority };
    return await this.updatePartial<Task>(id, patch);
  }

  /**
   * タスクの期日の更新 - Tauriバックエンドを使用
   */
  /*
  static async updateTaskDueDate(id: string, end_date: Date | null): Promise<boolean> {
    const patch: Partial<Task> = {
      end_date: end_date ? end_date.toISOString() : null
    };
    return await this.updatePartial<Task>(id, patch);
  }
  */
}
