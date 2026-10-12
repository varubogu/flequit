import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fromTauriRecurrenceRuleModel,
  toTauriRecurrenceRule,
  toTauriRecurrenceRuleCommandModel,
  toTauriRecurrenceRulePatchCommandModel
} from '$lib/utils/recurrence-converter-tauri';
import type { RecurrenceRule } from '$lib/types/recurrence';
import type { TauriRecurrenceRuleModel } from '$lib/types/recurrence-tauri';

const now = new Date('2024-06-01T00:00:00Z');

function rule(overrides: Partial<RecurrenceRule> = {}): RecurrenceRule {
  return {
    id: 'rule-1',
    unit: 'week',
    interval: 2,
    daysOfWeek: ['monday'],
    ...overrides
  };
}

describe('recurrence converter for Tauri', () => {
  beforeEach(() => {
    vi.stubGlobal('crypto', { randomUUID: () => 'generated-id' });
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('returns undefined for an empty unified rule and omits absent json fields', () => {
    expect(toTauriRecurrenceRule(null)).toBeUndefined();
    expect(toTauriRecurrenceRule(undefined)).toBeUndefined();

    const converted = toTauriRecurrenceRule(rule());
    expect(converted?.adjustment).toBeUndefined();
    expect(converted?.pattern).toBeUndefined();
    expect(converted?.unit).toBe('week');
  });

  it('stringifies adjustment and pattern when they are present', () => {
    const converted = toTauriRecurrenceRule(
      rule({
        adjustment: { dateConditions: [], weekdayConditions: [] },
        pattern: { extended: { weekly: { daysOfWeek: ['monday'] } } }
      })
    );

    expect(JSON.parse(converted!.adjustment!)).toEqual({ dateConditions: [], weekdayConditions: [] });
    expect(JSON.parse(converted!.pattern!).extended.weekly.daysOfWeek).toEqual(['monday']);
  });

  it('parses snake_case and camelCase adjustment payloads and rejects invalid json', () => {
    const model: TauriRecurrenceRuleModel = {
      id: 'rule-1',
      unit: 'day',
      interval: 1,
      endDate: '2024-12-31T00:00:00Z',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-02-01T00:00:00Z',
      details: JSON.stringify({ monthly: { dayOfMonth: 3 } }),
      adjustment: JSON.stringify({
        date_conditions: [{ id: 'd1' }],
        weekdayConditions: [{ id: 'w1' }]
      })
    };

    const parsed = fromTauriRecurrenceRuleModel(model);
    expect(parsed.endDate).toEqual(new Date('2024-12-31T00:00:00Z'));
    expect(parsed.createdAt).toEqual(new Date('2024-01-01T00:00:00Z'));
    expect(parsed.pattern).toEqual({ monthly: { dayOfMonth: 3 } });
    expect(parsed.adjustment).toEqual({
      dateConditions: [{ id: 'd1' }],
      weekdayConditions: [{ id: 'w1' }]
    });

    const camel = fromTauriRecurrenceRuleModel({
      ...model,
      endDate: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      details: undefined,
      adjustment: JSON.stringify({ dateConditions: [{ id: 'd2' }], weekday_conditions: [] })
    });
    expect(camel.endDate).toBeUndefined();
    expect(camel.pattern).toBeUndefined();
    expect(camel.adjustment?.dateConditions).toEqual([{ id: 'd2' }]);

    const broken = fromTauriRecurrenceRuleModel({
      ...model,
      details: '{',
      adjustment: 'not-json'
    });
    expect(broken.pattern).toBeUndefined();
    expect(broken.adjustment).toBeUndefined();
  });

  it('builds a command model and fills missing ids and timestamps', () => {
    const command = toTauriRecurrenceRuleCommandModel(rule({ id: undefined, adjustment: { dateConditions: undefined, weekdayConditions: undefined } }), 'user-1', now);

    expect(command.id).toBe('generated-id');
    expect(command.createdAt).toBe(now);
    expect(command.updatedAt).toBe(now);
    expect(command.details).toBeUndefined();
    const adjustment = JSON.parse(command.adjustment as string);
    expect(adjustment.date_conditions).toEqual([]);
    expect(adjustment.weekday_conditions).toEqual([]);
    expect(adjustment.updated_by).toBe('user-1');
  });

  it('keeps provided timestamps and omits adjustment when the rule has none', () => {
    const createdAt = new Date('2024-01-01T00:00:00Z');
    const command = toTauriRecurrenceRuleCommandModel(
      rule({ pattern: { monthly: {} }, createdAt, updatedAt: createdAt }),
      'user-1',
      now
    );

    expect(command.createdAt).toBe(createdAt);
    expect(command.updatedAt).toBe(createdAt);
    expect(JSON.parse(command.details as string)).toEqual({ monthly: {} });
    expect(command.adjustment).toBeUndefined();
  });

  it('copies only defined patch fields and clears pattern or adjustment with null', () => {
    const patch = toTauriRecurrenceRulePatchCommandModel(
      'rule-1',
      {
        unit: 'month',
        interval: 3,
        daysOfWeek: ['friday'],
        endDate: now,
        maxOccurrences: 4,
        pattern: { yearly: {} },
        adjustment: { dateConditions: [{ id: 'd1', relation: 'before' }], weekdayConditions: [] }
      },
      'user-1',
      now
    );

    expect(patch).toMatchObject({
      id: 'rule-1',
      unit: 'month',
      interval: 3,
      daysOfWeek: ['friday'],
      endDate: now,
      maxOccurrences: 4
    });
    expect(JSON.parse(patch.details as string)).toEqual({ yearly: {} });
    expect(JSON.parse(patch.adjustment as string).recurrence_rule_id).toBe('rule-1');

    const cleared = toTauriRecurrenceRulePatchCommandModel(
      'rule-1',
      { pattern: null, adjustment: null },
      'user-1',
      now
    );
    expect(cleared.details).toBeNull();
    expect(cleared.adjustment).toBeNull();
    expect(cleared.unit).toBeUndefined();
  });
});
