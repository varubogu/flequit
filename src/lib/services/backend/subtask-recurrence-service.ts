import type { SubtaskRecurrence, SubtaskRecurrenceSearchCondition } from '$lib/types/recurrence-reference';

/**
 * サブタスク繰り返し関連付け管理サービスのインターフェース
 */
export interface SubtaskRecurrenceService {
  /**
   * サブタスクに繰り返しルールを関連付ける
   * @param subtaskRecurrence サブタスク繰り返し関連付け
   * @returns 成功したかどうか
   */
  create(subtaskRecurrence: SubtaskRecurrence): Promise<boolean>;

  /**
   * サブタスクIDによる繰り返し関連付けを取得する
   * @param subtaskId サブタスクID
   * @returns サブタスク繰り返し関連付け（存在しない場合はnull）
   */
  getBySubtaskId(subtaskId: string): Promise<SubtaskRecurrence | null>;

  /**
   * サブタスクの繰り返し関連付けを削除する
   * @param subtaskId サブタスクID
   * @returns 成功したかどうか
   */
  delete(subtaskId: string): Promise<boolean>;

  /**
   * サブタスク繰り返し関連付けを検索する
   * @param condition 検索条件
   * @returns 条件に合致するサブタスク繰り返し関連付けの配列
   */
  search(condition: SubtaskRecurrenceSearchCondition): Promise<SubtaskRecurrence[]>;
}