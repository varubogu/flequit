/**
 * 繰り返し設定型変換ユーティリティ
 *
 * @deprecated 型統一により、このファイルの変換関数は不要になりました。
 * 直接 RecurrenceRule 型を使用してください。
 * 後方互換性のため、パススルー関数として残しています。
 */

import type { RecurrenceRule } from '$lib/types/recurrence';

/**
 * パススルー関数（後方互換性のため）
 * @deprecated 直接 RecurrenceRule を使用してください
 */
export function fromLegacyRecurrenceRule(
  rule: RecurrenceRule | null | undefined
): RecurrenceRule | undefined {
  // 型統一により、変換不要でそのまま返す
  return rule || undefined;
}

/**
 * パススルー関数（後方互換性のため）
 * @deprecated 直接 RecurrenceRule を使用してください
 */
export function toLegacyRecurrenceRule(
  rule: RecurrenceRule | null | undefined
): RecurrenceRule | undefined {
  // 型統一により、変換不要でそのまま返す
  return rule || undefined;
}

/**
 * バックエンド側RecurrenceRule型から統一型への変換
 * 注: 現在は統一型を使用しているため、この関数は実質的にパススルー
 */
export function fromBackendRecurrenceRule(
  backend: RecurrenceRule | null | undefined
): RecurrenceRule | undefined {
  if (!backend) return undefined;

  // 新しい統一型では既に正しい型なので、そのまま返す
  // 将来的に型変換が必要になった場合はここに追加
  return backend;
}

/**
 * Tauri送信用のRecurrenceRule型
 * adjustmentとpatternがJSON文字列化されている
 */
interface TauriRecurrenceRule extends Omit<RecurrenceRule, 'adjustment' | 'pattern'> {
  adjustment?: string;
  pattern?: string;
}

/**
 * 統一型からTauri送信用型への変換
 * adjustment と pattern をJSON文字列に変換します
 */
export function toTauriRecurrenceRule(
  unified: RecurrenceRule | null | undefined
): TauriRecurrenceRule | undefined {
  if (!unified) return undefined;

  // Tauri側ではadjustmentとpatternを文字列として期待しているため、JSON.stringifyする
  const tauriRule: TauriRecurrenceRule = {
    ...unified,
    adjustment: unified.adjustment ? JSON.stringify(unified.adjustment) : undefined,
    pattern: unified.pattern ? JSON.stringify(unified.pattern) : undefined
  };

  return tauriRule;
}

/**
//  * 統一型からTauri送信用型への変換
//  */
// export function toTauriRecurrenceRule(
//   unified: RecurrenceRule | null | undefined
// ): TauriRecurrenceRule | undefined {
//   if (!unified) return undefined;
//
//   // フロントエンド（小文字）からRust（大文字）へのマッピング
//   const unitMapping: Record<string, string> = {
//     'minute': 'Minute',
//     'hour': 'Hour',
//     'day': 'Day',
//     'week': 'Week',
//     'month': 'Month',
//     'quarter': 'Quarter',
//     'halfyear': 'HalfYear',
//     'halfyear': 'HalfYear',
//     'year': 'Year'
//   };
//
//   const tauri: TauriRecurrenceRule = {
//     id: unified.id || crypto.randomUUID(),
//     unit: unitMapping[unified.unit] || unified.unit,
//     interval: unified.interval,
//     days_of_week: unified.daysOfWeek,
//     max_occurrences: unified.maxOccurrences
//   };
//
//   // 終了日の変換
//   if (unified.endDate) {
//     if (unified.endDate instanceof SvelteDate) {
//       tauri.end_date = unified.endDate.toISOString();
//     } else if (unified.endDate instanceof Date) {
//       tauri.end_date = unified.endDate.toISOString();
//     }
//   }
//
//   // 詳細設定の変換
//   if (unified.pattern) {
//     tauri.details = JSON.stringify(unified.pattern);
//   }
//
//   // 補正条件の変換
//   if (unified.adjustment) {
//     tauri.adjustment = JSON.stringify(unified.adjustment);
//   }
//
//   return tauri;
// }
//
// /**
//  * Tauri受信用型から統一型への変換
//  */
// export function fromTauriRecurrenceRule(
//   tauri: TauriRecurrenceRule | null | undefined
// ): RecurrenceRule | undefined {
//   if (!tauri) return undefined;
//
//   // Rust（大文字）からフロントエンド（小文字）へのマッピング
//   const unitMapping: Record<string, RecurrenceUnit> = {
//     'Minute': 'minute',
//     'Hour': 'hour',
//     'Day': 'day',
//     'Week': 'week',
//     'Month': 'month',
//     'Quarter': 'quarter',
//     'HalfYear': 'halfyear',
//     'Year': 'year'
//   };
//
//   const unified: RecurrenceRule = {
//     id: tauri.id,
//     unit: unitMapping[tauri.unit] || tauri.unit as RecurrenceUnit,
//     interval: tauri.interval,
//     daysOfWeek: tauri.days_of_week as DayOfWeek[] | undefined,
//     maxOccurrences: tauri.max_occurrences
//   };
//
//   // 終了日の変換
//   if (tauri.end_date) {
//     unified.endDate = new Date(tauri.end_date);
//   }
//
//   // 詳細設定の変換
//   if (tauri.details) {
//     try {
//       unified.pattern = JSON.parse(tauri.details) as RecurrencePattern;
//     } catch (e) {
//       console.warn('Failed to parse tauri recurrence details:', e);
//     }
//   }
//
//   // 補正条件の変換
//   if (tauri.adjustment) {
//     try {
//       unified.adjustment = JSON.parse(tauri.adjustment) as RecurrenceAdjustment;
//     } catch (e) {
//       console.warn('Failed to parse tauri recurrence adjustment:', e);
//     }
//   }
//
//   return unified;
// }
//
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
