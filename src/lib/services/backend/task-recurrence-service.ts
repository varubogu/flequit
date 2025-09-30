import type { TaskRecurrence, TaskRecurrenceSearchCondition } from '$lib/types/recurrence-reference';

/**
 * タスク繰り返し関連付け管理サービスのインターフェース
 */
export interface TaskRecurrenceService {
  /**
   * タスクに繰り返しルールを関連付ける
   * @param taskRecurrence タスク繰り返し関連付け
   * @returns 成功したかどうか
   */
  create(taskRecurrence: TaskRecurrence): Promise<boolean>;

  /**
   * タスクIDによる繰り返し関連付けを取得する
   * @param taskId タスクID
   * @returns タスク繰り返し関連付け（存在しない場合はnull）
   */
  getByTaskId(taskId: string): Promise<TaskRecurrence | null>;

  /**
   * タスクの繰り返し関連付けを削除する
   * @param taskId タスクID
   * @returns 成功したかどうか
   */
  delete(taskId: string): Promise<boolean>;

  /**
   * タスク繰り返し関連付けを検索する
   * @param condition 検索条件
   * @returns 条件に合致するタスク繰り返し関連付けの配列
   */
  search(condition: TaskRecurrenceSearchCondition): Promise<TaskRecurrence[]>;
}