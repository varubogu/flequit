import type { RecurrenceRule } from '$lib/types/datetime-calendar';

/**
 * 繰り返し終了条件をチェック
 */
export function shouldEndRecurrence(date: Date, rule: RecurrenceRule): boolean {
  if (rule.endDate && date > rule.endDate) {
    return true;
  }

  // max_occurrencesの実装は実際の実行回数を追跡する必要があるため、
  // ここでは簡略化してfalseを返す
  return false;
}
