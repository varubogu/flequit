import type { RecurrenceRule } from '$lib/types/recurrence';

function hasValues(values: unknown[] | undefined): boolean {
  return Array.isArray(values) && values.length > 0;
}

/**
 * 繰り返しルールのバリデーション
 */
export function validateRecurrenceRule(rule: RecurrenceRule): string[] {
  const errors: string[] = [];

  if (!rule.unit) {
    errors.push('繰り返し単位が指定されていません');
  }

  if (!rule.interval || rule.interval < 1) {
    errors.push('繰り返し間隔は1以上である必要があります');
  }

  const extendedWeeklyDays = rule.pattern?.extended?.weekly?.daysOfWeek;
  if (
    rule.unit === 'week' &&
    (!rule.daysOfWeek || rule.daysOfWeek.length === 0) &&
    (!extendedWeeklyDays || extendedWeeklyDays.length === 0)
  ) {
    errors.push('週単位の場合は曜日の指定が必要です');
  }

  if (rule.maxOccurrences && rule.maxOccurrences < 1) {
    errors.push('最大繰り返し回数は1以上である必要があります');
  }

  if (rule.endDate && rule.endDate < new Date()) {
    errors.push('終了日は現在日時より後である必要があります');
  }

  const extended = rule.pattern?.extended;
  if (extended) {
    const monthly = extended.monthly;
    if (
      monthly &&
      !hasValues(monthly.daysOfMonth) &&
      !hasValues(monthly.weeksOfMonth as unknown[] | undefined)
    ) {
      errors.push('拡張月次パターンでは daysOfMonth または weeksOfMonth の指定が必要です');
    }

    const quarterly = extended.quarterly;
    if (
      quarterly &&
      !hasValues(quarterly.daysOfMonth) &&
      !hasValues(quarterly.weeksOfQuarter as unknown[] | undefined)
    ) {
      errors.push('拡張四半期パターンでは daysOfMonth または weeksOfQuarter の指定が必要です');
    }

    const halfyear = extended.halfyear;
    if (
      halfyear &&
      !hasValues(halfyear.daysOfMonth) &&
      !hasValues(halfyear.weeksOfHalfyear as unknown[] | undefined)
    ) {
      errors.push('拡張半期パターンでは daysOfMonth または weeksOfHalfyear の指定が必要です');
    }

    const yearly = extended.yearly;
    if (yearly && (!yearly.months || yearly.months.length === 0)) {
      errors.push('拡張年次パターンでは months の指定が必要です');
    }
  }

  return errors;
}
