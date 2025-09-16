// 繰り返しルール関連の型定義

/**
 * 繰り返しルール
 */
export interface RecurrenceRule {
  id: string;
  /** 繰り返し単位 ("minute", "hour", "day", "week", "month", "quarter", "halfyear", "year") */
  unit: string;
  /** 繰り返し間隔 */
  interval: number;
  /** 特定曜日のリスト ("monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday") */
  daysOfWeek?: string[];
  /** 詳細パターン設定（JSON文字列） */
  details?: string;
  /** 補正条件（JSON文字列） */
  adjustment?: string;
  /** 終了日（RFC3339文字列） */
  endDate?: string;
  /** 最大回数 */
  maxOccurrences?: number;
}

/**
 * 繰り返しルール作成・更新用のパッチ型
 */
export type RecurrenceRulePatch = Partial<RecurrenceRule>;

/**
 * 繰り返しルール検索条件
 */
export interface RecurrenceRuleSearchCondition {
  /** 繰り返し単位での絞り込み */
  unit?: string;
  /** 終了日での絞り込み */
  endDate?: string;
  /** 最大回数での絞り込み */
  maxOccurrences?: number;
}
