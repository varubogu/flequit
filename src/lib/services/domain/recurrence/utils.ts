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
 * 祝日集合の要素になる暦日キー。
 * ローカル年月日の `YYYY-MM-DD`。時刻やオフセットは含めない。
 */
export type HolidayDateSet = ReadonlySet<string>;

/**
 * ローカル暦日を祝日集合のキーへ変換する。
 */
export function toCalendarDateKey(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 祝日判定。
 *
 * 祝日カレンダーの保存先は未決定なので、平日の祝日は呼び出し側が渡す `holidays` だけを見る。
 * 土日は従来どおり常に祝日として扱う。祝日集合が空でも「次の祝日」の探索は週末で止まる。
 */
export function isHoliday(date: Date, holidays?: HolidayDateSet): boolean {
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return true;
  }
  return holidays?.has(toCalendarDateKey(date)) ?? false;
}
