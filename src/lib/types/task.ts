import type { RecurrenceRule } from './datetime-calendar';
import type { SubTask } from './sub-task';
import type { Tag } from './tag';

/**
 * タスクのステータス
 */
export type TaskStatus = 'not_started' | 'in_progress' | 'waiting' | 'completed' | 'cancelled';

/**
 * タスクの基本情報
 */
export interface TaskBase {
  /** ステータス */
  status: TaskStatus;
  /** 予定開始日 */
  plan_start_date?: Date;
  /** 予定終了日 */
  plan_end_date?: Date;
  /** 期日が範囲選択かどうか */
  is_range_date?: boolean;
}

/**
 * タスク
 */
export interface Task {
  /** タスクID */
  id: string;
  /** プロジェクトID */
  project_id: string;
  /** サブタスクID（サブタスクの場合） */
  sub_task_id?: string;
  /** 所属タスクリストID */
  list_id: string;
  /** タスクタイトル */
  title: string;
  /** タスクの説明 */
  description?: string;
  /** ステータス */
  status: TaskStatus;
  /** 優先度 */
  priority: number;
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
  /** 担当者ユーザーIDの配列 */
  assigned_user_ids: string[];
  /** タグIDの配列 */
  tag_ids: string[];
  /** 表示順序 */
  order_index: number;
  /** アーカイブ状態 */
  is_archived: boolean;
  /** 作成日時 */
  created_at: Date;
  /** 更新日時 */
  updated_at: Date;
}

/**
 * サブタスクとタグを含むタスク（UIコンポーネント用）
 */
export interface TaskWithSubTasks extends Task {
  /** サブタスク一覧 */
  sub_tasks: SubTask[];
  /** タグ一覧 */
  tags: Tag[];
}

/**
 * タスク検索条件
 */
export interface TaskSearchCondition {
  /** プロジェクトID */
  project_id?: string;
  /** 所属タスクリストID */
  list_id?: string;
  /** タイトル */
  title?: string;
  /** ステータス */
  status?: TaskStatus;
  /** 優先度 */
  priority?: number;
  /** アーカイブ状態 */
  is_archived?: boolean;
}

