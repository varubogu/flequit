import { describe, it, expect } from 'vitest';
import {
  checkWeekdayCondition,
  applyWeekdayAdjustment
} from '$lib/services/domain/recurrence/adjustment/weekday-adjuster';
import type { WeekdayCondition } from '$lib/types/datetime-calendar';

// Note: isHoliday の実装は土日を祝日として扱う簡略実装

describe('weekday-adjuster', () => {
  describe('checkWeekdayCondition', () => {
    describe('特定の曜日チェック', () => {
      it('日曜日をチェックする', () => {
        const sunday = new Date('2025-01-12T00:00:00'); // Sunday
        const condition: WeekdayCondition = {
          id: 'test-condition',
          ifWeekday: 'sunday',
          thenTarget: 'specific_weekday',
          thenDirection: 'next'
        };
        expect(checkWeekdayCondition(sunday, condition)).toBe(true);
      });

      it('月曜日をチェックする', () => {
        const monday = new Date('2025-01-13T00:00:00'); // Monday
        const condition: WeekdayCondition = {
          id: 'test-condition',
          ifWeekday: 'monday',
          thenTarget: 'specific_weekday',
          thenDirection: 'next'
        };
        expect(checkWeekdayCondition(monday, condition)).toBe(true);
      });

      it('金曜日でない日を金曜日としてチェックするとfalse', () => {
        const monday = new Date('2025-01-13T00:00:00'); // Monday
        const condition: WeekdayCondition = {
          id: 'test-condition',
          ifWeekday: 'friday',
          thenTarget: 'specific_weekday',
          thenDirection: 'next'
        };
        expect(checkWeekdayCondition(monday, condition)).toBe(false);
      });
    });

    describe('平日・休日チェック', () => {
      it('平日（月曜）をweekdayとしてチェック', () => {
        const monday = new Date('2025-01-13T00:00:00'); // Monday
        const condition: WeekdayCondition = {
          id: 'test-condition',
          ifWeekday: 'weekday',
          thenTarget: 'specific_weekday',
          thenDirection: 'next'
        };
        expect(checkWeekdayCondition(monday, condition)).toBe(true);
      });

      it('平日（金曜）をweekdayとしてチェック', () => {
        const friday = new Date('2025-01-17T00:00:00'); // Friday
        const condition: WeekdayCondition = {
          id: 'test-condition',
          ifWeekday: 'weekday',
          thenTarget: 'specific_weekday',
          thenDirection: 'next'
        };
        expect(checkWeekdayCondition(friday, condition)).toBe(true);
      });

      it('土曜日をweekdayとしてチェックするとfalse', () => {
        const saturday = new Date('2025-01-18T00:00:00'); // Saturday
        const condition: WeekdayCondition = {
          id: 'test-condition',
          ifWeekday: 'weekday',
          thenTarget: 'specific_weekday',
          thenDirection: 'next'
        };
        expect(checkWeekdayCondition(saturday, condition)).toBe(false);
      });

      it('週末（土曜）をweekendとしてチェック', () => {
        const saturday = new Date('2025-01-18T00:00:00'); // Saturday
        const condition: WeekdayCondition = {
          id: 'test-condition',
          ifWeekday: 'weekend',
          thenTarget: 'specific_weekday',
          thenDirection: 'next'
        };
        expect(checkWeekdayCondition(saturday, condition)).toBe(true);
      });

      it('週末（日曜）をweekendとしてチェック', () => {
        const sunday = new Date('2025-01-19T00:00:00'); // Sunday
        const condition: WeekdayCondition = {
          id: 'test-condition',
          ifWeekday: 'weekend',
          thenTarget: 'specific_weekday',
          thenDirection: 'next'
        };
        expect(checkWeekdayCondition(sunday, condition)).toBe(true);
      });
    });

    describe('祝日チェック（実装: 土日が祝日）', () => {
      it('土曜日をholidayとしてチェック', () => {
        const saturday = new Date('2025-01-18T00:00:00'); // Saturday
        const condition: WeekdayCondition = {
          id: 'test-condition',
          ifWeekday: 'holiday',
          thenTarget: 'specific_weekday',
          thenDirection: 'next'
        };
        expect(checkWeekdayCondition(saturday, condition)).toBe(true);
      });

      it('平日（水曜）をholidayとしてチェックするとfalse', () => {
        const wednesday = new Date('2025-01-15T00:00:00'); // Wednesday
        const condition: WeekdayCondition = {
          id: 'test-condition',
          ifWeekday: 'holiday',
          thenTarget: 'specific_weekday',
          thenDirection: 'next'
        };
        expect(checkWeekdayCondition(wednesday, condition)).toBe(false);
      });

      it('平日（水曜）をnon_holidayとしてチェック', () => {
        const wednesday = new Date('2025-01-15T00:00:00'); // Wednesday
        const condition: WeekdayCondition = {
          id: 'test-condition',
          ifWeekday: 'non_holiday',
          thenTarget: 'specific_weekday',
          thenDirection: 'next'
        };
        expect(checkWeekdayCondition(wednesday, condition)).toBe(true);
      });
    });

    describe('組み合わせ条件チェック', () => {
      it('土曜日をweekend_holidayとしてチェック', () => {
        const saturday = new Date('2025-01-18T00:00:00');
        const condition: WeekdayCondition = {
          id: 'test-condition',
          ifWeekday: 'weekend_holiday',
          thenTarget: 'specific_weekday',
          thenDirection: 'next'
        };
        expect(checkWeekdayCondition(saturday, condition)).toBe(true);
      });

      it('日曜日をweekend_holidayとしてチェック', () => {
        const sunday = new Date('2025-01-19T00:00:00');
        const condition: WeekdayCondition = {
          id: 'test-condition',
          ifWeekday: 'weekend_holiday',
          thenTarget: 'specific_weekday',
          thenDirection: 'next'
        };
        expect(checkWeekdayCondition(sunday, condition)).toBe(true);
      });

      it('平日（水曜）をnon_weekend_holidayとしてチェック', () => {
        const wednesday = new Date('2025-01-15T00:00:00'); // Wednesday
        const condition: WeekdayCondition = {
          id: 'test-condition',
          ifWeekday: 'non_weekend_holiday',
          thenTarget: 'specific_weekday',
          thenDirection: 'next'
        };
        expect(checkWeekdayCondition(wednesday, condition)).toBe(true);
      });

      it('土曜日をnon_weekend_holidayとしてチェックするとfalse', () => {
        const saturday = new Date('2025-01-18T00:00:00');
        const condition: WeekdayCondition = {
          id: 'test-condition',
          ifWeekday: 'non_weekend_holiday',
          thenTarget: 'specific_weekday',
          thenDirection: 'next'
        };
        expect(checkWeekdayCondition(saturday, condition)).toBe(false);
      });
    });
  });

  describe('applyWeekdayAdjustment', () => {
    describe('特定曜日への移動', () => {
      it('月曜日から次の金曜日へ移動', () => {
        const monday = new Date('2025-01-13T00:00:00');
        const condition: WeekdayCondition = {
          id: 'test-condition',
          ifWeekday: 'monday',
          thenTarget: 'specific_weekday',
          thenWeekday: 'friday',
          thenDirection: 'next'
        };
        const result = applyWeekdayAdjustment(monday, condition);
        expect(result.getDay()).toBe(5); // Friday
        expect(result.getDate()).toBe(17);
      });

      it('金曜日から前の月曜日へ移動', () => {
        const friday = new Date('2025-01-17T00:00:00');
        const condition: WeekdayCondition = {
          id: 'test-condition',
          ifWeekday: 'friday',
          thenTarget: 'specific_weekday',
          thenWeekday: 'monday',
          thenDirection: 'previous'
        };
        const result = applyWeekdayAdjustment(friday, condition);
        expect(result.getDay()).toBe(1); // Monday
        expect(result.getDate()).toBe(13);
      });

      it('同じ曜日の場合は7日後へ移動（next）', () => {
        const monday = new Date('2025-01-13T00:00:00');
        const condition: WeekdayCondition = {
          id: 'test-condition',
          ifWeekday: 'monday',
          thenTarget: 'specific_weekday',
          thenWeekday: 'monday',
          thenDirection: 'next'
        };
        const result = applyWeekdayAdjustment(monday, condition);
        expect(result.getDay()).toBe(1); // Monday
        expect(result.getDate()).toBe(20);
      });
    });

    describe('平日への移動', () => {
      it('土曜日から次の平日（月曜）へ移動', () => {
        const saturday = new Date('2025-01-18T00:00:00');
        const condition: WeekdayCondition = {
          id: 'test-condition',
          ifWeekday: 'saturday',
          thenTarget: 'weekday',
          thenDirection: 'next'
        };
        const result = applyWeekdayAdjustment(saturday, condition);
        expect(result.getDay()).toBe(1); // Monday
        expect(result.getDate()).toBe(20);
      });

      it('日曜日から前の平日（金曜）へ移動', () => {
        const sunday = new Date('2025-01-19T00:00:00');
        const condition: WeekdayCondition = {
          id: 'test-condition',
          ifWeekday: 'sunday',
          thenTarget: 'weekday',
          thenDirection: 'previous'
        };
        const result = applyWeekdayAdjustment(sunday, condition);
        expect(result.getDay()).toBe(5); // Friday
        expect(result.getDate()).toBe(17);
      });
    });

    describe('週末への移動', () => {
      it('金曜日から次の週末（土曜）へ移動', () => {
        const friday = new Date('2025-01-17T00:00:00');
        const condition: WeekdayCondition = {
          id: 'test-condition',
          ifWeekday: 'friday',
          thenTarget: 'weekend',
          thenDirection: 'next'
        };
        const result = applyWeekdayAdjustment(friday, condition);
        expect([0, 6]).toContain(result.getDay()); // Sunday or Saturday
        expect(result.getDate()).toBe(18); // Saturday
      });

      it('月曜日から前の週末（日曜）へ移動', () => {
        const monday = new Date('2025-01-13T00:00:00');
        const condition: WeekdayCondition = {
          id: 'test-condition',
          ifWeekday: 'monday',
          thenTarget: 'weekend',
          thenDirection: 'previous'
        };
        const result = applyWeekdayAdjustment(monday, condition);
        expect([0, 6]).toContain(result.getDay());
        expect(result.getDate()).toBe(12); // Sunday
      });
    });

    describe('指定日数の移動', () => {
      it('3日後へ移動', () => {
        const monday = new Date('2025-01-13T00:00:00');
        const condition: WeekdayCondition = {
          id: 'test-condition',
          ifWeekday: 'monday',
          thenTarget: 'specific_weekday',
          thenDirection: 'next',
          thenDays: 3
        };
        const result = applyWeekdayAdjustment(monday, condition);
        expect(result.getDate()).toBe(16);
      });

      it('5日前へ移動', () => {
        const friday = new Date('2025-01-17T00:00:00');
        const condition: WeekdayCondition = {
          id: 'test-condition',
          ifWeekday: 'friday',
          thenTarget: 'specific_weekday',
          thenDirection: 'previous',
          thenDays: 5
        };
        const result = applyWeekdayAdjustment(friday, condition);
        expect(result.getDate()).toBe(12);
      });
    });

    describe('祝日への移動（実装: 土日が祝日）', () => {
      it('平日（木曜）から次の祝日（金曜）へ移動', () => {
        const date = new Date('2025-01-02T00:00:00'); // Thursday
        const condition: WeekdayCondition = {
          id: 'test-condition',
          ifWeekday: 'thursday',
          thenTarget: 'holiday',
          thenDirection: 'next'
        };
        const result = applyWeekdayAdjustment(date, condition);
        // 2025-01-02は木曜、次の祝日(土日)は 2025-01-04 (土曜)
        expect(result.toISOString().split('T')[0]).toBe('2025-01-04');
      });

      it('日曜日から前の非祝日へ移動', () => {
        const date = new Date('2025-01-12T00:00:00'); // Sunday (holiday)
        const condition: WeekdayCondition = {
          id: 'test-condition',
          ifWeekday: 'sunday',
          thenTarget: 'non_holiday',
          thenDirection: 'previous'
        };
        const result = applyWeekdayAdjustment(date, condition);
        // 2025-01-12は日曜(祝日扱い)、前の非祝日は 2025-01-10 (金曜)
        // Jan 11=土(祝日扱い)をスキップして Jan 10=金に到達
        expect(result.toISOString().split('T')[0]).toBe('2025-01-10');
      });
    });

    describe('土日祝日への移動', () => {
      it('平日から次の土日祝日へ移動', () => {
        const wednesday = new Date('2025-01-15T00:00:00');
        const condition: WeekdayCondition = {
          id: 'test-condition',
          ifWeekday: 'wednesday',
          thenTarget: 'weekend_holiday',
          thenDirection: 'next'
        };
        const result = applyWeekdayAdjustment(wednesday, condition);
        expect([0, 6]).toContain(result.getDay()); // Weekend day
      });
    });

    describe('土日祝日以外への移動', () => {
      it('土曜日から次の平日非祝日へ移動', () => {
        const saturday = new Date('2025-01-18T00:00:00');
        const condition: WeekdayCondition = {
          id: 'test-condition',
          ifWeekday: 'saturday',
          thenTarget: 'non_weekend_holiday',
          thenDirection: 'next'
        };
        const result = applyWeekdayAdjustment(saturday, condition);
        expect(result.getDay()).toBeGreaterThanOrEqual(1);
        expect(result.getDay()).toBeLessThanOrEqual(5);
        expect(result.getDate()).toBe(20); // Monday
      });
    });
  });

  describe('エッジケース', () => {
    it('月をまたぐ調整（1月末から2月）', () => {
      const lastDayOfJan = new Date('2025-01-31T00:00:00'); // Friday
      const condition: WeekdayCondition = {
        id: 'test-condition',
        ifWeekday: 'friday',
        thenTarget: 'weekend',
        thenDirection: 'next'
      };
      const result = applyWeekdayAdjustment(lastDayOfJan, condition);
      expect(result.getMonth()).toBe(1); // February
      expect([0, 6]).toContain(result.getDay());
    });

    it('年をまたぐ調整（12月末から1月）', () => {
      const lastDayOfYear = new Date('2024-12-31T00:00:00'); // Tuesday
      const condition: WeekdayCondition = {
        id: 'test-condition',
        ifWeekday: 'tuesday',
        thenTarget: 'weekend',
        thenDirection: 'next'
      };
      const result = applyWeekdayAdjustment(lastDayOfYear, condition);
      expect(result.getFullYear()).toBe(2025);
    });

    it('閏年の2月29日の処理', () => {
      const leapDay = new Date('2024-02-29T00:00:00'); // Thursday
      const condition: WeekdayCondition = {
        id: 'test-condition',
        ifWeekday: 'thursday',
        thenTarget: 'specific_weekday',
        thenWeekday: 'monday',
        thenDirection: 'next'
      };
      const result = applyWeekdayAdjustment(leapDay, condition);
      expect(result.getDay()).toBe(1);
      expect(result.getMonth()).toBe(2); // March
    });
  });
});
