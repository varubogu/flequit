// 繰り返し詳細関連の型定義

/**
 * 繰り返し詳細
 */
export interface RecurrenceDetails {
  /** 特定日（1-31） */
  specific_date?: number;
  /** 期間内の週（文字列表現） */
  week_of_period?: string;
  /** 週内の曜日（文字列表現） */
  weekday_of_week?: string;
  /** 日付条件のリスト（文字列表現） */
  date_conditions?: string[];
}

/**
 * 繰り返し詳細検索条件
 */
export interface RecurrenceDetailsSearchCondition {
  /** 繰り返しルールIDでの絞り込み */
  rule_id?: string;
  /** 特定日での絞り込み */
  specific_date?: number;
  /** 期間内の週での絞り込み */
  week_of_period?: string;
  /** 週内の曜日での絞り込み */
  weekday_of_week?: string;
}