import type { RecurrenceRule } from '$lib/types/recurrence';

/**
 * パススルー関数（後方互換性のため）
 * @deprecated 直接 RecurrenceRule を使用してください
 */
export function fromLegacyRecurrenceRule(
  rule: RecurrenceRule | null | undefined
): RecurrenceRule | undefined {
  return rule || undefined;
}

/**
 * パススルー関数（後方互換性のため）
 * @deprecated 直接 RecurrenceRule を使用してください
 */
export function toLegacyRecurrenceRule(
  rule: RecurrenceRule | null | undefined
): RecurrenceRule | undefined {
  return rule || undefined;
}

/**
 * バックエンド側RecurrenceRule型から統一型への変換
 * 注: 現在は統一型を使用しているため、この関数は実質的にパススルー
 */
export function fromBackendRecurrenceRule(
  backend: RecurrenceRule | null | undefined
): RecurrenceRule | undefined {
  return backend || undefined;
}
