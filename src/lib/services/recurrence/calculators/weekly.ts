import type { RecurrenceRule } from '$lib/types/datetime-calendar';
import { dayOfWeekToNumber } from '../utils';

/**
 * 週単位の次回日付計算
 */
export function calculateWeeklyNext(baseDate: Date, rule: RecurrenceRule): Date | null {
  if (!rule.daysOfWeek || rule.daysOfWeek.length === 0) {
    // 曜日指定がない場合は通常の週間隔
    baseDate.setDate(baseDate.getDate() + rule.interval * 7);
    return baseDate;
  }

  const targetDays = rule.daysOfWeek.map((day) => dayOfWeekToNumber(day));
  const currentDay = baseDate.getDay();

  // 今週の残りの対象曜日を探す
  const remainingDaysThisWeek = targetDays.filter((day) => day > currentDay);

  if (remainingDaysThisWeek.length > 0) {
    // 今週にまだ対象曜日がある
    const nextDay = Math.min(...remainingDaysThisWeek);
    baseDate.setDate(baseDate.getDate() + (nextDay - currentDay));
    return baseDate;
  }

  // 次の対象週の最初の曜日
  const weeksToAdd = rule.interval;
  const nextTargetDay = Math.min(...targetDays);
  const daysToAdd = weeksToAdd * 7 + (nextTargetDay - currentDay);

  baseDate.setDate(baseDate.getDate() + daysToAdd);
  return baseDate;
}
