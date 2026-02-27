import type { RecurrenceAdjustment, RecurrenceRule, RecurrenceRulePatch } from '$lib/types/recurrence';
import type { TauriRecurrenceRuleModel } from '$lib/types/recurrence-tauri';

export interface TauriRecurrenceRule extends Omit<RecurrenceRule, 'adjustment' | 'pattern'> {
  adjustment?: string;
  pattern?: string;
}

type RecurrenceAdjustmentCommandModel = {
  id: string;
  recurrence_rule_id: string;
  date_conditions: unknown[];
  weekday_conditions: unknown[];
  created_at: string;
  updated_at: string;
  deleted: boolean;
  updated_by: string;
};

function parseJson<T>(value: string, fieldName: string): T | undefined {
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.error(`[recurrence-converter] Failed to parse ${fieldName}:`, error);
    return undefined;
  }
}

function createAdjustmentCommandModel(
  recurrenceRuleId: string,
  adjustment: RecurrenceAdjustment,
  userId: string,
  now: Date
): RecurrenceAdjustmentCommandModel {
  const nowIso = now.toISOString();
  return {
    id: crypto.randomUUID(),
    recurrence_rule_id: recurrenceRuleId,
    date_conditions: adjustment.dateConditions || [],
    weekday_conditions: adjustment.weekdayConditions || [],
    created_at: nowIso,
    updated_at: nowIso,
    deleted: false,
    updated_by: userId
  };
}

function toAdjustment(value: string): RecurrenceAdjustment | undefined {
  const parsed = parseJson<Record<string, unknown>>(value, 'adjustment');
  if (!parsed) return undefined;

  const dateConditions = (
    parsed.date_conditions ??
    parsed.dateConditions ??
    []
  ) as RecurrenceAdjustment['dateConditions'];
  const weekdayConditions = (
    parsed.weekday_conditions ??
    parsed.weekdayConditions ??
    []
  ) as RecurrenceAdjustment['weekdayConditions'];

  return {
    dateConditions,
    weekdayConditions
  };
}

/**
 * 統一型からTauri送信用型への変換
 * adjustment と pattern をJSON文字列に変換します
 */
export function toTauriRecurrenceRule(
  unified: RecurrenceRule | null | undefined
): TauriRecurrenceRule | undefined {
  if (!unified) return undefined;

  return {
    ...unified,
    adjustment: unified.adjustment ? JSON.stringify(unified.adjustment) : undefined,
    pattern: unified.pattern ? JSON.stringify(unified.pattern) : undefined
  };
}

export function fromTauriRecurrenceRuleModel(
  tauriModel: TauriRecurrenceRuleModel
): RecurrenceRule {
  const rule: RecurrenceRule = {
    id: tauriModel.id,
    unit: tauriModel.unit,
    interval: tauriModel.interval,
    daysOfWeek: tauriModel.daysOfWeek,
    endDate: tauriModel.endDate ? new Date(tauriModel.endDate) : undefined,
    maxOccurrences: tauriModel.maxOccurrences,
    createdAt: tauriModel.createdAt ? new Date(tauriModel.createdAt) : undefined,
    updatedAt: tauriModel.updatedAt ? new Date(tauriModel.updatedAt) : undefined,
    deleted: tauriModel.deleted,
    updatedBy: tauriModel.updatedBy
  };

  if (tauriModel.details) {
    const pattern = parseJson<RecurrenceRule['pattern']>(tauriModel.details, 'details');
    if (pattern) {
      rule.pattern = pattern;
    }
  }

  if (tauriModel.adjustment) {
    const adjustment = toAdjustment(tauriModel.adjustment);
    if (adjustment) {
      rule.adjustment = adjustment;
    }
  }

  return rule;
}

export function toTauriRecurrenceRuleCommandModel(
  rule: RecurrenceRule,
  userId: string,
  now: Date = new Date()
): Record<string, unknown> {
  const ruleId = rule.id || crypto.randomUUID();

  return {
    id: ruleId,
    unit: rule.unit,
    interval: rule.interval,
    daysOfWeek: rule.daysOfWeek,
    details: rule.pattern ? JSON.stringify(rule.pattern) : undefined,
    adjustment: rule.adjustment
      ? JSON.stringify(createAdjustmentCommandModel(ruleId, rule.adjustment, userId, now))
      : undefined,
    endDate: rule.endDate,
    maxOccurrences: rule.maxOccurrences,
    createdAt: rule.createdAt || now,
    updatedAt: rule.updatedAt || now,
    deleted: false,
    updatedBy: userId
  };
}

export function toTauriRecurrenceRulePatchCommandModel(
  ruleId: string,
  patch: RecurrenceRulePatch,
  userId: string,
  now: Date = new Date()
): Record<string, unknown> {
  const patchForTauri: Record<string, unknown> = {
    id: ruleId
  };

  if (patch.unit !== undefined) patchForTauri.unit = patch.unit;
  if (patch.interval !== undefined) patchForTauri.interval = patch.interval;
  if (patch.daysOfWeek !== undefined) patchForTauri.daysOfWeek = patch.daysOfWeek;
  if (patch.endDate !== undefined) patchForTauri.endDate = patch.endDate;
  if (patch.maxOccurrences !== undefined) patchForTauri.maxOccurrences = patch.maxOccurrences;

  if (patch.pattern !== undefined) {
    patchForTauri.details = patch.pattern ? JSON.stringify(patch.pattern) : null;
  }

  if (patch.adjustment !== undefined) {
    patchForTauri.adjustment = patch.adjustment
      ? JSON.stringify(createAdjustmentCommandModel(ruleId, patch.adjustment, userId, now))
      : null;
  }

  return patchForTauri;
}
