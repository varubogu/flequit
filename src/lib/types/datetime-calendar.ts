/**
 * 曜日の列挙型
 */
export type DayOfWeek =
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday';

/**
 * 月内の週指定（第1週、第2週など）
 */
export type WeekOfMonth = 'first' | 'second' | 'third' | 'fourth' | 'last';

/**
 * 調整方向（前または後）
 */
export type AdjustmentDirection = 'previous' | 'next';

/**
 * 調整対象の種別
 */
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

/**
 * 繰り返し単位
 */
export type RecurrenceUnit =
  | 'minute'
  | 'hour'
  | 'day'
  | 'week'
  | 'month'
  | 'quarter'
  | 'half_year'
  | 'year';

/**
 * 繰り返し機能のレベル
 */
export type RecurrenceLevel = 'disabled' | 'enabled' | 'advanced';

/**
 * 日付条件（◯日より前/以前/以降/より後）
 */
export interface DateCondition {
  /** 条件ID */
  id: string;
  /** 日付の関係（より前/以前/以降/より後） */
  relation: DateRelation;
  /** 基準日 */
  referenceDate: Date;
}

/**
 * 曜日条件（◯曜日なら～）
 */
export interface WeekdayCondition {
  /** 条件ID */
  id: string;
  /** この曜日・種別なら */
  ifWeekday: DayOfWeek | AdjustmentTarget;
  /** 前/後に移動する方向 */
  thenDirection: AdjustmentDirection;
  /** 移動先の種別（平日/休日/祝日/特定曜日） */
  thenTarget: AdjustmentTarget;
  /** 特定曜日を指定する場合の曜日 */
  thenWeekday?: DayOfWeek;
  /** 日数を指定する場合の日数 */
  thenDays?: number;
}

/**
 * 繰り返しの補正条件
 */
export interface RecurrenceAdjustment {
  /** 日付条件のリスト */
  dateConditions: DateCondition[];
  /** 曜日条件のリスト */
  weekdayConditions: WeekdayCondition[];
}

/**
 * 繰り返し詳細設定
 */
export interface RecurrenceDetails {
  /** 特定日付指定（例：毎月15日） */
  specificDate?: number;

  /** 週指定（第◯週） */
  weekOfPeriod?: WeekOfMonth;
  /** 週指定の曜日（第◯✕曜日） */
  weekdayOfWeek?: DayOfWeek;

  /** 日付範囲条件 */
  dateConditions?: DateCondition[];
}

/**
 * 繰り返しルール
 */
export interface RecurrenceRule {
  /** 繰り返し単位 */
  unit: RecurrenceUnit;
  /** 繰り返し間隔（例：2週間なら2） */
  interval: number;

  /** 週単位の場合の曜日指定 */
  daysOfWeek?: DayOfWeek[];

  /** 単位別詳細設定 */
  details?: RecurrenceDetails;

  /** 補正条件 */
  adjustment?: RecurrenceAdjustment;

  /** 繰り返し終了日 */
  endDate?: Date;
  /** 最大繰り返し回数 */
  maxOccurrences?: number;
}

/**
 * 日付の関係性
 */
export type DateRelation = 'before' | 'on_or_before' | 'on_or_after' | 'after';
