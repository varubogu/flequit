import { test, expect, describe } from "vitest";
import {
  formatDate,
  formatDateTime,
  formatDateForInput,
  formatDetailedDate,
  getDueDateClass,
  formatDateTimeRange
} from "../../src/lib/utils/datetime-utils";

test("formatDate: formats undefined as empty string", () => {
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

test("formatDate: formats other dates as locale string", () => {
  const date = new Date('2024-01-15');
  const result = formatDate(date);
  expect(result).toContain('2024');
});

test("formatDateTime: formats date as locale string with time", () => {
  const date = new Date('2024-01-15T10:30:00');
  const result = formatDateTime(date);
  expect(result).toContain('2024');
  expect(result).toContain('10:30');
});

test("formatDateForInput: formats undefined as empty string", () => {
  expect(formatDateForInput(undefined)).toBe('');
});

test("formatDateForInput: formats date as YYYY-MM-DD", () => {
  const date = new Date('2024-01-15');
  expect(formatDateForInput(date)).toBe('2024-01-15');
});

test("formatDetailedDate: formats undefined as 'No due date'", () => {
  expect(formatDetailedDate(undefined)).toBe('No due date');
});

test("formatDetailedDate: formats date with full details", () => {
  const date = new Date('2024-01-15');
  const result = formatDetailedDate(date);
  expect(result).toContain('Monday');
  expect(result).toContain('January');
  expect(result).toContain('15');
  expect(result).toContain('2024');
});

test("getDueDateClass: returns empty string for undefined date", () => {
  expect(getDueDateClass(undefined)).toBe('');
});

test("getDueDateClass: returns overdue class for past dates", () => {
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 1);
  expect(getDueDateClass(pastDate, 'not_started')).toBe('text-red-600 font-semibold');
});

test("getDueDateClass: returns today class for today's date", () => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  expect(getDueDateClass(today)).toBe('text-orange-300 font-medium');
});

test("getDueDateClass: returns normal class for future dates", () => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 1);
  expect(getDueDateClass(futureDate)).toBe('text-muted-foreground');
});

test("getDueDateClass: returns normal class for completed overdue tasks", () => {
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 1);
  expect(getDueDateClass(pastDate, 'completed')).toBe('text-muted-foreground');
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
});
