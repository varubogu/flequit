import type { TaskList, TaskListWithTasks } from './task-list';
import type { Tag } from './tag';

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
  orderIndex: number;
  /** アーカイブ状態 */
  isArchived: boolean;
  /** プロジェクトのステータス */
  status?: string;
  /** プロジェクトオーナーのユーザーID */
  ownerId?: string;
  /** 作成日時 */
  createdAt: Date;
  /** 更新日時 */
  updatedAt: Date;
}

/**
 * タスクリストを含むプロジェクト
 */
export interface ProjectWithLists extends Project {
  /** プロジェクトに含まれるタスクリスト */
  taskLists: TaskList[];
}

/**
 * プロジェクト検索条件
 */
export interface ProjectSearchCondition {
  /** プロジェクト名 */
  name?: string;
  /** アーカイブ状態 */
  isArchived?: boolean;
  /** 表示順序 */
  orderIndex?: number;
}

/**
 * タスクを含む完全なプロジェクト階層
 */
export interface ProjectTree extends Project {
  /** タスクを含むタスクリスト */
  taskLists: TaskListWithTasks[];
  /** プロジェクト内の全タグ（フロントエンド側でタグID→タグオブジェクト変換用） */
  allTags: Tag[];
}
