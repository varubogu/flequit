import type { DayOfWeek, RecurrenceRule } from '$lib/types/datetime-calendar';
import { dayOfWeekToNumber, getLastDayOfMonth } from '../utils';
import { calculateWeeklyNext } from './weekly';

const MAX_LOOKAHEAD_CYCLES = 48;

type WeekdayInMonth = {
  week: number;
  dayOfWeek: DayOfWeek;
};

type WeekdayInPeriod = {
  week: number;
  dayOfWeek: DayOfWeek;
};

function normalizeNumbers(values: number[] | undefined, min: number, max: number): number[] {
  if (!values || values.length === 0) return [];
  return [...new Set(values.filter((value) => Number.isInteger(value) && value >= min && value <= max))].sort(
    (a, b) => a - b
  );
}

function toMonthDayDate(baseDate: Date, year: number, monthIndex: number, dayOfMonth: number): Date {
  const monthBase = new Date(baseDate);
  monthBase.setFullYear(year, monthIndex, 1);
  const clampedDay = Math.min(dayOfMonth, getLastDayOfMonth(monthBase));
  monthBase.setDate(clampedDay);
  return monthBase;
}

function createWeekOfMonthDate(
  baseDate: Date,
  year: number,
  monthIndex: number,
  week: number,
  dayOfWeek: DayOfWeek
): Date | null {
  if (week < 1 || week > 5) return null;

  const targetDay = dayOfWeekToNumber(dayOfWeek);
  const monthStart = new Date(baseDate);
  monthStart.setFullYear(year, monthIndex, 1);

  if (week === 5) {
    const lastDay = getLastDayOfMonth(monthStart);
    const lastDate = new Date(monthStart);
    lastDate.setDate(lastDay);
    const daysBack = (lastDate.getDay() - targetDay + 7) % 7;
    lastDate.setDate(lastDay - daysBack);
    return lastDate;
  }

  const firstDayOfWeek = monthStart.getDay();
  let daysToAdd = (targetDay - firstDayOfWeek + 7) % 7;
  daysToAdd += (week - 1) * 7;

  const result = new Date(monthStart);
  result.setDate(1 + daysToAdd);
  return result.getMonth() === monthStart.getMonth() ? result : null;
}

function createWeekOfPeriodDate(
  periodStart: Date,
  periodLengthInMonths: number,
  week: number,
  dayOfWeek: DayOfWeek
): Date | null {
  if (week < 1) return null;

  const weekStart = new Date(periodStart);
  weekStart.setDate(periodStart.getDate() + (week - 1) * 7);

  const targetDay = dayOfWeekToNumber(dayOfWeek);
  const dayOffset = (targetDay - weekStart.getDay() + 7) % 7;
  const candidate = new Date(weekStart);
  candidate.setDate(weekStart.getDate() + dayOffset);

  const periodEnd = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + periodLengthInMonths);

  return candidate < periodEnd ? candidate : null;
}

function pickNextCandidate(baseDate: Date, candidates: Date[]): Date | null {
  const futureDates = candidates.filter((candidate) => candidate.getTime() > baseDate.getTime());
  if (futureDates.length === 0) return null;

  futureDates.sort((a, b) => a.getTime() - b.getTime());
  return futureDates[0];
}

export function calculateExtendedWeeklyNext(baseDate: Date, rule: RecurrenceRule): Date | null {
  const daysOfWeek = rule.pattern?.extended?.weekly?.daysOfWeek;
  if (!daysOfWeek || daysOfWeek.length === 0) {
    return null;
  }

  return calculateWeeklyNext(new Date(baseDate), { ...rule, daysOfWeek });
}

export function calculateExtendedMonthlyNext(baseDate: Date, rule: RecurrenceRule): Date | null {
  const pattern = rule.pattern?.extended?.monthly;
  if (!pattern) {
    return null;
  }

  const daysOfMonth = normalizeNumbers(pattern.daysOfMonth, 1, 31);
  const weeksOfMonth = (pattern.weeksOfMonth ?? []).filter(
    (entry): entry is WeekdayInMonth => entry.week >= 1 && entry.week <= 5
  );

  if (daysOfMonth.length === 0 && weeksOfMonth.length === 0) {
    return null;
  }

  for (let cycle = 0; cycle < MAX_LOOKAHEAD_CYCLES; cycle++) {
    const monthBase = new Date(baseDate);
    monthBase.setDate(1);
    monthBase.setMonth(monthBase.getMonth() + cycle * rule.interval);

    const year = monthBase.getFullYear();
    const monthIndex = monthBase.getMonth();
    const candidates: Date[] = [];

    daysOfMonth.forEach((day) => {
      candidates.push(toMonthDayDate(baseDate, year, monthIndex, day));
    });

    weeksOfMonth.forEach((entry) => {
      const candidate = createWeekOfMonthDate(baseDate, year, monthIndex, entry.week, entry.dayOfWeek);
      if (candidate) {
        candidates.push(candidate);
      }
    });

    const next = pickNextCandidate(baseDate, candidates);
    if (next) return next;
  }

  return null;
}

