/**
 * SubTaskOperations - サブタスク操作の統合サービス
 *
 * 責務:
 * - サブタスクの CRUD 操作（作成、読み取り、更新、削除）
 * - ステータス変更（完了/未完了のトグル）
 * - タグ管理（追加/削除）
 * - 楽観的更新とエラーハンドリング
 *
 * アーキテクチャ:
 * UIコンポーネント
 *     ↓
 * SubTaskOperations (このファイル)
 *     ├─→ subTaskStore (ローカル状態管理)
 *     ├─→ SubTaskBackend (バックエンド通信)
 *     └─→ errorHandler (エラー処理)
 */

import type { Task, TaskWithSubTasks, TaskStatus } from '$lib/types/task';
import type { SubTask } from '$lib/types/sub-task';
import type { TaskStore } from '$lib/stores/tasks.svelte';
import type { TaskCoreStore } from '$lib/stores/task-core-store.svelte';
import type { SubTaskStore } from '$lib/stores/sub-task-store.svelte';
import type { TagStore } from '$lib/stores/tags.svelte';
import type { ErrorHandler } from '$lib/stores/error-handler.svelte';
import type { Tag } from '$lib/types/tag';

// ===== 型定義 =====

type TaskStoreLike = Pick<TaskStore, 'getTaskProjectAndList'>;

type TaskCoreStoreLike = Pick<TaskCoreStore, 'updateTask'>;

type SubTaskStoreLike = Pick<
  SubTaskStore,
  'addSubTask' | 'updateSubTask' | 'deleteSubTask' | 'attachTagToSubTask' | 'detachTagFromSubTask'
>;

type TagStoreLike = Pick<TagStore, 'tags'>;

type ErrorHandlerLike = Pick<ErrorHandler, 'addSyncError'>;

type TaggingServiceLike = {
  createSubtaskTag: (projectId: string, subTaskId: string, tagName: string) => Promise<Tag>;
  deleteSubtaskTag: (projectId: string, subTaskId: string, tagId: string) => Promise<void>;
};

export type SubTaskOperationsDependencies = {
  taskStore: TaskStoreLike;
  taskCoreStore: TaskCoreStoreLike;
  subTaskStore: SubTaskStoreLike;
  tagStore: TagStoreLike;
  taggingService: TaggingServiceLike;
  errorHandler: ErrorHandlerLike;
};

// ===== SubTaskOperations クラス =====

/**
 * サブタスク操作を統合したサービスクラス
 *
 * すべてのサブタスク操作はこのクラスを通じて行われます。
 * ローカル状態の楽観的更新とバックエンドへの永続化を自動的に処理します。
 */
export class SubTaskOperations {
  #deps: SubTaskOperationsDependencies;

  constructor(deps: SubTaskOperationsDependencies) {
    this.#deps = deps;
  }

  // ===== ステータス操作 =====

  /**
   * サブタスクのステータスをトグル（完了 ⇔ 未完了）します
   */
  toggleSubTaskStatus(task: TaskWithSubTasks, subTaskId: string): void {
    const { taskCoreStore } = this.#deps;
    const subTask = task.subTasks.find((st) => st.id === subTaskId);
    if (!subTask) return;

    const newStatus: TaskStatus = subTask.status === 'completed' ? 'not_started' : 'completed';
    const updatedSubTasks = task.subTasks.map((st) =>
      st.id === subTaskId ? { ...st, status: newStatus } : st
    );

    void taskCoreStore.updateTask(task.id, { sub_tasks: updatedSubTasks } as Partial<Task>);
  }

  /**
   * サブタスクのステータスを変更します
   */
  changeSubTaskStatus(subTaskId: string, newStatus: TaskStatus): void {
    void this.#deps.subTaskStore.updateSubTask(subTaskId, { status: newStatus });
  }

  // ===== CRUD 操作 =====

