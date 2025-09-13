// 繰り返し調整関連の型定義

/**
 * 繰り返し調整
 */
export interface RecurrenceAdjustment {
  /** 日付条件のリスト（文字列表現） */
  date_conditions: string[];
  /** 曜日条件のリスト（文字列表現） */
  weekday_conditions: string[];
}

/**
 * 繰り返し調整検索条件
 */
export interface RecurrenceAdjustmentSearchCondition {
  /** 繰り返しルールIDでの絞り込み */
  rule_id?: string;
  /** 日付条件での絞り込み */
  date_conditions?: string[];
  /** 曜日条件での絞り込み */
  weekday_conditions?: string[];
}