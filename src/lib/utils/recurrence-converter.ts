/**
 * 繰り返し設定型変換ユーティリティ
 *
 * 責務ごとの分割:
 * - `recurrence-converter-legacy.ts`: 互換パススルー変換
 * - `recurrence-converter-tauri.ts`: Tauri 通信向け変換
 * - `recurrence-converter-validation.ts`: バリデーション
 */

export {
  fromBackendRecurrenceRule,
  fromLegacyRecurrenceRule,
  toLegacyRecurrenceRule
} from './recurrence-converter-legacy';
export {
  fromTauriRecurrenceRuleModel,
  toTauriRecurrenceRule,
  toTauriRecurrenceRuleCommandModel,
  toTauriRecurrenceRulePatchCommandModel
} from './recurrence-converter-tauri';
export type { TauriRecurrenceRuleModel } from '$lib/types/recurrence-tauri';
export { validateRecurrenceRule } from './recurrence-converter-validation';
