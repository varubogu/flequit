import type { RecurrenceRule } from './recurrence';

/**
 * Tauri command model payload for recurrence rules.
 *
 * NOTE:
 * - This mirrors Rust `RecurrenceRuleCommandModel` field names after serde camelCase.
 * - `src/lib/types/bindings.ts` does not currently include recurrence command types.
 * - Once Specta emits recurrence command models, replace this with bindings-based types.
 */
export type TauriRecurrenceRuleModel = {
  id: string;
  unit: RecurrenceRule['unit'];
  interval: number;
  daysOfWeek?: RecurrenceRule['daysOfWeek'];
  details?: string;
  adjustment?: string;
  endDate?: string;
  maxOccurrences?: number;
  createdAt?: string;
  updatedAt?: string;
  deleted?: boolean;
  updatedBy?: string;
};
