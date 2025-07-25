export type TaskStatus = 'not_started' | 'in_progress' | 'waiting' | 'completed' | 'cancelled';

// 繰り返し機能の型定義
export type RecurrenceUnit = 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'half_year' | 'year';
export type DayOfWeek = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';
export type WeekOfMonth = 'first' | 'second' | 'third' | 'fourth' | 'last';
export type AdjustmentType = 'previous' | 'next';

export interface RecurrenceAdjustment {
  enabled: boolean;
  if_weekday?: DayOfWeek;
  if_holiday?: boolean;
  then_adjust: AdjustmentType;
  to_weekday: DayOfWeek;
}

export interface RecurrenceRule {
  unit: RecurrenceUnit;
  interval: number; // 間隔（例：2週間なら2）
  days_of_week?: DayOfWeek[]; // 週単位の場合の曜日指定
  day_of_month?: number; // 月単位の場合の日付指定
  week_of_month?: WeekOfMonth; // 月単位の場合の週指定（第2日曜日など）
  months?: number[]; // 年単位の場合の月指定
  adjustment?: RecurrenceAdjustment; // 日付補正設定
  end_date?: Date; // 繰り返し終了日
  max_occurrences?: number; // 最大繰り返し回数
}

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
  is_range_date?: boolean;  // 期日が範囲選択かどうか
  recurrence_rule?: RecurrenceRule;
  order_index: number;
  is_archived: boolean;
  created_at: Date;
  updated_at: Date;
}


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

export interface SubTask {
  id: string;
  task_id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority?: number;
  start_date?: Date;
  end_date?: Date;
  is_range_date?: boolean;  // 期日が範囲選択かどうか
  recurrence_rule?: RecurrenceRule;
  order_index: number;
  tags: Tag[];
  created_at: Date;
  updated_at: Date;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  created_at: Date;
  updated_at: Date;
}

// View models for UI components
export interface TaskWithSubTasks extends Task {
  sub_tasks: SubTask[];
  tags: Tag[];
}

export interface ProjectWithLists extends Project {
  task_lists: TaskList[];
}

export interface TaskListWithTasks extends TaskList {
  tasks: TaskWithSubTasks[];
}

export interface ProjectTree extends Project {
  task_lists: TaskListWithTasks[];
}
