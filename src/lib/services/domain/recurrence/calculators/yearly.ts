import type { RecurrenceRule } from '$lib/types/datetime-calendar';

/**
 * 年単位の次回日付計算
 */
export function calculateYearlyNext(baseDate: Date, rule: RecurrenceRule): Date | null {
  const currentDate = new Date(baseDate);

  // デフォルト：同じ日付で来年
  currentDate.setFullYear(currentDate.getFullYear() + rule.interval);
  return currentDate;
}
