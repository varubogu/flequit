import type { RecurrenceRule, RecurrenceRuleSearchCondition } from '$lib/types/recurrence';

/**
 * 繰り返しルール管理サービスのインターフェース
 */
export interface RecurrenceRuleService {
  /**
   * 繰り返しルールを作成する
   * @param rule 作成する繰り返しルール
   * @returns 成功したかどうか
   */
  create(rule: RecurrenceRule): Promise<boolean>;

  /**
   * 繰り返しルールを取得する
   * @param ruleId 繰り返しルールID
   * @returns 繰り返しルール（存在しない場合はnull）
   */
  get(ruleId: string): Promise<RecurrenceRule | null>;

  /**
   * すべての繰り返しルールを取得する
   * @returns 全ての繰り返しルールの配列
   */
  getAll(): Promise<RecurrenceRule[]>;

  /**
   * 繰り返しルールを更新する
   * @param rule 更新する繰り返しルール（id含む）
   * @returns 成功したかどうか
   */
  update(rule: RecurrenceRule): Promise<boolean>;

  /**
   * 繰り返しルールを削除する
   * @param ruleId 削除する繰り返しルールID
   * @returns 成功したかどうか
   */
  delete(ruleId: string): Promise<boolean>;

  /**
   * 繰り返しルールを検索する
   * @param condition 検索条件
   * @returns 条件に合致する繰り返しルールの配列
   */
  search(condition: RecurrenceRuleSearchCondition): Promise<RecurrenceRule[]>;
}