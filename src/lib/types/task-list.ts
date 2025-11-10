import type { TaskWithSubTasks } from './task';

/**
 * タスクリスト
 */
export interface TaskList {
  /** タスクリストID */
  id: string;
  /** プロジェクトID */
  projectId: string;
  /** タスクリスト名 */
  name: string;
  /** タスクリストの説明 */
  description?: string;
  /** タスクリストの色 */
  color?: string;
  /** 表示順序 */
  orderIndex: number;
  /** アーカイブ状態 */
  isArchived: boolean;
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
 * タスクを含むタスクリスト
 */
export interface TaskListWithTasks extends TaskList {
  /** タスクリストに含まれるタスク一覧 */
  tasks: TaskWithSubTasks[];
}

/**
 * タスクリスト検索条件
 */
export interface TaskListSearchCondition {
  /** プロジェクトID */
  projectId?: string;
  /** タスクリスト名 */
  name?: string;
  /** アーカイブ状態 */
  isArchived?: boolean;
  /** 表示順序 */
  orderIndex?: number;
}
