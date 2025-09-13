// サブタスク繰り返し関連付け関連の型定義

/**
 * サブタスク繰り返し関連付け
 */
export interface SubtaskRecurrence {
  /** サブタスクID */
  subtask_id: string;
  /** 繰り返しルールID */
  recurrence_rule_id: string;
}

/**
 * サブタスク繰り返し関連付け検索条件
 */
export interface SubtaskRecurrenceSearchCondition {
  /** サブタスクIDでの絞り込み */
  subtask_id?: string;
  /** 繰り返しルールIDでの絞り込み */
  recurrence_rule_id?: string;
}