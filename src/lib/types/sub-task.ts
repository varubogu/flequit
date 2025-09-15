import type { RecurrenceRule } from './datetime-calendar';
import type { Tag } from './tag';
import type { TaskStatus } from './task';

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
  /** 予定開始日 */
  plan_start_date?: Date;
  /** 予定終了日 */
  plan_end_date?: Date;
  /** 実開始日 */
  do_start_date?: Date;
  /** 実終了日 */
  do_end_date?: Date;
  /** 期日が範囲選択かどうか */
  is_range_date?: boolean;
  /** 繰り返しルール */
  recurrence_rule?: RecurrenceRule;
  /** 表示順序 */
  order_index: number;
  /** 完了状態 */
  completed: boolean;
  /** 担当者ユーザーIDの配列 */
  assigned_user_ids: string[];
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