  /**
   * 新しいサブタスクを追加します
   */
  async addSubTask(
    taskId: string,
    subTaskData: {
      title: string;
      description?: string;
      priority?: number;
    }
  ) {
    const { subTaskStore } = this.#deps;
    return subTaskStore.addSubTask(taskId, {
      title: subTaskData.title,
      description: subTaskData.description,
      status: 'not_started',
      priority: subTaskData.priority || 0
    });
  }

  /**
   * サブタスクを更新します
   */
  updateSubTask(subTaskId: string, updates: Partial<SubTask>): void {
    void this.#deps.subTaskStore.updateSubTask(subTaskId, updates);
  }

  /**
   * フォームデータからサブタスクを更新します
   */
  updateSubTaskFromForm(
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

    void this.#deps.subTaskStore.updateSubTask(subTaskId, updates);
  }

  /**
   * サブタスクを削除します
   */
  async deleteSubTask(subTaskId: string): Promise<void> {
    await this.#deps.subTaskStore.deleteSubTask(subTaskId);
  }

  // ===== タグ操作 =====

  /**
   * タグ名からサブタスクにタグを追加します
   */
  async addTagToSubTaskByName(subTaskId: string, taskId: string, tagName: string): Promise<void> {
    const { taskStore, subTaskStore, taggingService, errorHandler } = this.#deps;
    const trimmed = tagName.trim();
    if (!trimmed) {
      console.warn('Empty tag name provided');
      return;
    }

    const context = taskStore.getTaskProjectAndList(taskId);
    if (!context) {
      console.error('Failed to find task for subtask tag:', subTaskId);
      return;
    }

    try {
      const tag = await taggingService.createSubtaskTag(context.project.id, subTaskId, trimmed);
      subTaskStore.attachTagToSubTask(subTaskId, tag);
    } catch (error) {
      console.error('Failed to sync subtask tag addition to backends:', error);
      errorHandler.addSyncError('サブタスクタグ追加', 'subtask', subTaskId, error);
    }
  }

  /**
   * タグIDからサブタスクにタグを追加します
   */
  async addTagToSubTask(subTaskId: string, taskId: string, tagId: string): Promise<void> {
    const { tagStore, taskStore, subTaskStore, taggingService, errorHandler } = this.#deps;
    const tag = tagStore.tags.find((t) => t.id === tagId);
    if (!tag) return;

    const context = taskStore.getTaskProjectAndList(taskId);
    if (!context) {
      console.error('Failed to find task for subtask tag:', subTaskId);
      return;
    }

    try {
      const created = await taggingService.createSubtaskTag(
        context.project.id,
        subTaskId,
        tag.name
      );
      subTaskStore.attachTagToSubTask(subTaskId, created);
    } catch (error) {
      console.error('Failed to sync subtask tag addition to backends:', error);
      errorHandler.addSyncError('サブタスクタグ追加', 'subtask', subTaskId, error);
    }
  }

  /**
   * サブタスクからタグを削除します
   */
  async removeTagFromSubTask(subTaskId: string, taskId: string, tagId: string): Promise<void> {
    const { taskStore, subTaskStore, taggingService, errorHandler } = this.#deps;
    const context = taskStore.getTaskProjectAndList(taskId);
    if (!context) return;

    const removed = subTaskStore.detachTagFromSubTask(subTaskId, tagId);
    if (!removed) return;

    try {
      await taggingService.deleteSubtaskTag(context.project.id, subTaskId, tagId);
    } catch (error) {
      console.error('Failed to sync subtask tag removal to backends:', error);
      subTaskStore.attachTagToSubTask(subTaskId, removed);
      errorHandler.addSyncError('サブタスクタグ削除', 'subtask', subTaskId, error);
    }
  }

  // ===== ビュー操作 =====

  /**
   * ビューに応じてサブタスクの期日を更新します
   */
  updateSubTaskDueDateForView(subTaskId: string, _taskId: string, viewId: string): void {
    const { subTaskStore } = this.#deps;
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
        return;
    }

    if (newDueDate) {
      void subTaskStore.updateSubTask(subTaskId, { planEndDate: newDueDate });
    }
  }
}
