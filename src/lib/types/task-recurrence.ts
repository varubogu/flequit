// タスク繰り返し関連付け関連の型定義

/**
 * タスク繰り返し関連付け
 */
export interface TaskRecurrence {
  /** タスクID */
  taskId: string;
  /** 繰り返しルールID */
  recurrenceRuleId: string;
}

/**
 * タスク繰り返し関連付け検索条件
 */
export interface TaskRecurrenceSearchCondition {
  /** タスクIDでの絞り込み */
  taskId?: string;
  /** 繰り返しルールIDでの絞り込み */
  recurrenceRuleId?: string;
}
