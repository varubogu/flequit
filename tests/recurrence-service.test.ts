import { describe, it, expect } from 'vitest';
import { RecurrenceService } from '$lib/services/recurrence-service';
import type { RecurrenceRule } from '$lib/types/task';

describe('RecurrenceService', () => {
  describe('calculateNextDate', () => {
    it('日単位の繰り返し計算', () => {
      const baseDate = new Date('2024-01-01');
      const rule: RecurrenceRule = {
        unit: 'day',
        interval: 1
      };
      
      const nextDate = RecurrenceService.calculateNextDate(baseDate, rule);
      expect(nextDate?.toISOString().split('T')[0]).toBe('2024-01-02');
    });

    it('週単位の繰り返し計算', () => {
      const baseDate = new Date('2024-01-01'); // 月曜日
      const rule: RecurrenceRule = {
        unit: 'week',
        interval: 1
      };
      
      const nextDate = RecurrenceService.calculateNextDate(baseDate, rule);
      expect(nextDate?.toISOString().split('T')[0]).toBe('2024-01-08');
    });

    it('月単位の繰り返し計算', () => {
      const baseDate = new Date('2024-01-15');
      const rule: RecurrenceRule = {
        unit: 'month',
        interval: 1,
        details: {
          specific_date: 15
        }
      };
      
      const nextDate = RecurrenceService.calculateNextDate(baseDate, rule);
      expect(nextDate?.toISOString().split('T')[0]).toBe('2024-02-15');
    });

    it('曜日指定ありの週単位繰り返し', () => {
      const baseDate = new Date('2024-01-01'); // 月曜日
      const rule: RecurrenceRule = {
        unit: 'week',
        interval: 1,
        days_of_week: ['wednesday', 'friday']
      };
      
      const nextDate = RecurrenceService.calculateNextDate(baseDate, rule);
      expect(nextDate?.toISOString().split('T')[0]).toBe('2024-01-03'); // 水曜日
    });

    it('年単位の繰り返し計算', () => {
      const baseDate = new Date('2024-01-01');
      const rule: RecurrenceRule = {
        unit: 'year',
        interval: 1
      };
      
      const nextDate = RecurrenceService.calculateNextDate(baseDate, rule);
      expect(nextDate?.toISOString().split('T')[0]).toBe('2025-01-01');
    });

    it('nullルールの場合はnullを返す', () => {
      const baseDate = new Date('2024-01-01');
      const nextDate = RecurrenceService.calculateNextDate(baseDate, null as any);
      expect(nextDate).toBeNull();
    });
  });

  describe('generateRecurrenceDates', () => {
    it('複数の繰り返し日付を生成', () => {
      const startDate = new Date('2024-01-01');
      const rule: RecurrenceRule = {
        unit: 'day',
        interval: 7 // 週単位
      };
      
      const dates = RecurrenceService.generateRecurrenceDates(startDate, rule, 3);
      expect(dates).toHaveLength(3);
      expect(dates[0].toISOString().split('T')[0]).toBe('2024-01-08');
      expect(dates[1].toISOString().split('T')[0]).toBe('2024-01-15');
      expect(dates[2].toISOString().split('T')[0]).toBe('2024-01-22');
    });
  });
});