function calculateExtendedPeriodNext(
  baseDate: Date,
  intervalInMonths: number,
  periodLengthInMonths: number,
  offsetMonthsRaw: number[] | undefined,
  daysOfMonthRaw: number[] | undefined,
  weeksOfPeriodRaw: WeekdayInPeriod[] | undefined
): Date | null {
  const offsetUpper = periodLengthInMonths - 1;
  const offsetMonths = normalizeNumbers(offsetMonthsRaw, 0, offsetUpper);
  const daysOfMonth = normalizeNumbers(daysOfMonthRaw, 1, 31);
  const weeksOfPeriod = (weeksOfPeriodRaw ?? []).filter(
    (entry): entry is WeekdayInPeriod => entry.week >= 1
  );

  if (daysOfMonth.length === 0 && weeksOfPeriod.length === 0) {
    return null;
  }

  const normalizedOffsets = offsetMonths.length > 0 ? offsetMonths : [0];

  for (let cycle = 0; cycle < MAX_LOOKAHEAD_CYCLES; cycle++) {
    const periodStart = new Date(baseDate);
    periodStart.setDate(1);
    periodStart.setMonth(periodStart.getMonth() + cycle * intervalInMonths);

    const candidates: Date[] = [];

    normalizedOffsets.forEach((offsetMonth) => {
      const monthDate = new Date(periodStart);
      monthDate.setMonth(periodStart.getMonth() + offsetMonth);
      const year = monthDate.getFullYear();
      const monthIndex = monthDate.getMonth();
      daysOfMonth.forEach((day) => {
        candidates.push(toMonthDayDate(baseDate, year, monthIndex, day));
      });
    });

    weeksOfPeriod.forEach((entry) => {
      const candidate = createWeekOfPeriodDate(
        periodStart,
        periodLengthInMonths,
        entry.week,
        entry.dayOfWeek
      );
      if (candidate) {
        candidates.push(candidate);
      }
    });

    const next = pickNextCandidate(baseDate, candidates);
    if (next) return next;
  }

  return null;
}

export function calculateExtendedQuarterlyNext(baseDate: Date, rule: RecurrenceRule): Date | null {
  const pattern = rule.pattern?.extended?.quarterly;
  if (!pattern) {
    return null;
  }

  return calculateExtendedPeriodNext(
    baseDate,
    rule.interval * 3,
    3,
    pattern.offsetMonths,
    pattern.daysOfMonth,
    pattern.weeksOfQuarter
  );
}

export function calculateExtendedHalfyearNext(baseDate: Date, rule: RecurrenceRule): Date | null {
  const pattern = rule.pattern?.extended?.halfyear;
  if (!pattern) {
    return null;
  }

  return calculateExtendedPeriodNext(
    baseDate,
    rule.interval * 6,
    6,
    pattern.offsetMonths,
    pattern.daysOfMonth,
    pattern.weeksOfHalfyear
  );
}

export function calculateExtendedYearlyNext(baseDate: Date, rule: RecurrenceRule): Date | null {
  const pattern = rule.pattern?.extended?.yearly;
  const months = pattern?.months ?? [];
  if (months.length === 0) {
    return null;
  }

  for (let cycle = 0; cycle < MAX_LOOKAHEAD_CYCLES; cycle++) {
    const targetYear = baseDate.getFullYear() + cycle * rule.interval;
    const candidates: Date[] = [];

    months.forEach((monthPattern) => {
      if (!Number.isInteger(monthPattern.month) || monthPattern.month < 1 || monthPattern.month > 12) {
        return;
      }

      const monthIndex = monthPattern.month - 1;
      const daysOfMonth = normalizeNumbers(monthPattern.daysOfMonth, 1, 31);
      const weeksOfMonth = (monthPattern.weeksOfMonth ?? []).filter(
        (entry): entry is WeekdayInMonth => entry.week >= 1 && entry.week <= 5
      );

      daysOfMonth.forEach((day) => {
        candidates.push(toMonthDayDate(baseDate, targetYear, monthIndex, day));
      });

      weeksOfMonth.forEach((entry) => {
        const candidate = createWeekOfMonthDate(
          baseDate,
          targetYear,
          monthIndex,
          entry.week,
          entry.dayOfWeek
        );
        if (candidate) {
          candidates.push(candidate);
        }
      });
    });

    const next = pickNextCandidate(baseDate, candidates);
    if (next) return next;
  }

  return null;
}
