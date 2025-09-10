import type { TaskList, TaskListWithTasks } from './task-list';

/**
 * プロジェクト
 */
export interface Project {
  /** プロジェクトID */
  id: string;
  /** プロジェクト名 */
  name: string;
  /** プロジェクトの説明 */
  description?: string;
  /** プロジェクトの色 */
  color?: string;
  /** 表示順序 */
  order_index: number;
  /** アーカイブ状態 */
  is_archived: boolean;
  /** プロジェクトのステータス */
  status?: string;
  /** プロジェクトオーナーのユーザーID */
  owner_id?: string;
  /** 作成日時 */
  created_at: Date;
  /** 更新日時 */
  updated_at: Date;
}

/**
 * タスクリストを含むプロジェクト
 */
export interface ProjectWithLists extends Project {
  /** プロジェクトに含まれるタスクリスト */
  task_lists: TaskList[];
}

/**
 * プロジェクト検索条件
 */
export interface ProjectSearchCondition {
  /** プロジェクト名 */
  name?: string;
  /** アーカイブ状態 */
  is_archived?: boolean;
  /** 表示順序 */
  order_index?: number;
}

/**
 * タスクを含む完全なプロジェクト階層
 */
export interface ProjectTree extends Project {
  /** タスクを含むタスクリスト */
  task_lists: TaskListWithTasks[];
}

/**
 * プロジェクト部分更新用のパッチインターフェース
 */
export interface ProjectPatch {
  /** プロジェクト名 */
  name?: string;
  /** プロジェクトの説明 */
  description?: string | null;
  /** プロジェクトの色 */
  color?: string | null;
  /** 表示順序 */
  order_index?: number;
  /** アーカイブ状態 */
  is_archived?: boolean;
  /** プロジェクトのステータス */
  status?: string | null;
  /** プロジェクトオーナーのユーザーID */
  owner_id?: string | null;
}
