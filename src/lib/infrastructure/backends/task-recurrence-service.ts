import type { TaskRecurrence, TaskRecurrenceSearchCondition } from '$lib/types/recurrence-reference';

/**
 * タスク繰り返し関連付け管理サービスのインターフェース
 */
export interface TaskRecurrenceService {
  /**
   * タスクに繰り返しルールを関連付ける
   * @param projectId プロジェクトID
   * @param taskRecurrence タスク繰り返し関連付け
   * @param userId 操作を行ったユーザーID
   * @returns 成功したかどうか
   */
  create(projectId: string, taskRecurrence: TaskRecurrence, userId: string): Promise<boolean>;

  /**
   * タスクIDによる繰り返し関連付けを取得する
   * @param projectId プロジェクトID
   * @param taskId タスクID
   * @param userId 操作を行ったユーザーID
   * @returns タスク繰り返し関連付け（存在しない場合はnull）
   */
  getByTaskId(projectId: string, taskId: string, userId: string): Promise<TaskRecurrence | null>;

  /**
   * タスクの繰り返し関連付けを削除する
   * @param projectId プロジェクトID
   * @param taskId タスクID
   * @param userId 操作を行ったユーザーID
   * @returns 成功したかどうか
   */
  delete(projectId: string, taskId: string, userId: string): Promise<boolean>;

  /**
   * タスク繰り返し関連付けを検索する
   * @param projectId プロジェクトID
   * @param condition 検索条件
   * @returns 条件に合致するタスク繰り返し関連付けの配列
   */
  search(projectId: string, condition: TaskRecurrenceSearchCondition): Promise<TaskRecurrence[]>;
}