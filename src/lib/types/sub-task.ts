import type { RecurrenceRule } from "./datetime-calendar";
import type { Tag } from "./tag";
import type { TaskStatus } from "./task";

/**
 * サブタスク
 */
export interface SubTask {
  /** サブタスクID */
  id: string;
  /** 親タスクID */
  task_id: string;
  /** サブタスクタイトル */
  title: string;
  /** サブタスクの説明 */
  description?: string;
  /** ステータス */
  status: TaskStatus;
  /** 優先度 */
  priority?: number;
  /** 開始日 */
  start_date?: Date;
  /** 終了日（期日） */
  end_date?: Date;
  /** 期日が範囲選択かどうか */
  is_range_date?: boolean;
  /** 繰り返しルール */
  recurrence_rule?: RecurrenceRule;
  /** 表示順序 */
  order_index: number;
  /** タグ一覧 */
  tags: Tag[];
  /** 作成日時 */
  created_at: Date;
  /** 更新日時 */
  updated_at: Date;
}

/**
 * サブタスク検索条件
 */
export interface SubTaskSearchCondition {
  /** 親タスクID */
  task_id?: string;
  /** タイトル */
  title?: string;
  /** ステータス */
  status?: TaskStatus;
  /** 優先度 */
  priority?: number;
}
