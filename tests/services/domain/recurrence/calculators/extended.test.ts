import { describe, expect, it } from 'vitest';
import {
  calculateExtendedHalfyearNext,
  calculateExtendedMonthlyNext,
  calculateExtendedQuarterlyNext,
  calculateExtendedWeeklyNext,
  calculateExtendedYearlyNext
} from '$lib/services/domain/recurrence/calculators/extended';
import type { RecurrenceRule } from '$lib/types/recurrence';

function rule(overrides: Partial<RecurrenceRule> = {}): RecurrenceRule {
  return { unit: 'month', interval: 1, ...overrides };
}

function ymd(date: Date | null): string | null {
  if (!date) return null;
  return `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()}`;
}

describe('extended recurrence calculators', () => {
  const base = new Date('2024-01-15T12:00:00Z');

  it('returns null when a pattern is missing or has no usable days', () => {
    expect(calculateExtendedWeeklyNext(base, rule({ unit: 'week' }))).toBeNull();
    expect(
      calculateExtendedWeeklyNext(base, rule({ pattern: { extended: { weekly: { daysOfWeek: [] } } } }))
    ).toBeNull();
    expect(calculateExtendedMonthlyNext(base, rule())).toBeNull();
    expect(
      calculateExtendedMonthlyNext(base, rule({ pattern: { extended: { monthly: { daysOfMonth: [] } } } }))
    ).toBeNull();
    expect(calculateExtendedQuarterlyNext(base, rule({ unit: 'quarter' }))).toBeNull();
    expect(calculateExtendedHalfyearNext(base, rule({ unit: 'halfyear' }))).toBeNull();
    expect(calculateExtendedYearlyNext(base, rule({ unit: 'year' }))).toBeNull();
    expect(
      calculateExtendedYearlyNext(base, rule({ pattern: { extended: { yearly: { months: [] } } } }))
    ).toBeNull();
  });

  it('moves weekly rules to the next requested weekday', () => {
    const sunday = new Date('2024-01-14T12:00:00Z');
    const next = calculateExtendedWeeklyNext(
      sunday,
      rule({
        unit: 'week',
        pattern: { extended: { weekly: { daysOfWeek: ['monday', 'friday'] } } }
      })
    );

    expect(next?.getUTCDay()).toBe(1);
    expect(ymd(next)).toBe('2024-1-15');
  });

  it('picks the next month day, clamps short months, and skips invalid numbers', () => {
    const laterThisMonth = calculateExtendedMonthlyNext(
      base,
      rule({ pattern: { extended: { monthly: { daysOfMonth: [20, 20, 1.5, 0, 32] } } } })
    );
    expect(ymd(laterThisMonth)).toBe('2024-1-20');

    const alreadyPassed = calculateExtendedMonthlyNext(
      base,
      rule({ pattern: { extended: { monthly: { daysOfMonth: [31] } } } })
    );
    expect(ymd(alreadyPassed)).toBe('2024-1-31');

    const february = calculateExtendedMonthlyNext(
      new Date('2024-02-01T12:00:00Z'),
      rule({ pattern: { extended: { monthly: { daysOfMonth: [31] } } } })
    );
    expect(ymd(february)).toBe('2024-2-29');
  });

  it('uses the first and last weekday of a month and ignores weeks outside 1-5', () => {
    const firstMonday = calculateExtendedMonthlyNext(
      new Date('2023-12-31T12:00:00Z'),
      rule({
        pattern: {
          extended: {
            monthly: {
              weeksOfMonth: [
                { week: 1, dayOfWeek: 'monday' },
                { week: 0, dayOfWeek: 'monday' },
                { week: 6, dayOfWeek: 'monday' }
              ]
            }
          }
        }
      })
    );
    expect(ymd(firstMonday)).toBe('2024-1-1');

    const lastFriday = calculateExtendedMonthlyNext(
      new Date('2024-01-31T12:00:00Z'),
      rule({
        pattern: { extended: { monthly: { weeksOfMonth: [{ week: 5, dayOfWeek: 'friday' }] } } }
      })
    );
    expect(ymd(lastFriday)).toBe('2024-2-23');
  });

  it('returns null when a zero interval never produces a later date', () => {
    const stuck = calculateExtendedMonthlyNext(
      new Date('2024-01-20T12:00:00Z'),
      rule({
        interval: 0,
        pattern: { extended: { monthly: { daysOfMonth: [1] } } }
      })
    );
    expect(stuck).toBeNull();
  });

  it('drops period weeks that land outside the period', () => {
    const outside = calculateExtendedQuarterlyNext(
      base,
      rule({
        unit: 'quarter',
        pattern: {
          extended: {
            quarterly: {
              weeksOfQuarter: [{ week: 20, dayOfWeek: 'monday' }]
            }
          }
        }
      })
    );
    expect(outside).toBeNull();
  });

  it('calculates quarterly and half-year dates, including offsets that fall outside the period', () => {
    const quarterly = calculateExtendedQuarterlyNext(
      base,
      rule({
        unit: 'quarter',
        pattern: {
          extended: {
            quarterly: {
              offsetMonths: [0, -1, 9],
              daysOfMonth: [20],
              weeksOfQuarter: [{ week: 20, dayOfWeek: 'monday' }]
            }
          }
        }
      })
    );
    expect(ymd(quarterly)).toBe('2024-1-20');

    const halfyear = calculateExtendedHalfyearNext(
      base,
      rule({
        unit: 'halfyear',
        pattern: {
          extended: {
            halfyear: {
              daysOfMonth: [10],
              weeksOfHalfyear: [{ week: 1, dayOfWeek: 'wednesday' }]
            }
          }
        }
      })
    );
    expect(halfyear).toBeInstanceOf(Date);
    expect(halfyear!.getTime()).toBeGreaterThan(base.getTime());
  });

  it('skips invalid yearly months and returns null when none remain', () => {
    const next = calculateExtendedYearlyNext(
      base,
      rule({
        unit: 'year',
        pattern: {
          extended: {
            yearly: {
              months: [
                { month: 0, daysOfMonth: [1] },
                { month: 13, daysOfMonth: [1] },
                { month: 1.5, daysOfMonth: [1] },
                {
                  month: 3,
                  daysOfMonth: [1],
                  weeksOfMonth: [{ week: 1, dayOfWeek: 'friday' }]
                }
              ]
            }
          }
        }
      })
    );
    expect(ymd(next)).toBe('2024-3-1');

    expect(
      calculateExtendedYearlyNext(
        base,
        rule({
          unit: 'year',
          pattern: { extended: { yearly: { months: [{ month: 0, daysOfMonth: [1] }] } } }
        })
      )
    ).toBeNull();
  });
});
