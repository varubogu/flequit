import { describe, expect, it } from 'vitest';
import { isHoliday, toCalendarDateKey } from '$lib/services/domain/recurrence/utils';

describe('recurrence holiday calendar', () => {
  it('ローカルの年月日をゼロ埋めしたキーにする', () => {
    expect(toCalendarDateKey(new Date(2025, 0, 2, 23, 45))).toBe('2025-01-02');
    expect(toCalendarDateKey(new Date(2025, 1, 11, 0, 30))).toBe('2025-02-11');
  });

  it('祝日集合を渡さない平日は祝日ではない', () => {
    expect(isHoliday(new Date(2025, 1, 11))).toBe(false);
    expect(isHoliday(new Date(2025, 1, 11), new Set())).toBe(false);
  });

  it('集合にある平日だけを祝日にする', () => {
    const holidays = new Set(['2025-02-11']);

    expect(isHoliday(new Date(2025, 1, 11, 18, 0), holidays)).toBe(true);
    expect(isHoliday(new Date(2025, 1, 12), holidays)).toBe(false);
  });

  it('日時文字列のキーは平日祝日に一致しない', () => {
    expect(isHoliday(new Date(2025, 1, 11), new Set(['2025-02-11T00:00:00']))).toBe(false);
  });

  it('集合に無くても土日は祝日のまま', () => {
    const holidays = new Set(['2025-02-11']);

    expect(isHoliday(new Date(2025, 1, 15), holidays)).toBe(true);
    expect(isHoliday(new Date(2025, 1, 16), holidays)).toBe(true);
  });
});
