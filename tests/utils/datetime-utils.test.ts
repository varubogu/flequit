import { test, expect, describe, vi } from 'vitest';
import {
  formatDate,
  formatDateTime,
  formatDateForInput,
  formatDetailedDate,
  getDueDateClass,
  formatDateTimeRange,
  formatDate1,
  formatTime1,
  hasTime,
  formatTime,
  formatDateJapanese,
  formatSingleDate,
  formatDateDisplayRange
} from '../../src/lib/utils/datetime-utils';

test('formatDate: formats undefined as empty string', () => {
  expect(formatDate(undefined)).toBe('');
});

test("formatDate: formats today as 'Today'", () => {
  const today = new Date();
  expect(formatDate(today)).toBe('Today');
});

test("formatDate: formats tomorrow as 'Tomorrow'", () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  expect(formatDate(tomorrow)).toBe('Tomorrow');
});

test("formatDate: formats yesterday as 'Yesterday'", () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  expect(formatDate(yesterday)).toBe('Yesterday');
});

test('formatDate: formats other dates as locale string', () => {
  // Mocking date to avoid timezone issues in CI/CD
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2024-01-20T10:00:00'));

  const date = new Date('2024-01-15');
  const result = formatDate(date);
  expect(result).toBe(date.toLocaleDateString());

  vi.useRealTimers();
});

test('formatDateTime: formats date as locale string with time', () => {
  const date = new Date('2024-01-15T10:30:00');
  const result = formatDateTime(date);
  expect(result).toContain('2024');
  expect(result).toContain('10:30');
});

test('formatDateForInput: formats undefined as empty string', () => {
  expect(formatDateForInput(undefined)).toBe('');
});

test('formatDateForInput: formats date as YYYY-MM-DD', () => {
  const date = new Date('2024-01-15');
  expect(formatDateForInput(date)).toBe('2024-01-15');
});

test("formatDetailedDate: formats undefined as 'No due date'", () => {
  expect(formatDetailedDate(undefined)).toBe('No due date');
});

test('formatDetailedDate: formats date with full details', () => {
  const date = new Date('2024-01-15');
  const result = formatDetailedDate(date);
  expect(result).toContain('Monday');
  expect(result).toContain('January');
  expect(result).toContain('15');
  expect(result).toContain('2024');
});

test('getDueDateClass: returns empty string for undefined date', () => {
  expect(getDueDateClass(undefined)).toBe('');
});

test('getDueDateClass: returns overdue class for past dates', () => {
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 1);
  expect(getDueDateClass(pastDate, 'not_started')).toBe('text-red-600 font-semibold');
});

test("getDueDateClass: returns today class for today's date", () => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  expect(getDueDateClass(today)).toBe('text-orange-300 font-medium');
});

test('getDueDateClass: returns normal class for future dates', () => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 1);
  expect(getDueDateClass(futureDate)).toBe('text-muted-foreground');
});

test('getDueDateClass: returns normal class for completed overdue tasks', () => {
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 1);
  expect(getDueDateClass(pastDate, 'completed')).toBe('text-muted-foreground');
});

