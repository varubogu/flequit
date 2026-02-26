import type {
  SubtaskRecurrence,
  SubtaskRecurrenceSearchCondition
} from '$lib/types/recurrence-reference';

/**
 * サブタスク繰り返し関連付け管理サービスのインターフェース
 */
export interface SubtaskRecurrenceService {
  /**
   * サブタスクに繰り返しルールを関連付ける
   * @param projectId プロジェクトID
   * @param subtaskRecurrence サブタスク繰り返し関連付け
   * @param userId 操作を行ったユーザーID
   * @returns 成功したかどうか
   */
  create(projectId: string, subtaskRecurrence: SubtaskRecurrence, userId: string): Promise<boolean>;

  /**
   * サブタスクIDによる繰り返し関連付けを取得する
   * @param projectId プロジェクトID
   * @param subtaskId サブタスクID
   * @param userId 操作を行ったユーザーID
   * @returns サブタスク繰り返し関連付け（存在しない場合はnull）
   */
  getBySubtaskId(
    projectId: string,
    subtaskId: string,
    userId: string
  ): Promise<SubtaskRecurrence | null>;

  /**
   * サブタスクの繰り返し関連付けを削除する
   * @param projectId プロジェクトID
   * @param subtaskId サブタスクID
   * @param userId 操作を行ったユーザーID
   * @returns 成功したかどうか
   */
  delete(projectId: string, subtaskId: string, userId: string): Promise<boolean>;

  /**
   * サブタスク繰り返し関連付けを検索する
   * @param projectId プロジェクトID
   * @param condition 検索条件
   * @returns 条件に合致するサブタスク繰り返し関連付けの配列
   */
  search(
    projectId: string,
    condition: SubtaskRecurrenceSearchCondition
  ): Promise<SubtaskRecurrence[]>;
}
