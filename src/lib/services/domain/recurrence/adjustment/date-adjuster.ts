import type { DateCondition } from '$lib/types/datetime-calendar';

/**
 * 日付条件をチェック
 */
export function checkDateCondition(date: Date, condition: DateCondition): boolean {
  if (!condition.referenceDate) {
    return false;
  }
  const refDate = new Date(condition.referenceDate);

  switch (condition.relation) {
    case 'before':
      return date < refDate;
    case 'on_or_before':
      return date <= refDate;
    case 'on_or_after':
      return date >= refDate;
    case 'after':
      return date > refDate;
    default:
      return false;
  }
}

/**
 * 日付条件に基づいて日付を調整
 */
export function adjustDateForCondition(date: Date, condition: DateCondition): Date {
  if (!condition.referenceDate) {
    return date;
  }
  const refDate = new Date(condition.referenceDate);
  const adjustedDate = new Date(date);

  switch (condition.relation) {
    case 'before':
      // 参照日より前にする必要がある場合、参照日の前日に設定
      if (date >= refDate) {
        adjustedDate.setTime(refDate.getTime() - 24 * 60 * 60 * 1000);
      }
      break;
    case 'on_or_before':
      // 参照日以前にする必要がある場合、参照日に設定
      if (date > refDate) {
        adjustedDate.setTime(refDate.getTime());
      }
      break;
    case 'on_or_after':
      // 参照日以降にする必要がある場合、参照日に設定
      if (date < refDate) {
        adjustedDate.setTime(refDate.getTime());
      }
      break;
    case 'after':
      // 参照日より後にする必要がある場合、参照日の翌日に設定
      if (date <= refDate) {
        adjustedDate.setTime(refDate.getTime() + 24 * 60 * 60 * 1000);
      }
      break;
  }

  return adjustedDate;
}
