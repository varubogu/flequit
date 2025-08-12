import type { RecurrenceRule } from "./datetime-calendar";
import type { Tag } from "./tag";
import type { TaskStatus } from "./task";


export interface SubTask {
  id: string;
  task_id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority?: number;
  start_date?: Date;
  end_date?: Date;
  is_range_date?: boolean; // 期日が範囲選択かどうか
  recurrence_rule?: RecurrenceRule;
  order_index: number;
  tags: Tag[];
  created_at: Date;
  updated_at: Date;
}export interface SubTaskSearchCondition {
  task_id?: string;
  title?: string;
  status?: TaskStatus;
  priority?: number;
}
