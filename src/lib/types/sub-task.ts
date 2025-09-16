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
  taskId: string;
  /** サブタスクタイトル */
  title: string;
  /** サブタスクの説明 */
  description?: string;
  /** ステータス */
  status: TaskStatus;
  /** 優先度 */
  priority?: number;
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
  /** 表示順序 */
  orderIndex: number;
  /** 完了状態 */
  completed: boolean;
  /** 担当者ユーザーIDの配列 */
  assignedUserIds: string[];
  /** タグ一覧 */
  tags: Tag[];
  /** 作成日時 */
  createdAt: Date;
  /** 更新日時 */
  updatedAt: Date;
}

/**
 * サブタスク検索条件
 */
export interface SubTaskSearchCondition {
  /** 親タスクID */
  taskId?: string;
  /** タイトル */
  title?: string;
  /** ステータス */
  status?: TaskStatus;
  /** 優先度 */
  priority?: number;
}