describe('Internal datetime utility functions', () => {
  describe('hasTime', () => {
    test('should return true if date has hours or minutes', () => {
      expect(hasTime(new Date('2024-01-01T01:00:00'))).toBe(true);
      expect(hasTime(new Date('2024-01-01T00:01:00'))).toBe(true);
    });
    test('should return false if date has no time (midnight)', () => {
      expect(hasTime(new Date('2024-01-01T00:00:00'))).toBe(false);
    });
    test('should return false for undefined date', () => {
      expect(hasTime(undefined)).toBe(false);
    });
  });

  describe('formatTime', () => {
    test('should format time as HH:MM', () => {
      const date = new Date('2024-01-15T09:05:00');
      expect(formatTime(date)).toBe('09:05');
    });
    test('should pad single digit hours and minutes', () => {
      const date = new Date('2024-01-15T01:02:00');
      expect(formatTime(date)).toBe('01:02');
    });
  });

  describe('formatDateJapanese', () => {
    test('should format date in Japanese locale', () => {
      const date = new Date('2025-07-26T00:00:00'); // A Saturday
      expect(formatDateJapanese(date)).toBe('2025年7月26日(土)');
    });
  });

  describe('formatSingleDate', () => {
    test('should format date only when no time is provided', () => {
      const date = new Date('2025-07-26T00:00:00');
      expect(formatSingleDate(date, undefined)).toBe('2025年7月26日(土)');
    });
    test('should format date and time when time is provided', () => {
      const date = new Date('2025-07-26T00:00:00');
      const time = new Date('2025-07-26T14:30:00');
      expect(formatSingleDate(date, time)).toBe('2025年7月26日(土) 14:30');
    });
  });

  describe('formatDateDisplayRange', () => {
    test('should format a single day with no time', () => {
      const start = new Date('2025-07-26T00:00:00');
      const end = new Date('2025-07-26T00:00:00');
      expect(formatDateDisplayRange(start, end)).toBe('2025年7月26日(土)');
    });
    test('should format a single day with start and end time', () => {
      const start = new Date('2025-07-26T10:00:00');
      const end = new Date('2025-07-26T18:00:00');
      expect(formatDateDisplayRange(start, end)).toBe('2025年7月26日(土) 10:00 〜 18:00');
    });
    test('should format a single day with only end time', () => {
      const start = new Date('2025-07-26T00:00:00');
      const end = new Date('2025-07-26T18:00:00');
      expect(formatDateDisplayRange(start, end)).toBe('2025年7月26日(土) 〜 18:00');
    });
    test('should format a multi-day range with no time', () => {
      const start = new Date('2025-07-26T00:00:00');
      const end = new Date('2025-07-27T00:00:00');
      expect(formatDateDisplayRange(start, end)).toBe('2025年7月26日(土) 〜 2025年7月27日(日)');
    });
    test('should format a multi-day range with time', () => {
      const start = new Date('2025-07-26T10:00:00');
      const end = new Date('2025-07-28T18:00:00');
      expect(formatDateDisplayRange(start, end)).toBe(
        '2025年7月26日(土) 10:00 〜 2025年7月28日(月) 18:00'
      );
    });
  });
});

describe('formatDateTimeRange', () => {
  const baseDate = new Date('2025-07-26T00:00:00'); // A Saturday

  test('should format a simple date without time', () => {
    const result = formatDateTimeRange(baseDate, {});
    expect(result).toBe('2025年7月26日(土)');
  });

  test('should format a date with end time', () => {
    const endDateTime = new Date('2025-07-26T14:30:00');
    const result = formatDateTimeRange(baseDate, { endDateTime });
    expect(result).toBe('2025年7月26日(土) 14:30');
  });

  test('should format a same-day date range with time', () => {
    const startDateTime = new Date('2025-07-26T10:00:00');
    const endDateTime = new Date('2025-07-26T18:00:00');
    const result = formatDateTimeRange(baseDate, { startDateTime, endDateTime, isRangeDate: true });
    expect(result).toBe('2025年7月26日(土) 10:00 〜 18:00');
  });

  test('should format a multi-day date range with time', () => {
    const startDateTime = new Date('2025-07-26T10:00:00');
    const endDateTime = new Date('2025-07-28T18:00:00'); // 2 days difference
    const result = formatDateTimeRange(baseDate, { startDateTime, endDateTime, isRangeDate: true });
    // The baseDate is 26th, so the range will be 26th to 28th
    expect(result).toBe('2025年7月26日(土) 10:00 〜 2025年7月28日(月) 18:00');
  });

  test('should format a same-day range without time', () => {
    const startDateTime = new Date('2025-07-26T00:00:00');
    const endDateTime = new Date('2025-07-26T00:00:00');
    const result = formatDateTimeRange(baseDate, { startDateTime, endDateTime, isRangeDate: true });
    expect(result).toBe('2025年7月26日(土)');
  });

  test('should format a multi-day range without time', () => {
    const startDateTime = new Date('2025-07-26T00:00:00');
    const endDateTime = new Date('2025-07-27T00:00:00');
    const result = formatDateTimeRange(baseDate, { startDateTime, endDateTime, isRangeDate: true });
    expect(result).toBe('2025年7月26日(土) 〜 2025年7月27日(日)');
  });

  test('should handle range with only start time', () => {
    const startDateTime = new Date('2025-07-26T10:00:00');
    const endDateTime = new Date('2025-07-26T00:00:00'); // No end time
    const result = formatDateTimeRange(baseDate, { startDateTime, endDateTime, isRangeDate: true });
    expect(result).toBe('2025年7月26日(土) 10:00 〜');
  });

  test('should handle range with only end time', () => {
    const startDateTime = new Date('2025-07-26T00:00:00'); // No start time
    const endDateTime = new Date('2025-07-26T18:00:00');
    const result = formatDateTimeRange(baseDate, { startDateTime, endDateTime, isRangeDate: true });
    expect(result).toBe('2025年7月26日(土) 〜 18:00');
  });
});

