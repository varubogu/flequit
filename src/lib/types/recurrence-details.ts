// 繰り返し詳細関連の型定義

/**
 * 繰り返し詳細
 */
export interface RecurrenceDetails {
  /** 特定日（1-31） */
  specificDate?: number;
  /** 期間内の週（文字列表現） */
  weekOfPeriod?: string;
  /** 週内の曜日（文字列表現） */
  weekdayOfWeek?: string;
  /** 日付条件のリスト（文字列表現） */
  dateConditions?: string[];
}

/**
 * 繰り返し詳細検索条件
 */
export interface RecurrenceDetailsSearchCondition {
  /** 繰り返しルールIDでの絞り込み */
  ruleId?: string;
  /** 特定日での絞り込み */
  specificDate?: number;
  /** 期間内の週での絞り込み */
  weekOfPeriod?: string;
  /** 週内の曜日での絞り込み */
  weekdayOfWeek?: string;
}
