// 繰り返し調整関連の型定義

/**
 * 繰り返し調整
 */
export interface RecurrenceAdjustment {
  /** 日付条件のリスト（文字列表現） */
  dateConditions: string[];
  /** 曜日条件のリスト（文字列表現） */
  weekdayConditions: string[];
}

/**
 * 繰り返し調整検索条件
 */
export interface RecurrenceAdjustmentSearchCondition {
  /** 繰り返しルールIDでの絞り込み */
  ruleIid?: string;
  /** 日付条件での絞り込み */
  dateConditions?: string[];
  /** 曜日条件での絞り込み */
  weekdayConditions?: string[];
}
