import type { RecurrenceRule } from '$lib/types/datetime-calendar';
import { dayOfWeekToNumber, getLastDayOfMonth } from '../utils';

/**
 * 月単位の次回日付計算
 */
export function calculateMonthlyNext(baseDate: Date, rule: RecurrenceRule): Date | null {
  const currentDate = new Date(baseDate);

  // 新しい詳細設定を使用
  if (rule.pattern?.monthly?.dayOfMonth) {
    // 特定の日付指定
    currentDate.setMonth(currentDate.getMonth() + rule.interval);
    currentDate.setDate(Math.min(rule.pattern.monthly.dayOfMonth, getLastDayOfMonth(currentDate)));
    return currentDate;
  }

  if (rule.pattern?.monthly?.weekOfMonth && rule.pattern?.monthly?.dayOfWeek) {
    // 第X曜日指定（例：第2日曜日）
    return calculateWeekOfMonth(currentDate, rule);
  }

  // デフォルト：同じ日付で次月
  currentDate.setMonth(currentDate.getMonth() + rule.interval);
  return currentDate;
}

/**
 * 第X曜日の計算（例：第2日曜日）
 */
export function calculateWeekOfMonth(baseDate: Date, rule: RecurrenceRule): Date | null {
  if (!rule.pattern?.monthly?.weekOfMonth || !rule.pattern?.monthly?.dayOfWeek) {
    return null;
  }

  const targetDay = dayOfWeekToNumber(rule.pattern.monthly.dayOfWeek);
  const nextMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + rule.interval, 1);

  // 統一型では weekOfMonth は 1-5 の数値
  const weekNumber = rule.pattern.monthly.weekOfMonth;

  if (weekNumber === 5) {
    // 第5週 = 最後の曜日として扱う
    const lastDay = getLastDayOfMonth(nextMonth);
    const lastDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), lastDay);
    const lastDayOfWeek = lastDate.getDay();

    let daysBack = (lastDayOfWeek - targetDay + 7) % 7;
    if (daysBack === 0 && lastDayOfWeek !== targetDay) {
      daysBack = 7;
    }

    lastDate.setDate(lastDay - daysBack);
    return lastDate;
  }

  // 第1-4週
  const firstDay = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1);
  const firstDayOfWeek = firstDay.getDay();

  // その月の最初の対象曜日を見つける
  let daysToAdd = (targetDay - firstDayOfWeek + 7) % 7;
  // 指定された週まで進める
  daysToAdd += (weekNumber - 1) * 7;

  const resultDate = new Date(firstDay);
  resultDate.setDate(1 + daysToAdd);

  // 月をまたいでいないかチェック
  if (resultDate.getMonth() !== nextMonth.getMonth()) {
    return null;
  }

  return resultDate;
}
