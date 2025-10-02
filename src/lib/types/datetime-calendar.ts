// DayOfWeek, RecurrenceUnit, RecurrenceRule は recurrence.ts に統一されました
import type { DayOfWeek } from './recurrence';
export type { DayOfWeek, RecurrenceUnit, RecurrenceRule } from './recurrence';

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
  referenceDate?: Date;
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
 * 日付の関係性
 */
export type DateRelation = 'before' | 'on_or_before' | 'on_or_after' | 'after';

/**
 * 繰り返し詳細設定（UI層で使用）
 * @deprecated この型は後方互換性のために残されています
 * 新しいコードでは RecurrencePattern を使用してください
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
