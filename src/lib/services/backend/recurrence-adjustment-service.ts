import type { RecurrenceAdjustment, RecurrenceAdjustmentSearchCondition } from '$lib/types/recurrence-adjustment';

/**
 * 繰り返し調整管理サービスのインターフェース
 */
export interface RecurrenceAdjustmentService {
  /**
   * 繰り返し調整を作成する
   * @param adjustment 作成する繰り返し調整
   * @returns 成功したかどうか
   */
  create(adjustment: RecurrenceAdjustment): Promise<boolean>;

  /**
   * 繰り返しルールIDによる調整一覧を取得する
   * @param ruleId 繰り返しルールID
   * @returns 繰り返し調整の配列
   */
  getByRuleId(ruleId: string): Promise<RecurrenceAdjustment[]>;

  /**
   * 繰り返し調整を削除する
   * @param adjustmentId 削除する調整ID
   * @returns 成功したかどうか
   */
  delete(adjustmentId: string): Promise<boolean>;

  /**
   * 繰り返し調整を検索する
   * @param condition 検索条件
   * @returns 条件に合致する繰り返し調整の配列
   */
  search(condition: RecurrenceAdjustmentSearchCondition): Promise<RecurrenceAdjustment[]>;
}