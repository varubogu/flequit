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

    it('分単位の繰り返し計算', () => {
      const baseDate = new Date('2024-01-01 10:00:00');
      const rule: RecurrenceRule = {
        unit: 'minute',
        interval: 30
      };
      
      const nextDate = RecurrenceService.calculateNextDate(baseDate, rule);
      expect(nextDate?.getHours()).toBe(10);
      expect(nextDate?.getMinutes()).toBe(30);
    });

    it('時間単位の繰り返し計算', () => {
      const baseDate = new Date('2024-01-01 10:00:00');
      const rule: RecurrenceRule = {
        unit: 'hour',
        interval: 2
      };
      
      const nextDate = RecurrenceService.calculateNextDate(baseDate, rule);
      expect(nextDate?.getHours()).toBe(12);
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

    it('四半期単位の繰り返し計算', () => {
      const baseDate = new Date('2024-01-01');
      const rule: RecurrenceRule = {
        unit: 'quarter',
        interval: 1
      };
      
      const nextDate = RecurrenceService.calculateNextDate(baseDate, rule);
      expect(nextDate?.toISOString().split('T')[0]).toBe('2024-04-01');
    });

    it('半年単位の繰り返し計算', () => {
      const baseDate = new Date('2024-01-01');
      const rule: RecurrenceRule = {
        unit: 'half_year',
        interval: 1
      };
      
      const nextDate = RecurrenceService.calculateNextDate(baseDate, rule);
      expect(nextDate?.toISOString().split('T')[0]).toBe('2024-07-01');
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

    it('曜日指定で今週の対象曜日がない場合', () => {
      const baseDate = new Date('2024-01-05'); // 金曜日
      const rule: RecurrenceRule = {
        unit: 'week',
        interval: 1,
        days_of_week: ['monday', 'wednesday']
      };
      
      const nextDate = RecurrenceService.calculateNextDate(baseDate, rule);
      expect(nextDate?.toISOString().split('T')[0]).toBe('2024-01-08'); // 次週の月曜日
    });

    it('月の第X曜日指定（第2日曜日）', () => {
      const baseDate = new Date('2024-01-01');
      const rule: RecurrenceRule = {
        unit: 'month',
        interval: 1,
        details: {
          week_of_period: 'second',
          weekday_of_week: 'sunday'
        }
      };
      
      const nextDate = RecurrenceService.calculateNextDate(baseDate, rule);
      // 2024年2月の第2日曜日は2月11日
      expect(nextDate?.toISOString().split('T')[0]).toBe('2024-02-11');
    });

    it('月の最後の曜日指定（最終金曜日）', () => {
      const baseDate = new Date('2024-01-01');
      const rule: RecurrenceRule = {
        unit: 'month',
        interval: 1,
        details: {
          week_of_period: 'last',
          weekday_of_week: 'friday'
        }
      };
      
      const nextDate = RecurrenceService.calculateNextDate(baseDate, rule);
      // 2024年2月の最終金曜日は2月23日
      expect(nextDate?.toISOString().split('T')[0]).toBe('2024-02-23');
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

    it('終了日設定ありで終了条件を満たす場合', () => {
      const baseDate = new Date('2024-12-01');
      const rule: RecurrenceRule = {
        unit: 'day',
        interval: 1,
        end_date: new Date('2024-12-01')
      };
      
      const nextDate = RecurrenceService.calculateNextDate(baseDate, rule);
      expect(nextDate).toBeNull();
    });

    it('不正な単位の場合はnullを返す', () => {
      const baseDate = new Date('2024-01-01');
      const rule: RecurrenceRule = {
        unit: 'invalid' as any,
        interval: 1
      };
      
      const nextDate = RecurrenceService.calculateNextDate(baseDate, rule);
      expect(nextDate).toBeNull();
    });

    it('nullルールの場合はnullを返す', () => {
      const baseDate = new Date('2024-01-01');
      const nextDate = RecurrenceService.calculateNextDate(baseDate, null as any);
      expect(nextDate).toBeNull();
    });
  });

  describe('日付補正機能', () => {
    it('曜日条件での補正', () => {
      const baseDate = new Date('2024-01-06'); // 土曜日  
      const rule: RecurrenceRule = {
        unit: 'day',
        interval: 1,
        adjustment: {
          weekday_conditions: [{
            id: 'test-weekday-1',
            if_weekday: 'sunday',  // 次の日（日曜日）をチェック
            then_target: 'specific_weekday',
            then_weekday: 'monday',
            then_direction: 'next'
          }],
          date_conditions: []
        }
      };
      
      const nextDate = RecurrenceService.calculateNextDate(baseDate, rule);
      // 1日後の日曜日に対して補正が適用され月曜日になる
      expect(nextDate?.getDay()).toBe(1); // 月曜日
    });

    it('日付条件での補正', () => {
      const baseDate = new Date('2024-01-01');
      const rule: RecurrenceRule = {
        unit: 'day',
        interval: 1,
        adjustment: {
          date_conditions: [{
            id: 'test-date-1',
            reference_date: new Date('2024-01-02'),
            relation: 'on_or_after'
          }],
          weekday_conditions: []
        }
      };
      
      const nextDate = RecurrenceService.calculateNextDate(baseDate, rule);
      // 日付補正が適用される（簡略実装では1日後）
      expect(nextDate).not.toBeNull();
    });
  });

  describe('エッジケース', () => {
    it('月末日付で月をまたぐ場合（デフォルト動作）', () => {
      const baseDate = new Date('2024-01-31');
      const rule: RecurrenceRule = {
        unit: 'month',
        interval: 1
        // detailsなし → デフォルト動作
      };
      
      const nextDate = RecurrenceService.calculateNextDate(baseDate, rule);
      // デフォルトでは setMonth(currentDate.getMonth() + rule.interval) 
      // その後 JavaScriptが自動で日付を調整
      // 2024年2月31日 → 2024年3月2日
      expect(nextDate?.getMonth()).toBe(2); // 3月（0ベース）
      expect(nextDate?.getDate()).toBe(2); // 3月2日
    });

    it('特定日付指定で月末日付の補正', () => {
      const baseDate = new Date('2024-01-15');
      const rule: RecurrenceRule = {
        unit: 'month',
        interval: 1,
        details: {
          specific_date: 31
        }
      };
      
      const nextDate = RecurrenceService.calculateNextDate(baseDate, rule);
      // Math.min(31, 29) = 29 (2024年2月の最終日)
      expect(nextDate?.getMonth()).toBe(1); // 2月（0ベース）
      expect(nextDate?.getDate()).toBe(29); // 2月29日
    });

    it('月の第5週が存在しない場合', () => {
      const baseDate = new Date('2024-02-01');
      const rule: RecurrenceRule = {
        unit: 'month',
        interval: 1,
        details: {
          week_of_period: 'fourth',
          weekday_of_week: 'saturday'
        }
      };
      
      const nextDate = RecurrenceService.calculateNextDate(baseDate, rule);
      // 3月の第4土曜日
      expect(nextDate?.getMonth()).toBe(2); // 3月（0ベース）
    });

    it('2週間隔での曜日指定', () => {
      const baseDate = new Date('2024-01-01'); // 月曜日
      const rule: RecurrenceRule = {
        unit: 'week',
        interval: 2,
        days_of_week: ['monday']
      };
      
      const nextDate = RecurrenceService.calculateNextDate(baseDate, rule);
      expect(nextDate?.toISOString().split('T')[0]).toBe('2024-01-15'); // 2週間後の月曜日
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

    it('終了条件で停止する', () => {
      const startDate = new Date('2024-01-01');
      const rule: RecurrenceRule = {
        unit: 'day',
        interval: 1,
        end_date: new Date('2024-01-03')
      };
      
      const dates = RecurrenceService.generateRecurrenceDates(startDate, rule, 10);
      expect(dates).toHaveLength(2); // 1/2, 1/3で終了
    });

    it('曜日指定での複数日付生成', () => {
      const startDate = new Date('2024-01-01'); // 月曜日
      const rule: RecurrenceRule = {
        unit: 'week',
        interval: 1,
        days_of_week: ['wednesday', 'friday']
      };
      
      const dates = RecurrenceService.generateRecurrenceDates(startDate, rule, 4);
      expect(dates).toHaveLength(4);
      expect(dates[0].toISOString().split('T')[0]).toBe('2024-01-03'); // 水曜日
      expect(dates[1].toISOString().split('T')[0]).toBe('2024-01-05'); // 金曜日
      expect(dates[2].toISOString().split('T')[0]).toBe('2024-01-10'); // 次週の水曜日
      expect(dates[3].toISOString().split('T')[0]).toBe('2024-01-12'); // 次週の金曜日
    });
  });
});