describe('date-time utils', () => {
  describe('formatDate', () => {
    test('should format date in YYYY-MM-DD format', () => {
      const date = new Date('2024-01-15T12:30:45');
      const result = formatDate1(date);

      expect(result).toBe('2024-01-15');
    });

    test('should pad single digit months and days with zeros', () => {
      const date = new Date('2024-03-05T12:30:45');
      const result = formatDate1(date);

      expect(result).toBe('2024-03-05');
    });

    test('should handle leap year dates', () => {
      const date = new Date('2024-02-29T12:30:45');
      const result = formatDate1(date);

      expect(result).toBe('2024-02-29');
    });

    test('should handle year boundary dates', () => {
      const date = new Date('2023-12-31T23:59:59');
      const result = formatDate1(date);

      expect(result).toBe('2023-12-31');
    });

    test('should handle different years', () => {
      const date1 = new Date('1999-01-01T00:00:00');
      const date2 = new Date('2050-12-31T23:59:59');

      expect(formatDate1(date1)).toBe('1999-01-01');
      expect(formatDate1(date2)).toBe('2050-12-31');
    });
  });

  describe('formatTime', () => {
    test('should format time in HH:MM:SS format', () => {
      const date = new Date('2024-01-15T12:30:45');
      const result = formatTime1(date);

      expect(result).toBe('12:30:45');
    });

    test('should pad single digit hours, minutes, and seconds with zeros', () => {
      const date = new Date('2024-01-15T05:07:09');
      const result = formatTime1(date);

      expect(result).toBe('05:07:09');
    });

    test('should handle midnight time', () => {
      const date = new Date('2024-01-15T00:00:00');
      const result = formatTime1(date);

      expect(result).toBe('00:00:00');
    });

    test('should handle time just before midnight', () => {
      const date = new Date('2024-01-15T23:59:59');
      const result = formatTime1(date);

      expect(result).toBe('23:59:59');
    });

    test('should handle noon time', () => {
      const date = new Date('2024-01-15T12:00:00');
      const result = formatTime1(date);

      expect(result).toBe('12:00:00');
    });

    test('should handle milliseconds by ignoring them', () => {
      const date = new Date('2024-01-15T12:30:45.789');
      const result = formatTime1(date);

      expect(result).toBe('12:30:45');
    });
  });

  describe('combined usage', () => {
    test('should format same date consistently', () => {
      const date = new Date('2024-06-15T14:30:25');

      const formattedDate = formatDate1(date);
      const formattedTime = formatTime1(date);

      expect(formattedDate).toBe('2024-06-15');
      expect(formattedTime).toBe('14:30:25');
    });

    test('should handle timezone-specific dates correctly', () => {
      // Create date in specific timezone (this will depend on the system timezone)
      const date = new Date('2024-01-15T12:30:45.000Z');

      const formattedDate = formatDate1(date);
      const formattedTime = formatTime1(date);

      // The format should be consistent regardless of the input timezone
      expect(formattedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(formattedTime).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });
  });

  describe('edge cases', () => {
    test('should handle dates with different timezones', () => {
      // Test that the functions work with dates created in different ways
      const date1 = new Date(2024, 0, 15, 12, 30, 45); // Local time
      const date2 = new Date('2024-01-15T12:30:45'); // Parsed as local time

      const result1Date = formatDate1(date1);
      const result1Time = formatTime1(date1);
      const result2Date = formatDate1(date2);
      const result2Time = formatTime1(date2);

      expect(result1Date).toBe('2024-01-15');
      expect(result1Time).toBe('12:30:45');
      expect(result2Date).toBe('2024-01-15');
      expect(result2Time).toBe('12:30:45');
    });

    test('should handle very old dates', () => {
      const oldDate = new Date('1900-01-01T12:00:00');

      expect(formatDate1(oldDate)).toBe('1900-01-01');
      expect(formatTime1(oldDate)).toBe('12:00:00');
    });

    test('should handle future dates', () => {
      const futureDate = new Date('2100-12-31T23:59:59');

      expect(formatDate1(futureDate)).toBe('2100-12-31');
      expect(formatTime1(futureDate)).toBe('23:59:59');
    });
  });
});

test('formatDateForInput should handle different timezones correctly', () => {
  // A date that might shift if not handled as local
  const date = new Date('2024-01-01T02:00:00');
  expect(formatDateForInput(date)).toBe('2024-01-01');

  const dateUTC = new Date('2023-12-31T23:00:00Z'); // This is 2024-01-01 in some timezones
  const expectedYear = dateUTC.getFullYear();
  const expectedMonth = String(dateUTC.getMonth() + 1).padStart(2, '0');
  const expectedDay = String(dateUTC.getDate()).padStart(2, '0');

  expect(formatDateForInput(dateUTC)).toBe(`${expectedYear}-${expectedMonth}-${expectedDay}`);
});
