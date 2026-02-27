/**
 * 繰り返しルール型定義
 *
 * タスクやサブタスクの繰り返し設定を管理するための統一型定義。
 * すべての繰り返し関連の型をこのファイルに集約しています。
 */

import type { SvelteDate } from 'svelte/reactivity';
import type { DateCondition, WeekdayCondition } from './datetime-calendar';

// ========================================
// 基本列挙型
// ========================================

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
  | 'halfyear'
  | 'year';

/**
 * 曜日
 */
export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

// ========================================
// 詳細パターン定義
// ========================================

/**
 * 月次繰り返しパターン
 *
 * 例:
 * - 毎月15日: { dayOfMonth: 15 }
 * - 毎月第2金曜日: { weekOfMonth: 2, dayOfWeek: 'friday' }
 * - 毎月末日: { fromEnd: true }
 */
export interface MonthlyRecurrencePattern {
  /** 日付指定（1-31） */
  dayOfMonth?: number;
  /** 第N週指定（1-5） */
  weekOfMonth?: number;
  /** 曜日指定 */
  dayOfWeek?: DayOfWeek;
  /** 月末基準フラグ（true: 月末から数える） */
  fromEnd?: boolean;
}

/**
 * 年次繰り返しパターン
 *
 * 例:
 * - 毎年3月15日: { month: 3, dayOfMonth: 15 }
 * - 毎年11月第4木曜日: { month: 11, weekOfMonth: 4, dayOfWeek: 'thursday' }
 */
export interface YearlyRecurrencePattern {
  /** 月指定（1-12） */
  month: number;
  /** 日付指定（1-31） */
  dayOfMonth?: number;
  /** 第N週指定（1-5） */
  weekOfMonth?: number;
  /** 曜日指定 */
  dayOfWeek?: DayOfWeek;
}

/**
 * 月内の第N曜日指定
 */
export interface WeekdayInMonthPattern {
  /** 週番号（1-5） */
  week: number;
  /** 曜日 */
  dayOfWeek: DayOfWeek;
}

/**
 * 期間内の第N曜日指定
 */
export interface WeekdayInPeriodPattern {
  /** 週番号（1始まり） */
  week: number;
  /** 曜日 */
  dayOfWeek: DayOfWeek;
}

/**
 * 拡張週次パターン
 */
export interface ExtendedWeeklyPattern {
  /** 複数曜日指定 */
  daysOfWeek: DayOfWeek[];
  /** パターン単位の補正（将来用） */
  perPatternAdjustment?: RecurrenceAdjustment;
}

/**
 * 拡張月次パターン
 */
export interface ExtendedMonthlyPattern {
  /** 複数日付指定（1-31） */
  daysOfMonth?: number[];
  /** 複数の第N曜日指定 */
  weeksOfMonth?: WeekdayInMonthPattern[];
  /** パターン単位の補正（将来用） */
  perPatternAdjustment?: RecurrenceAdjustment;
}

/**
 * 拡張四半期パターン
 */
export interface ExtendedQuarterlyPattern {
  /** 四半期開始月からのオフセット（0-2） */
  offsetMonths?: number[];
  /** 対象月の日付指定（1-31） */
  daysOfMonth?: number[];
  /** 四半期開始週基準の第N曜日指定 */
  weeksOfQuarter?: WeekdayInPeriodPattern[];
  /** パターン単位の補正（将来用） */
  perPatternAdjustment?: RecurrenceAdjustment;
}

/**
 * 拡張半期パターン
 */
export interface ExtendedHalfyearPattern {
  /** 半期開始月からのオフセット（0-5） */
  offsetMonths?: number[];
  /** 対象月の日付指定（1-31） */
  daysOfMonth?: number[];
  /** 半期開始週基準の第N曜日指定 */
  weeksOfHalfyear?: WeekdayInPeriodPattern[];
  /** パターン単位の補正（将来用） */
  perPatternAdjustment?: RecurrenceAdjustment;
}

/**
 * 拡張年次の月指定
 */
export interface ExtendedYearlyMonthPattern {
  /** 月（1-12） */
  month: number;
  /** 対象月の日付指定（1-31） */
  daysOfMonth?: number[];
  /** 対象月の第N曜日指定 */
  weeksOfMonth?: WeekdayInMonthPattern[];
}

/**
 * 拡張年次パターン
 */
export interface ExtendedYearlyPattern {
  /** 複数月指定 */
  months?: ExtendedYearlyMonthPattern[];
  /** パターン単位の補正（将来用） */
  perPatternAdjustment?: RecurrenceAdjustment;
}

/**
 * 拡張会計年度の月指定（将来用）
 */
