import { describe, expect, it } from 'vitest';
import {
  adjustDateForCondition,
  checkDateCondition
} from '$lib/services/domain/recurrence/adjustment/date-adjuster';
import type { DateCondition, DateRelation } from '$lib/types/datetime-calendar';

function condition(relation: DateRelation, referenceDate?: Date): DateCondition {
  return { id: 'condition-1', relation, referenceDate };
}

describe('date adjuster', () => {
  const reference = new Date('2024-05-10T00:00:00Z');
  const before = new Date('2024-05-09T00:00:00Z');
  const after = new Date('2024-05-11T00:00:00Z');

  it('rejects a condition without a reference date', () => {
    expect(checkDateCondition(reference, condition('before'))).toBe(false);
    expect(adjustDateForCondition(reference, condition('before'))).toBe(reference);
  });

  it('checks and adjusts each relation, including dates that already satisfy it', () => {
    expect(checkDateCondition(before, condition('before', reference))).toBe(true);
    expect(checkDateCondition(reference, condition('before', reference))).toBe(false);
    expect(checkDateCondition(reference, condition('on_or_before', reference))).toBe(true);
    expect(checkDateCondition(after, condition('on_or_before', reference))).toBe(false);
    expect(checkDateCondition(reference, condition('on_or_after', reference))).toBe(true);
    expect(checkDateCondition(before, condition('on_or_after', reference))).toBe(false);
    expect(checkDateCondition(after, condition('after', reference))).toBe(true);
    expect(checkDateCondition(reference, condition('after', reference))).toBe(false);
    expect(checkDateCondition(reference, condition('same' as DateRelation, reference))).toBe(false);

    expect(adjustDateForCondition(after, condition('before', reference)).getTime()).toBe(
      reference.getTime() - 24 * 60 * 60 * 1000
    );
    expect(adjustDateForCondition(before, condition('before', reference))).toEqual(before);

    expect(adjustDateForCondition(after, condition('on_or_before', reference)).getTime()).toBe(
      reference.getTime()
    );
    expect(adjustDateForCondition(before, condition('on_or_before', reference))).toEqual(before);

    expect(adjustDateForCondition(before, condition('on_or_after', reference)).getTime()).toBe(
      reference.getTime()
    );
    expect(adjustDateForCondition(after, condition('on_or_after', reference))).toEqual(after);

    expect(adjustDateForCondition(reference, condition('after', reference)).getTime()).toBe(
      reference.getTime() + 24 * 60 * 60 * 1000
    );
    expect(adjustDateForCondition(after, condition('after', reference))).toEqual(after);

    expect(adjustDateForCondition(reference, condition('same' as DateRelation, reference))).toEqual(
      reference
    );
  });
});
