import type { DayOfWeek, WeekOfMonth } from '$lib/types/datetime-calendar';

/**
 * 繰り返し計算で使用する共通ユーティリティ関数
 */

/**
 * 曜日文字列を数値に変換（0=日曜日）
 */
export function dayOfWeekToNumber(day: DayOfWeek): number {
  const mapping: Record<DayOfWeek, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6
  };
  return mapping[day];
}

/**
 * 週番号文字列を数値に変換
 */
export function weekOfMonthToNumber(week: WeekOfMonth): number {
  const mapping: Record<WeekOfMonth, number> = {
    first: 1,
    second: 2,
    third: 3,
    fourth: 4,
    last: -1 // 特別扱い
  };
  return mapping[week];
}

/**
 * 月の最後の日を取得
 */
export function getLastDayOfMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/**
 * 祝日判定（簡略化実装）
 * 実際の実装では祝日カレンダーAPIやライブラリを使用
 */
export function isHoliday(date: Date): boolean {
  // 土日を祝日として扱う簡略化実装
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
}
