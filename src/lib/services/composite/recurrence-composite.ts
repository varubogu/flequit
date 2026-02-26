/**
 * 後方互換性のための再エクスポート
 * 実装は src/lib/services/domain/recurrence/ 配下にモジュール化されています
 */
export { RecurrenceDateCalculator } from '../domain/recurrence/recurrence-service';
/**
 * @deprecated Use RecurrenceDateCalculator instead. Removal target: 2026-06-30.
 */
export { RecurrenceService } from '../domain/recurrence/recurrence-service';
