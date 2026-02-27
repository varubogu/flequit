/**
 * TaskOperations - タスク操作の統合サービス
 *
 * 責務:
 * - タスクの CRUD 操作（作成、読み取り、更新、削除）
 * - ステータス変更（完了/未完了のトグル）
 * - タグ管理（追加/削除）
 * - リスト間移動
 * - 楽観的更新とエラーハンドリング
 *
 * アーキテクチャ:
 * UIコンポーネント
 *     ↓
 * TaskOperations (このファイル) - 各操作クラスへの委譲
 *     ├─→ TaskCrudOperations (crud.ts)
 *     ├─→ TaskStatusOperations (status.ts)
 *     ├─→ TaskTagOperations (tags.ts)
 *     └─→ TaskMoveOperations (move.ts)
 */

import type { Task, TaskStatus, TaskWithSubTasks } from '$lib/types/task';
import { TaskRecurrenceService } from '$lib/services/domain/task-recurrence';
import type { TaskOperationsDependencies } from './types';
import { TaskCrudOperations } from './crud';
import { TaskStatusOperations } from './status';
import { TaskTagOperations } from './tags';
import { TaskMoveOperations } from './move';

export type { TaskOperationsDependencies } from './types';

/**
 * タスク操作を統合したサービスクラス
 *
 * すべてのタスク操作はこのクラスを通じて行われます。
 * ローカル状態の楽観的更新とバックエンドへの永続化を自動的に処理します。
 */
export class TaskOperations {
  #crud: TaskCrudOperations;
  #status: TaskStatusOperations;
  #tags: TaskTagOperations;
  #move: TaskMoveOperations;

  constructor(deps: TaskOperationsDependencies) {
    const recurrenceService = deps.recurrenceService ?? new TaskRecurrenceService();
    this.#crud = new TaskCrudOperations(deps);
    this.#status = new TaskStatusOperations(
      { taskStore: deps.taskStore },
      this.#crud,
      recurrenceService
    );
    this.#tags = new TaskTagOperations(deps);
    this.#move = new TaskMoveOperations(deps);
  }

  // ===== CRUD操作 =====

  async addTask(listId: string, taskData: Partial<TaskWithSubTasks>) {
    return this.#crud.addTask(listId, taskData);
  }

  async updateTask(taskId: string, updates: Partial<Task>) {
    return this.#crud.updateTask(taskId, updates);
  }

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
  ) {
    return this.#crud.updateTaskFromForm(taskId, formData);
  }

  async deleteTask(taskId: string) {
    return this.#crud.deleteTask(taskId);
  }

  async updateTaskDueDateForView(taskId: string, viewId: string) {
    return this.#crud.updateTaskDueDateForView(taskId, viewId);
  }

  // ===== ステータス変更操作 =====

  async toggleTaskStatus(taskId: string) {
    return this.#status.toggleTaskStatus(taskId);
  }

  async changeTaskStatus(taskId: string, newStatus: TaskStatus) {
    return this.#status.changeTaskStatus(taskId, newStatus);
  }

  // ===== タグ管理操作 =====

  async addTagToTaskByName(taskId: string, tagName: string) {
    return this.#tags.addTagToTaskByName(taskId, tagName);
  }

  async addTagToTask(taskId: string, tagId: string) {
    return this.#tags.addTagToTask(taskId, tagId);
  }

  async removeTagFromTask(taskId: string, tagId: string) {
    return this.#tags.removeTagFromTask(taskId, tagId);
  }

  // ===== 移動操作 =====

  async moveTaskToList(taskId: string, newTaskListId: string) {
    return this.#move.moveTaskToList(taskId, newTaskListId);
  }
}
