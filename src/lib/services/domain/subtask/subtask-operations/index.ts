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
 * SubTaskOperations (このファイル) - 各操作クラスへの委譲
 *     ├─→ SubTaskStatusOperations (status.ts)
 *     ├─→ SubTaskCrudOperations (crud.ts)
 *     ├─→ SubTaskTagOperations (tags.ts)
 *     └─→ SubTaskViewOperations (view.ts)
 */

import type { TaskWithSubTasks, TaskStatus } from '$lib/types/task';
import type { SubTask } from '$lib/types/sub-task';
import type { SubTaskOperationsDependencies } from './types';
import { SubTaskStatusOperations } from './status';
import { SubTaskCrudOperations } from './crud';
import { SubTaskTagOperations } from './tags';
import { SubTaskViewOperations } from './view';

export type { SubTaskOperationsDependencies } from './types';

/**
 * サブタスク操作を統合したサービスクラス
 *
 * すべてのサブタスク操作はこのクラスを通じて行われます。
 * ローカル状態の楽観的更新とバックエンドへの永続化を自動的に処理します。
 */
export class SubTaskOperations {
  #status: SubTaskStatusOperations;
  #crud: SubTaskCrudOperations;
  #tags: SubTaskTagOperations;
  #view: SubTaskViewOperations;

  constructor(deps: SubTaskOperationsDependencies) {
    this.#status = new SubTaskStatusOperations({
      taskCoreStore: deps.taskCoreStore,
      subTaskStore: deps.subTaskStore
    });
    this.#crud = new SubTaskCrudOperations({ subTaskStore: deps.subTaskStore });
    this.#tags = new SubTaskTagOperations(deps);
    this.#view = new SubTaskViewOperations({ subTaskStore: deps.subTaskStore });
  }

  // ===== ステータス操作 =====

  toggleSubTaskStatus(task: TaskWithSubTasks, subTaskId: string): void {
    this.#status.toggleSubTaskStatus(task, subTaskId);
  }

  changeSubTaskStatus(subTaskId: string, newStatus: TaskStatus): void {
    this.#status.changeSubTaskStatus(subTaskId, newStatus);
  }

  // ===== CRUD 操作 =====

  async addSubTask(
    taskId: string,
    subTaskData: { title: string; description?: string; priority?: number }
  ) {
    return this.#crud.addSubTask(taskId, subTaskData);
  }

  updateSubTask(subTaskId: string, updates: Partial<SubTask>): void {
    this.#crud.updateSubTask(subTaskId, updates);
  }

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
    this.#crud.updateSubTaskFromForm(subTaskId, formData);
  }

  async deleteSubTask(subTaskId: string): Promise<void> {
    return this.#crud.deleteSubTask(subTaskId);
  }

  // ===== タグ操作 =====

  async addTagToSubTaskByName(subTaskId: string, taskId: string, tagName: string): Promise<void> {
    return this.#tags.addTagToSubTaskByName(subTaskId, taskId, tagName);
  }

  async addTagToSubTask(subTaskId: string, taskId: string, tagId: string): Promise<void> {
    return this.#tags.addTagToSubTask(subTaskId, taskId, tagId);
  }

  async removeTagFromSubTask(subTaskId: string, taskId: string, tagId: string): Promise<void> {
    return this.#tags.removeTagFromSubTask(subTaskId, taskId, tagId);
  }

  // ===== ビュー操作 =====

  updateSubTaskDueDateForView(subTaskId: string, taskId: string, viewId: string): void {
    this.#view.updateSubTaskDueDateForView(subTaskId, taskId, viewId);
  }
}
