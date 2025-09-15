import type { TaskWithSubTasks } from './task';

/**
 * タスクリスト
 */
export interface TaskList {
  /** タスクリストID */
  id: string;
  /** プロジェクトID */
  project_id: string;
  /** タスクリスト名 */
  name: string;
  /** タスクリストの説明 */
  description?: string;
  /** タスクリストの色 */
  color?: string;
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
  project_id?: string;
  /** タスクリスト名 */
  name?: string;
  /** アーカイブ状態 */
  is_archived?: boolean;
  /** 表示順序 */
  order_index?: number;
}

