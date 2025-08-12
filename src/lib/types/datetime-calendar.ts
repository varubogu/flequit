
export type DayOfWeek = 'sunday' |
  'monday' |
  'tuesday' |
  'wednesday' |
  'thursday' |
  'friday' |
  'saturday';

export type WeekOfMonth = 'first' |
  'second' |
  'third' |
  'fourth' |
  'last';

export type AdjustmentDirection = 'previous' | 'next';

export type AdjustmentTarget = 'weekday' |
  'weekend' |
  'holiday' |
  'non_holiday' |
  'weekend_only' |
  'non_weekend' |
  'weekend_holiday' |
  'non_weekend_holiday' |
  'specific_weekday';

// 繰り返し機能の型定義
export type RecurrenceUnit = 'minute' |
  'hour' |
  'day' |
  'week' |
  'month' |
  'quarter' |
  'half_year' |
  'year';

export type RecurrenceLevel = 'disabled' |
  'enabled' |
  'advanced';

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

export type DateRelation = 'before' | 'on_or_before' | 'on_or_after' | 'after';
