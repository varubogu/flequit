import type { TaskWithSubTasks } from "./task";

export interface TaskList {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  color?: string;
  order_index: number;
  is_archived: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface TaskListWithTasks extends TaskList {
  tasks: TaskWithSubTasks[];
}

export interface TaskListSearchCondition {
  project_id?: string;
  name?: string;
  is_archived?: boolean;
  order_index?: number;
}
