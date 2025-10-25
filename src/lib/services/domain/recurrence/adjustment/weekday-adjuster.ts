import type { WeekdayCondition, DayOfWeek } from '$lib/types/datetime-calendar';
import { dayOfWeekToNumber, isHoliday } from '../utils';

/**
 * 曜日条件をチェック
 */
export function checkWeekdayCondition(date: Date, condition: WeekdayCondition): boolean {
  const dayOfWeek = date.getDay();

  // 特定の曜日の場合
  if (
    ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].includes(
      condition.ifWeekday
    )
  ) {
    const targetDay = dayOfWeekToNumber(condition.ifWeekday as DayOfWeek);
    return dayOfWeek === targetDay;
  }

  // その他の条件（平日、休日、祝日、非祝日など）の場合
  switch (condition.ifWeekday) {
    case 'weekday':
      return dayOfWeek >= 1 && dayOfWeek <= 5; // 月曜日〜金曜日
    case 'weekend':
      return dayOfWeek === 0 || dayOfWeek === 6; // 日曜日・土曜日
    case 'holiday':
      return isHoliday(date);
    case 'non_holiday':
      return !isHoliday(date);
    case 'weekend_only':
      return dayOfWeek === 0 || dayOfWeek === 6; // 土日のみ
    case 'non_weekend':
      return dayOfWeek >= 1 && dayOfWeek <= 5; // 土日以外（平日）
    case 'weekend_holiday':
      return dayOfWeek === 0 || dayOfWeek === 6 || isHoliday(date); // 土日祝日
    case 'non_weekend_holiday':
      return dayOfWeek >= 1 && dayOfWeek <= 5 && !isHoliday(date); // 土日祝日以外
    default:
      return false;
  }
}

/**
 * 曜日補正を適用
 */
export function applyWeekdayAdjustment(date: Date, condition: WeekdayCondition): Date {
  let adjustedDate = new Date(date);
  const dayOfWeek = date.getDay();

  if (condition.thenTarget === 'specific_weekday' && condition.thenWeekday) {
    const targetWeekday = dayOfWeekToNumber(condition.thenWeekday);

    if (condition.thenDirection === 'next') {
      let daysToAdd = (targetWeekday - dayOfWeek + 7) % 7;
      if (daysToAdd === 0) daysToAdd = 7;
      adjustedDate.setDate(date.getDate() + daysToAdd);
    } else {
      let daysToSubtract = (dayOfWeek - targetWeekday + 7) % 7;
      if (daysToSubtract === 0) daysToSubtract = 7;
      adjustedDate.setDate(date.getDate() - daysToSubtract);
    }
  } else if (condition.thenTarget === 'weekday') {
    // 平日への移動
    adjustedDate = moveToWeekday(adjustedDate, condition.thenDirection);
  } else if (condition.thenTarget === 'weekend') {
    // 休日への移動
    adjustedDate = moveToWeekend(adjustedDate, condition.thenDirection);
  } else if (condition.thenTarget === 'holiday') {
    // 祝日への移動
    adjustedDate = moveToHoliday(adjustedDate, condition.thenDirection);
  } else if (condition.thenTarget === 'non_holiday') {
    // 非祝日への移動
    adjustedDate = moveToNonHoliday(adjustedDate, condition.thenDirection);
  } else if (condition.thenTarget === 'weekend_only') {
    // 土日のみへの移動
    adjustedDate = moveToWeekend(adjustedDate, condition.thenDirection);
  } else if (condition.thenTarget === 'non_weekend') {
    // 土日以外（平日）への移動
    adjustedDate = moveToWeekday(adjustedDate, condition.thenDirection);
  } else if (condition.thenTarget === 'weekend_holiday') {
    // 土日祝日への移動
    adjustedDate = moveToWeekendOrHoliday(adjustedDate, condition.thenDirection);
  } else if (condition.thenTarget === 'non_weekend_holiday') {
    // 土日祝日以外への移動
    adjustedDate = moveToNonWeekendHoliday(adjustedDate, condition.thenDirection);
  } else if (condition.thenDays) {
    const days = condition.thenDirection === 'next' ? condition.thenDays : -condition.thenDays;
    adjustedDate.setDate(date.getDate() + days);
  }

  return adjustedDate;
}

/**
 * 平日への移動
 */
function moveToWeekday(date: Date, direction: 'next' | 'previous'): Date {
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
function moveToWeekend(date: Date, direction: 'next' | 'previous'): Date {
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
 * 祝日への移動
 */
function moveToHoliday(date: Date, direction: 'next' | 'previous'): Date {
  const adjustedDate = new Date(date);
  const increment = direction === 'next' ? 1 : -1;

  while (true) {
    if (isHoliday(adjustedDate)) {
      break;
    }
    adjustedDate.setDate(adjustedDate.getDate() + increment);
  }

  return adjustedDate;
}

/**
 * 非祝日への移動
 */
function moveToNonHoliday(date: Date, direction: 'next' | 'previous'): Date {
  const adjustedDate = new Date(date);
  const increment = direction === 'next' ? 1 : -1;

  while (true) {
    if (!isHoliday(adjustedDate)) {
      break;
    }
    adjustedDate.setDate(adjustedDate.getDate() + increment);
  }

  return adjustedDate;
}

/**
 * 土日祝日への移動
 */
function moveToWeekendOrHoliday(date: Date, direction: 'next' | 'previous'): Date {
  const adjustedDate = new Date(date);
  const increment = direction === 'next' ? 1 : -1;

  while (true) {
    const dayOfWeek = adjustedDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6 || isHoliday(adjustedDate)) {
      break;
    }
    adjustedDate.setDate(adjustedDate.getDate() + increment);
  }

  return adjustedDate;
}

/**
 * 土日祝日以外への移動
 */
function moveToNonWeekendHoliday(date: Date, direction: 'next' | 'previous'): Date {
  const adjustedDate = new Date(date);
  const increment = direction === 'next' ? 1 : -1;

  while (true) {
    const dayOfWeek = adjustedDate.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5 && !isHoliday(adjustedDate)) {
      break;
    }
    adjustedDate.setDate(adjustedDate.getDate() + increment);
  }

  return adjustedDate;
}
