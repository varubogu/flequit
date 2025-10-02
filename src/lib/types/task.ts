import type { RecurrenceRule } from './recurrence';
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
  planStartDate?: Date;
  /** 予定終了日 */
  planEndDate?: Date;
  /** 期日が範囲選択かどうか */
  isRangeDate?: boolean;
}

/**
 * タスク
 */
export interface Task {
  /** タスクID */
  id: string;
  /** プロジェクトID */
  projectId: string;
  /** サブタスクID（サブタスクの場合） */
  subTaskId?: string;
  /** 所属タスクリストID */
  listId: string;
  /** タスクタイトル */
  title: string;
  /** タスクの説明 */
  description?: string;
  /** ステータス */
  status: TaskStatus;
  /** 優先度 */
  priority: number;
  /** 予定開始日 */
  planStartDate?: Date;
  /** 予定終了日 */
  planEndDate?: Date;
  /** 実開始日 */
  doStartDate?: Date;
  /** 実終了日 */
  doEndDate?: Date;
  /** 期日が範囲選択かどうか */
  isRangeDate?: boolean;
  /** 繰り返しルール */
  recurrenceRule?: RecurrenceRule;
  /** 担当者ユーザーIDの配列 */
  assignedUserIds: string[];
  /** タグIDの配列 */
  tagIds: string[];
  /** 表示順序 */
  orderIndex: number;
  /** アーカイブ状態 */
  isArchived: boolean;
  /** 作成日時 */
  createdAt: Date;
  /** 更新日時 */
  updatedAt: Date;
}

/**
 * サブタスクとタグを含むタスク（UIコンポーネント用）
 */
export interface TaskWithSubTasks extends Task {
  /** サブタスク一覧 */
  subTasks: SubTask[];
  /** タグ一覧 */
  tags: Tag[];
}

/**
 * タスク検索条件
 */
export interface TaskSearchCondition {
  /** プロジェクトID */
  projectId?: string;
  /** 所属タスクリストID */
  listId?: string;
  /** タイトル */
  title?: string;
  /** ステータス */
  status?: TaskStatus;
  /** 優先度 */
  priority?: number;
  /** アーカイブ状態 */
  isArchived?: boolean;
}
