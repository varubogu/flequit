import type { RecurrenceDetails, RecurrenceDetailsSearchCondition } from '$lib/types/recurrence-details';

/**
 * 繰り返し詳細管理サービスのインターフェース
 */
export interface RecurrenceDetailsService {
  /**
   * 繰り返し詳細を作成する
   * @param details 作成する繰り返し詳細
   * @returns 成功したかどうか
   */
  create(details: RecurrenceDetails): Promise<boolean>;

  /**
   * 繰り返しルールIDによる詳細を取得する
   * @param ruleId 繰り返しルールID
   * @returns 繰り返し詳細（存在しない場合はnull）
   */
  getByRuleId(ruleId: string): Promise<RecurrenceDetails | null>;

  /**
   * 繰り返し詳細を更新する
   * @param details 更新する繰り返し詳細
   * @returns 成功したかどうか
   */
  update(details: RecurrenceDetails): Promise<boolean>;

  /**
   * 繰り返し詳細を削除する
   * @param detailsId 削除する詳細ID
   * @returns 成功したかどうか
   */
  delete(detailsId: string): Promise<boolean>;

  /**
   * 繰り返し詳細を検索する
   * @param condition 検索条件
   * @returns 条件に合致する繰り返し詳細の配列
   */
  search(condition: RecurrenceDetailsSearchCondition): Promise<RecurrenceDetails[]>;
}