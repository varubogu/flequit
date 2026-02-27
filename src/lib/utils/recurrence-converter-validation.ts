import type { RecurrenceRule } from '$lib/types/recurrence';

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

  if (rule.unit === 'week' && (!rule.daysOfWeek || rule.daysOfWeek.length === 0)) {
    errors.push('週単位の場合は曜日の指定が必要です');
  }

  if (rule.maxOccurrences && rule.maxOccurrences < 1) {
    errors.push('最大繰り返し回数は1以上である必要があります');
  }

  if (rule.endDate && rule.endDate < new Date()) {
    errors.push('終了日は現在日時より後である必要があります');
  }

  return errors;
}
