/**
 * 統一繰り返し設定型定義
 *
 * この型はUI側とTauri側の両方で使用される統一型です。
 * 既存の複数のRecurrenceRule型を統合し、型安全性を確保します。
 */

import type { SvelteDate } from 'svelte/reactivity';

// 基本的な繰り返し単位
export type RecurrenceUnit =
  | 'minute'
  | 'hour'
  | 'day'
  | 'week'
  | 'month'
  | 'quarter'
  | 'halfyear'
  | 'year';

// 曜日
export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

// 月の詳細設定
export interface MonthlyDetails {
  /** 日付指定（1-31） */
  dayOfMonth?: number;
  /** 曜日指定（第1月曜日など） */
  weekOfMonth?: number;
  dayOfWeek?: DayOfWeek;
  /** 月末基準フラグ */
  fromEnd?: boolean;
}

// 年の詳細設定
export interface YearlyDetails {
  /** 月指定（1-12） */
  month: number;
  /** 日付指定（1-31） */
  dayOfMonth?: number;
  /** 曜日指定（第1月曜日など） */
  weekOfMonth?: number;
  dayOfWeek?: DayOfWeek;
}

// 単位別詳細設定
export type RecurrenceDetails = {
  monthly?: MonthlyDetails;
  yearly?: YearlyDetails;
};

// 補正条件
export interface RecurrenceAdjustment {
  /** 土日祝日の調整方法 */
  holidayAdjustment?: 'none' | 'skip' | 'before' | 'after';
  /** 月末日の調整方法 */
  monthEndAdjustment?: 'none' | 'lastDay' | 'before';
}

/**
 * 統一繰り返しルール型
 *
 * UI側とTauri側で共通使用される統一型定義
 */
export interface UnifiedRecurrenceRule {
  /** 一意識別子（オプショナル、新規作成時は自動生成） */
  id?: string;

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
  endDate?: Date | SvelteDate;

  /** 最大繰り返し回数 */
  maxOccurrences?: number;
}

/**
 * Tauri側との通信用RecurrenceRule型
 *
 * Tauri側に送信する際のシリアライズ形式
 */
export interface TauriRecurrenceRule {
  id: string;
  unit: string;
  interval: number;
  days_of_week?: string[];
  details?: string; // JSON文字列
  adjustment?: string; // JSON文字列
  end_date?: string; // ISO文字列
  max_occurrences?: number;
}

/**
 * 繰り返しルール関連付け（タスク用）
 */
export interface TaskRecurrence {
  taskId: string;
  recurrenceRuleId: string;
}

/**
 * 繰り返しルール関連付け（サブタスク用）
 */
export interface SubTaskRecurrence {
  subtaskId: string;
  recurrenceRuleId: string;
}