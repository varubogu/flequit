import type { RecurrenceRule } from "./datetime-calendar";
import type { SubTask } from "./sub-task";
import type { Tag } from "./tag";

export type TaskStatus = 'not_started' | 'in_progress' | 'waiting' | 'completed' | 'cancelled';

export interface TaskBase {
  status: TaskStatus;
  start_date?: Date;
  end_date?: Date;
  is_range_date?: boolean;
}

export interface Task {
  id: string;
  sub_task_id?: string;
  list_id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: number;
  start_date?: Date;
  end_date?: Date;
  is_range_date?: boolean; // 期日が範囲選択かどうか
  recurrence_rule?: RecurrenceRule;
  order_index: number;
  is_archived: boolean;
  created_at: Date;
  updated_at: Date;
}

// View models for UI components
export interface TaskWithSubTasks extends Task {
  sub_tasks: SubTask[];
  tags: Tag[];
}

export interface TaskSearchCondition {
  list_id?: string;
  title?: string;
  status?: TaskStatus;
  priority?: number;
  is_archived?: boolean;
}
