import type { Task, TaskWithSubTasks } from '$lib/types/task';
import { SvelteDate } from 'svelte/reactivity';
import { getCurrentUserId } from '$lib/services/domain/current-user-id';
import { TaskBackend } from '../task-backend';
import type { TaskOperationsDependencies } from './types';
import { cloneTask, toSvelteDate } from './types';

/**
 * タスクCRUD操作
 */
export class TaskCrudOperations {
  #deps: TaskOperationsDependencies;

  constructor(deps: TaskOperationsDependencies) {
    this.#deps = deps;
  }

  /**
   * タスクを作成する
   *
   * フロー:
   * 1. ローカル状態に楽観的に追加
   * 2. バックエンドに永続化
   * 3. 失敗時はローカル状態をロールバック
   */
  async addTask(
    listId: string,
    taskData: Partial<TaskWithSubTasks>
  ): Promise<TaskWithSubTasks | null> {
    const { taskListStore, taskCoreStore, errorHandler } = this.#deps;
    const projectId = taskListStore.getProjectIdByListId(listId);
    if (!projectId) {
      return null;
    }

    // デフォルトの期日を今日の23:59:59に設定
    const getDefaultDueDate = (): SvelteDate => {
      const today = new SvelteDate();
      today.setHours(23, 59, 59, 999);
      return today;
    };

    const newTask: TaskWithSubTasks = {
      id: crypto.randomUUID(),
      projectId,
      listId,
      title: taskData.title?.trim() ?? '',
      description: taskData.description,
      status: taskData.status ?? 'not_started',
      priority: taskData.priority ?? 2,
      planStartDate: taskData.planStartDate,
      planEndDate: taskData.planEndDate ?? getDefaultDueDate(),
      isRangeDate: taskData.isRangeDate ?? false,
      recurrenceRule: taskData.recurrenceRule,
      orderIndex: taskData.orderIndex ?? 0,
      isArchived: taskData.isArchived ?? false,
      assignedUserIds: taskData.assignedUserIds ?? [],
      tagIds: taskData.tagIds ?? [],
      createdAt: new SvelteDate(),
      updatedAt: new SvelteDate(),
      deleted: false,
      updatedBy: getCurrentUserId(),
      subTasks: taskData.subTasks ? [...taskData.subTasks] : [],
      tags: taskData.tags ? [...taskData.tags] : []
    };

    // 楽観的更新: ローカル状態に追加
    const inserted = taskCoreStore.insertTask(listId, newTask);
    if (!inserted) return null;

    try {
      // バックエンドに永続化
      await TaskBackend.createTaskWithSubTasks(listId, inserted);
      return inserted;
    } catch (error) {
      // ロールバック: ローカル状態から削除
      taskCoreStore.removeTask(inserted.id);
      errorHandler.addSyncError('タスク作成', 'task', inserted.id, error);
      return null;
    }
  }

  /**
   * タスクを更新する
   *
   * フロー:
   * 1. 現在の状態をスナップショット
   * 2. ローカル状態に楽観的に適用
   * 3. バックエンドに永続化
   * 4. 失敗時はスナップショットから復元
   */
  async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
    const { taskStore, taskCoreStore, errorHandler } = this.#deps;
    const context = taskStore.getTaskProjectAndList(taskId);
    if (!context) {
      return;
    }

    const currentTask = taskStore.getTaskById(taskId);
    if (!currentTask) {
      return;
    }

    // スナップショット作成
    const snapshot = cloneTask(currentTask);

    // 楽観的更新: ローカル状態に適用
    const applied = taskCoreStore.applyTaskUpdate(taskId, (task) => {
      Object.assign(task, updates);
    });
    if (!applied) {
      return;
    }

    try {
      // バックエンドに永続化
      await TaskBackend.updateTaskWithSubTasks(
        context.project.id,
        taskId,
        updates as Partial<TaskWithSubTasks>
      );
    } catch (error) {
      // ロールバック: スナップショットから復元
      taskCoreStore.applyTaskUpdate(taskId, (task) => {
        Object.assign(task, snapshot);
        task.updatedAt = toSvelteDate(snapshot.updatedAt);
      });
      errorHandler.addSyncError('タスク更新', 'task', taskId, error);
    }
  }

  /**
   * フォームデータからタスクを更新する
   */
  async updateTaskFromForm(
    taskId: string,
    formData: {
      title: string;
      description: string;
      planStartDate?: Date;
      planEndDate?: Date;
      isRangeDate?: boolean;
      priority: number;
    }
  ): Promise<void> {
    const updates: Partial<Task> = {
      title: formData.title,
      description: formData.description || undefined,
      priority: formData.priority,
      planStartDate: formData.planStartDate,
      planEndDate: formData.planEndDate,
      isRangeDate: formData.isRangeDate || false
    };

    await this.updateTask(taskId, updates);
  }

  /**
   * タスクを削除する
   *
   * フロー:
   * 1. 選択状態をクリア
   * 2. ローカル状態から削除
   * 3. バックエンドに永続化
   * 4. 失敗時はローカル状態を復元
   */
  async deleteTask(taskId: string): Promise<void> {
    const { taskStore, taskCoreStore, errorHandler } = this.#deps;
    if (taskStore.selectedTaskId === taskId) {
      taskStore.selectedTaskId = null;
    }

    // 楽観的更新: ローカル状態から削除
    const removal = taskCoreStore.removeTask(taskId);
    if (!removal) return;

    try {
      // バックエンドに永続化
      await TaskBackend.deleteTaskWithSubTasks(removal.project.id, taskId);
    } catch (error) {
      // ロールバック: ローカル状態を復元
      taskCoreStore.restoreTask(removal);
      errorHandler.addSyncError('タスク削除', 'task', taskId, error);
    }
  }

  /**
   * ビューに応じてタスクの期日を更新する
   */
  async updateTaskDueDateForView(taskId: string, viewId: string): Promise<void> {
    let newDueDate: Date | undefined;
    const today = new Date();

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
        return;
    }

    if (newDueDate) {
      await this.updateTask(taskId, { planEndDate: newDueDate });
    }
  }
}
