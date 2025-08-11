export type TaskStatus = 'not_started' | 'in_progress' | 'waiting' | 'completed' | 'cancelled';

// 繰り返し機能の型定義
export type RecurrenceUnit =
  | 'minute'
  | 'hour'
  | 'day'
  | 'week'
  | 'month'
  | 'quarter'
  | 'half_year'
  | 'year';
export type RecurrenceLevel = 'disabled' | 'enabled' | 'advanced';
export type DayOfWeek =
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday';
export type WeekOfMonth = 'first' | 'second' | 'third' | 'fourth' | 'last';
export type DateRelation = 'before' | 'on_or_before' | 'on_or_after' | 'after';
export type AdjustmentDirection = 'previous' | 'next';
export type AdjustmentTarget =
  | 'weekday'
  | 'weekend'
  | 'holiday'
  | 'non_holiday'
  | 'weekend_only'
  | 'non_weekend'
  | 'weekend_holiday'
  | 'non_weekend_holiday'
  | 'specific_weekday';

// 日付条件（◯日より前/以前/以降/より後）
export interface DateCondition {
  id: string;
  relation: DateRelation; // より前/以前/以降/より後
  reference_date: Date; // 基準日
}

// 曜日条件（◯曜日なら～）
export interface WeekdayCondition {
  id: string;
  if_weekday: DayOfWeek | AdjustmentTarget; // この曜日・種別なら
  then_direction: AdjustmentDirection; // 前/後に
  then_target: AdjustmentTarget; // 平日/休日/祝日/特定曜日
  then_weekday?: DayOfWeek; // 特定曜日の場合
  then_days?: number; // ◯日の場合
}

// 補正条件
export interface RecurrenceAdjustment {
  date_conditions: DateCondition[];
  weekday_conditions: WeekdayCondition[];
}

// 繰り返し詳細設定
export interface RecurrenceDetails {
  // 特定日付指定
  specific_date?: number; // 例：毎月15日

  // 週指定（第◯✕曜日）
  week_of_period?: WeekOfMonth; // 第1、第2など
  weekday_of_week?: DayOfWeek; // 日曜日、月曜日など

  // 日付範囲条件
  date_conditions?: DateCondition[];
}

export interface RecurrenceRule {
  unit: RecurrenceUnit;
  interval: number; // 間隔（例：2週間なら2）

  // 週単位の特別設定
  days_of_week?: DayOfWeek[]; // 週単位の場合の曜日指定

  // 単位別詳細設定
  details?: RecurrenceDetails;

  // 補正条件
  adjustment?: RecurrenceAdjustment;

  // 終了条件
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
  is_range_date?: boolean; // 期日が範囲選択かどうか
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
  is_range_date?: boolean; // 期日が範囲選択かどうか
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
  order_index?: number;
  created_at: Date;
  updated_at: Date;
}

export interface Setting {
  id: string;
  key: string;
  value: string;
  data_type: 'string' | 'number' | 'boolean' | 'json';
  created_at: Date;
  updated_at: Date;
}

export interface Account {
  id: string;
  email?: string;
  display_name?: string;
  avatar_url?: string;
  provider: 'local' | 'google' | 'github' | 'microsoft';
  provider_id?: string;
  is_active: boolean;
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

// 検索条件用の型定義
export interface ProjectSearchCondition {
  name?: string;
  is_archived?: boolean;
  order_index?: number;
}

export interface TaskListSearchCondition {
  project_id?: string;
  name?: string;
  is_archived?: boolean;
  order_index?: number;
}

export interface TaskSearchCondition {
  list_id?: string;
  title?: string;
  status?: TaskStatus;
  priority?: number;
  is_archived?: boolean;
}

export interface SubTaskSearchCondition {
  task_id?: string;
  title?: string;
  status?: TaskStatus;
  priority?: number;
}

export interface TagSearchCondition {
  name?: string;
}
