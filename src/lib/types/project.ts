import type { TaskList, TaskListWithTasks } from "./task-list";

export interface Project {
  id: string;
  name: string;
  description?: string;
  color?: string;
  order_index: number;
  is_archived: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ProjectWithLists extends Project {
  task_lists: TaskList[];
}

// 検索条件用の型定義
export interface ProjectSearchCondition {
  name?: string;
  is_archived?: boolean;
  order_index?: number;
}

export interface ProjectTree extends Project {
  task_lists: TaskListWithTasks[];
}
