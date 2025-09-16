// サブタスク繰り返し関連付け関連の型定義

/**
 * サブタスク繰り返し関連付け
 */
export interface SubtaskRecurrence {
  /** サブタスクID */
  subtaskId: string;
  /** 繰り返しルールID */
  recurrenceRuleId: string;
}

/**
 * サブタスク繰り返し関連付け検索条件
 */
export interface SubtaskRecurrenceSearchCondition {
  /** サブタスクIDでの絞り込み */
  subtaskId?: string;
  /** 繰り返しルールIDでの絞り込み */
  recurrenceRuleId?: string;
}
