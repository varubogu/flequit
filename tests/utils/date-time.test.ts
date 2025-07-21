import { describe, test, expect } from 'vitest';
import { formatDate, formatTime } from '../../src/lib/utils/date-time';

describe('date-time utils', () => {
  describe('formatDate', () => {
    test('should format date in YYYY-MM-DD format', () => {
      const date = new Date('2024-01-15T12:30:45');
      const result = formatDate(date);
      
      expect(result).toBe('2024-01-15');
    });

    test('should pad single digit months and days with zeros', () => {
      const date = new Date('2024-03-05T12:30:45');
      const result = formatDate(date);
      
      expect(result).toBe('2024-03-05');
    });

    test('should handle leap year dates', () => {
      const date = new Date('2024-02-29T12:30:45');
      const result = formatDate(date);
      
      expect(result).toBe('2024-02-29');
    });

    test('should handle year boundary dates', () => {
      const date = new Date('2023-12-31T23:59:59');
      const result = formatDate(date);
      
      expect(result).toBe('2023-12-31');
    });

    test('should handle different years', () => {
      const date1 = new Date('1999-01-01T00:00:00');
      const date2 = new Date('2050-12-31T23:59:59');
      
      expect(formatDate(date1)).toBe('1999-01-01');
      expect(formatDate(date2)).toBe('2050-12-31');
    });
  });

  describe('formatTime', () => {
    test('should format time in HH:MM:SS format', () => {
      const date = new Date('2024-01-15T12:30:45');
      const result = formatTime(date);
      
      expect(result).toBe('12:30:45');
    });

    test('should pad single digit hours, minutes, and seconds with zeros', () => {
      const date = new Date('2024-01-15T05:07:09');
      const result = formatTime(date);
      
      expect(result).toBe('05:07:09');
    });

    test('should handle midnight time', () => {
      const date = new Date('2024-01-15T00:00:00');
      const result = formatTime(date);
      
      expect(result).toBe('00:00:00');
    });

    test('should handle time just before midnight', () => {
      const date = new Date('2024-01-15T23:59:59');
      const result = formatTime(date);
      
      expect(result).toBe('23:59:59');
    });

    test('should handle noon time', () => {
      const date = new Date('2024-01-15T12:00:00');
      const result = formatTime(date);
      
      expect(result).toBe('12:00:00');
    });

    test('should handle milliseconds by ignoring them', () => {
      const date = new Date('2024-01-15T12:30:45.789');
      const result = formatTime(date);
      
      expect(result).toBe('12:30:45');
    });
  });

  describe('combined usage', () => {
    test('should format same date consistently', () => {
      const date = new Date('2024-06-15T14:30:25');
      
      const formattedDate = formatDate(date);
      const formattedTime = formatTime(date);
      
      expect(formattedDate).toBe('2024-06-15');
      expect(formattedTime).toBe('14:30:25');
    });

    test('should handle timezone-specific dates correctly', () => {
      // Create date in specific timezone (this will depend on the system timezone)
      const date = new Date('2024-01-15T12:30:45.000Z');
      
      const formattedDate = formatDate(date);
      const formattedTime = formatTime(date);
      
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
      
      const result1Date = formatDate(date1);
      const result1Time = formatTime(date1);
      const result2Date = formatDate(date2);
      const result2Time = formatTime(date2);
      
      expect(result1Date).toBe('2024-01-15');
      expect(result1Time).toBe('12:30:45');
      expect(result2Date).toBe('2024-01-15');
      expect(result2Time).toBe('12:30:45');
    });

    test('should handle very old dates', () => {
      const oldDate = new Date('1900-01-01T12:00:00');
      
      expect(formatDate(oldDate)).toBe('1900-01-01');
      expect(formatTime(oldDate)).toBe('12:00:00');
    });

    test('should handle future dates', () => {
      const futureDate = new Date('2100-12-31T23:59:59');
      
      expect(formatDate(futureDate)).toBe('2100-12-31');
      expect(formatTime(futureDate)).toBe('23:59:59');
    });
  });
});