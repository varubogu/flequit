import type { AdjustmentDirection } from '$lib/types/datetime-calendar';
import { isHoliday, type HolidayDateSet } from '../utils';

/**
 * 平日への移動
 */
export function moveToWeekday(date: Date, direction: AdjustmentDirection): Date {
  const adjustedDate = new Date(date);
  const increment = direction === 'next' ? 1 : -1;

  while (true) {
    const dayOfWeek = adjustedDate.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      // 月曜日〜金曜日
      break;
    }
    adjustedDate.setDate(adjustedDate.getDate() + increment);
  }

  return adjustedDate;
}

/**
 * 休日（土日）への移動
 */
export function moveToWeekend(date: Date, direction: AdjustmentDirection): Date {
  const adjustedDate = new Date(date);
  const increment = direction === 'next' ? 1 : -1;

  while (true) {
    const dayOfWeek = adjustedDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // 日曜日または土曜日
      break;
    }
    adjustedDate.setDate(adjustedDate.getDate() + increment);
  }

  return adjustedDate;
}

/**
 * 祝日への移動。
 * 土日は常に祝日なので、平日祝日が集合に無くても探索は週末までで止まる。
 */
export function moveToHoliday(
  date: Date,
  direction: AdjustmentDirection,
  holidays?: HolidayDateSet
): Date {
  const adjustedDate = new Date(date);
  const increment = direction === 'next' ? 1 : -1;

  while (true) {
    if (isHoliday(adjustedDate, holidays)) {
      break;
    }
    adjustedDate.setDate(adjustedDate.getDate() + increment);
  }

  return adjustedDate;
}

/**
 * 非祝日への移動
 */
export function moveToNonHoliday(
  date: Date,
  direction: AdjustmentDirection,
  holidays?: HolidayDateSet
): Date {
  const adjustedDate = new Date(date);
  const increment = direction === 'next' ? 1 : -1;

  while (true) {
    if (!isHoliday(adjustedDate, holidays)) {
      break;
    }
    adjustedDate.setDate(adjustedDate.getDate() + increment);
  }

  return adjustedDate;
}

/**
 * 土日祝日への移動
 */
export function moveToWeekendOrHoliday(
  date: Date,
  direction: AdjustmentDirection,
  holidays?: HolidayDateSet
): Date {
  const adjustedDate = new Date(date);
  const increment = direction === 'next' ? 1 : -1;

  while (true) {
    const dayOfWeek = adjustedDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6 || isHoliday(adjustedDate, holidays)) {
      break;
    }
    adjustedDate.setDate(adjustedDate.getDate() + increment);
  }

  return adjustedDate;
}

/**
 * 土日祝日以外への移動
 */
export function moveToNonWeekendHoliday(
  date: Date,
  direction: AdjustmentDirection,
  holidays?: HolidayDateSet
): Date {
  const adjustedDate = new Date(date);
  const increment = direction === 'next' ? 1 : -1;

  while (true) {
    const dayOfWeek = adjustedDate.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5 && !isHoliday(adjustedDate, holidays)) {
      break;
    }
    adjustedDate.setDate(adjustedDate.getDate() + increment);
  }

  return adjustedDate;
}