export interface ExtendedFiscalYearMonthPattern {
  /** 会計年度開始月からのオフセット */
  offset: number;
  /** 対象月の日付指定（1-31） */
  daysOfMonth?: number[];
  /** 対象月の第N曜日指定 */
  weeksOfMonth?: WeekdayInMonthPattern[];
}

/**
 * 拡張会計年度パターン（将来用）
 */
export interface ExtendedFiscalYearPattern {
  months?: ExtendedFiscalYearMonthPattern[];
  perPatternAdjustment?: RecurrenceAdjustment;
}

/**
 * 拡張パターン
 */
export interface ExtendedRecurrencePattern {
  weekly?: ExtendedWeeklyPattern;
  monthly?: ExtendedMonthlyPattern;
  quarterly?: ExtendedQuarterlyPattern;
  halfyear?: ExtendedHalfyearPattern;
  yearly?: ExtendedYearlyPattern;
  fiscalYear?: ExtendedFiscalYearPattern;
}

/**
 * 繰り返しパターン（月次・年次の詳細設定）
 */
export interface RecurrencePattern {
  /** 月次パターン */
  monthly?: MonthlyRecurrencePattern;
  /** 年次パターン */
  yearly?: YearlyRecurrencePattern;
  /** 拡張パターン */
  extended?: ExtendedRecurrencePattern;
}

// ========================================
// 補正ルール定義
// ========================================

/**
 * 繰り返し補正ルール
 *
 * 祝日や月末などの特殊ケースに対する調整方法を定義
 */
export interface RecurrenceAdjustment {
  /**
   * 祝日調整方法
   * - none: 調整しない
   * - skip: スキップ
   * - before: 前の平日に移動
   * - after: 後の平日に移動
   */
  holidayAdjustment?: 'none' | 'skip' | 'before' | 'after';

  /**
   * 月末調整方法
   * - none: 調整しない
   * - lastDay: 月末日に調整
   * - before: 前の有効日に移動
   */
  monthEndAdjustment?: 'none' | 'lastDay' | 'before';

  /**
   * 日付条件のリスト
   * UI層の高度な設定で使用される条件
   */
  dateConditions?: DateCondition[];

  /**
   * 曜日条件のリスト
   * UI層の高度な設定で使用される条件
   */
  weekdayConditions?: WeekdayCondition[];
}

// ========================================
// メイン繰り返しルール定義
// ========================================

/**
 * 繰り返しルール
 *
 * タスクやサブタスクの繰り返し設定を定義する統一型。
 * UI層、サービス層、Tauri通信すべてでこの型を使用します。
 *
 * 例:
 * - 毎週月曜日と金曜日:
 *   { unit: 'week', interval: 1, daysOfWeek: ['monday', 'friday'] }
 *
 * - 2週間ごと:
 *   { unit: 'week', interval: 2 }
 *
 * - 毎月15日:
 *   { unit: 'month', interval: 1, pattern: { monthly: { dayOfMonth: 15 } } }
 *
 * - 10回まで繰り返し:
 *   { unit: 'day', interval: 1, maxOccurrences: 10 }
 *
 * - 2025年12月31日まで:
 *   { unit: 'day', interval: 1, endDate: new Date('2025-12-31') }
 */
export interface RecurrenceRule {
  /** 一意識別子（新規作成時はオプショナル） */
  id?: string;

  /** 繰り返し単位 */
  unit: RecurrenceUnit;

  /** 繰り返し間隔（例: 2週間なら2） */
  interval: number;

  /** 週単位の場合の曜日指定 */
  daysOfWeek?: DayOfWeek[];

  /** 月次・年次の詳細パターン */
  pattern?: RecurrencePattern;

  /** 補正ルール */
  adjustment?: RecurrenceAdjustment;

  /** 繰り返し終了日 */
  endDate?: Date | SvelteDate;

  /** 最大繰り返し回数 */
  maxOccurrences?: number;

  /** 作成日時 */
  createdAt?: Date;

  /** 更新日時 */
  updatedAt?: Date;

  /** 削除フラグ（論理削除） */
  deleted?: boolean;

  /** 最終更新者のユーザーID */
  updatedBy?: string;
}

// ========================================
// 検索条件型
// ========================================

/**
 * 繰り返しルール検索条件
 *
 * データベース検索時の絞り込み条件として使用
 */
export interface RecurrenceRuleSearchCondition {
  /** 繰り返し単位での絞り込み */
  unit?: RecurrenceUnit;
  /** 繰り返し間隔での絞り込み */
  interval?: number;
  /** 終了日での絞り込み */
  endDate?: Date;
  /** 最大回数での絞り込み */
  maxOccurrences?: number;
}

// ========================================
// パッチ型（部分更新用）
// ========================================

/**
 * 繰り返しルールパッチ型
 *
 * 部分更新時に使用。すべてのフィールドがオプショナル。
 */
export type RecurrenceRulePatch = Partial<RecurrenceRule>;
