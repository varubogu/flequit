import type {
  RecurrenceRule,
  RecurrenceRulePatch,
  RecurrenceRuleSearchCondition
} from '$lib/types/recurrence';

/**
 * 繰り返しルール管理サービスのインターフェース
 */
export interface RecurrenceRuleService {
  /**
   * 繰り返しルールを作成する
   * @param projectId プロジェクトID
   * @param rule 作成する繰り返しルール
   * @param userId 操作を行ったユーザーID
   * @returns 成功したかどうか
   */
  create(projectId: string, rule: RecurrenceRule, userId: string): Promise<boolean>;

  /**
   * 繰り返しルールを取得する
   * @param projectId プロジェクトID
   * @param ruleId 繰り返しルールID
   * @param userId 操作を行ったユーザーID
   * @returns 繰り返しルール（存在しない場合はnull）
   */
  get(projectId: string, ruleId: string, userId: string): Promise<RecurrenceRule | null>;

  /**
   * すべての繰り返しルールを取得する
   * @param projectId プロジェクトID
   * @param userId 操作を行ったユーザーID
   * @returns 全ての繰り返しルールの配列
   */
  getAll(projectId: string, userId: string): Promise<RecurrenceRule[]>;

  /**
   * 繰り返しルールを更新する（差分更新）
   * @param projectId プロジェクトID
   * @param ruleId 更新する繰り返しルールID
   * @param patch 更新する繰り返しルールの差分データ
   * @param userId 操作を行ったユーザーID
   * @returns 成功したかどうか
   */
  update(
    projectId: string,
    ruleId: string,
    patch: RecurrenceRulePatch,
    userId: string
  ): Promise<boolean>;

  /**
   * 繰り返しルールを削除する
   * @param projectId プロジェクトID
   * @param ruleId 削除する繰り返しルールID
   * @param userId 操作を行ったユーザーID
   * @returns 成功したかどうか
   */
  delete(projectId: string, ruleId: string, userId: string): Promise<boolean>;

  /**
   * 繰り返しルールを検索する
   * @param projectId プロジェクトID
   * @param condition 検索条件
   * @returns 条件に合致する繰り返しルールの配列
   */
  search(projectId: string, condition: RecurrenceRuleSearchCondition): Promise<RecurrenceRule[]>;
}
