import type { RecurrenceRule } from './recurrence';
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
  /** タグIDの配列 */
  tagIds?: string[];
  /** タグ一覧（UI用途の便宜プロパティ） */
  tags?: Tag[];
  /** 作成日時 */
  createdAt: Date;
  /** 更新日時 */
  updatedAt: Date;
  /** 削除フラグ（論理削除） */
  deleted: boolean;
  /** 最終更新者のユーザーID */
  updatedBy: string;
}

/**
 * タグを含むサブタスク（UIコンポーネント用）
 */
export interface SubTaskWithTags extends SubTask {
  /** タグ一覧 */
  tags: Tag[];
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
