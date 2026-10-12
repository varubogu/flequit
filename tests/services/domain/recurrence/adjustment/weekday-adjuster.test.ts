import { describe, it, expect } from 'vitest';
import {
  checkWeekdayCondition,
  applyWeekdayAdjustment
} from '$lib/services/domain/recurrence/adjustment/weekday-adjuster';
import type { WeekdayCondition } from '$lib/types/datetime-calendar';

// 祝日集合を渡さない場合、土日だけを祝日として扱う。平日祝日は集合の YYYY-MM-DD で渡す。

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

  describe('平日祝日', () => {
    const holidays = new Set([
      '2025-01-01', // Wednesday
      '2025-02-11', // Tuesday
      '2025-02-14', // Friday
      '2025-05-05', // Monday
      '2025-05-06', // Tuesday
      '2026-01-01' // Thursday
    ]);

    function at(year: number, month: number, day: number, hours = 0, minutes = 0): Date {
      return new Date(year, month - 1, day, hours, minutes, 0, 0);
    }

    function condition(
      ifWeekday: WeekdayCondition['ifWeekday'],
      thenTarget: WeekdayCondition['thenTarget'],
      thenDirection: WeekdayCondition['thenDirection']
    ): WeekdayCondition {
      return {
        id: 'weekday-holiday',
        ifWeekday,
        thenTarget,
        thenDirection
      };
    }

    function expectLocalDate(date: Date, year: number, month: number, day: number): void {
      expect(date.getFullYear()).toBe(year);
      expect(date.getMonth() + 1).toBe(month);
      expect(date.getDate()).toBe(day);
    }

    describe('判定', () => {
      it('集合にある火曜を祝日・土日祝日とみなし、平日非祝日とはみなさない', () => {
        const foundationDay = at(2025, 2, 11);

        expect(
          checkWeekdayCondition(foundationDay, condition('holiday', 'weekday', 'next'), holidays)
        ).toBe(true);
        expect(
          checkWeekdayCondition(
            foundationDay,
            condition('non_holiday', 'weekday', 'next'),
            holidays
          )
        ).toBe(false);
        expect(
          checkWeekdayCondition(
            foundationDay,
            condition('weekend_holiday', 'weekday', 'next'),
            holidays
          )
        ).toBe(true);
        expect(
          checkWeekdayCondition(
            foundationDay,
            condition('non_weekend_holiday', 'weekday', 'next'),
            holidays
          )
        ).toBe(false);
        expect(
          checkWeekdayCondition(foundationDay, condition('weekday', 'weekday', 'next'), holidays)
        ).toBe(true);
        expect(
          checkWeekdayCondition(foundationDay, condition('weekend', 'weekday', 'next'), holidays)
        ).toBe(false);
      });

      it('集合に無い水曜は祝日でも土日祝日でもない', () => {
        const wednesday = at(2025, 2, 12);

        expect(
          checkWeekdayCondition(wednesday, condition('holiday', 'weekday', 'next'), holidays)
        ).toBe(false);
        expect(
          checkWeekdayCondition(wednesday, condition('non_holiday', 'weekday', 'next'), holidays)
        ).toBe(true);
        expect(
          checkWeekdayCondition(
            wednesday,
            condition('weekend_holiday', 'weekday', 'next'),
            holidays
          )
        ).toBe(false);
        expect(
          checkWeekdayCondition(
            wednesday,
            condition('non_weekend_holiday', 'weekday', 'next'),
            holidays
          )
        ).toBe(true);
      });

      it('集合に無い土曜は従来どおり祝日であり、平日非祝日ではない', () => {
        const saturday = at(2025, 2, 15);

        expect(
          checkWeekdayCondition(saturday, condition('holiday', 'weekday', 'next'), holidays)
        ).toBe(true);
        expect(
          checkWeekdayCondition(
            saturday,
            condition('non_weekend_holiday', 'weekday', 'next'),
            holidays
          )
        ).toBe(false);
      });

      it('祝日集合が空、または日時文字列だと平日は祝日にならない', () => {
        const foundationDay = at(2025, 2, 11);

        expect(
          checkWeekdayCondition(foundationDay, condition('holiday', 'weekday', 'next'), new Set())
        ).toBe(false);
        expect(checkWeekdayCondition(foundationDay, condition('holiday', 'weekday', 'next'))).toBe(
          false
        );
        expect(
          checkWeekdayCondition(
            foundationDay,
            condition('holiday', 'weekday', 'next'),
            new Set(['2025-02-11T00:00:00'])
          )
        ).toBe(false);
      });
    });

    describe('移動', () => {
      it('次の祝日は直後の土曜ではなく、集合にある火曜になる', () => {
        const monday = at(2025, 2, 10, 15, 30);
        const result = applyWeekdayAdjustment(
          monday,
          condition('monday', 'holiday', 'next'),
          holidays
        );

        expectLocalDate(result, 2025, 2, 11);
        expect(result.getHours()).toBe(15);
        expect(result.getMinutes()).toBe(30);
        expect(monday.getDate()).toBe(10);
      });

      it('祝日集合が無いと同じ月曜からは次の土曜へ移動する', () => {
        const result = applyWeekdayAdjustment(
          at(2025, 2, 10),
          condition('monday', 'holiday', 'next')
        );

        expectLocalDate(result, 2025, 2, 15);
      });

      it('すでに平日祝日なら次方向でも前方向でもその日のまま', () => {
        const foundationDay = at(2025, 2, 11);

        expectLocalDate(
          applyWeekdayAdjustment(foundationDay, condition('tuesday', 'holiday', 'next'), holidays),
          2025,
          2,
          11
        );
        expectLocalDate(
          applyWeekdayAdjustment(
            foundationDay,
            condition('tuesday', 'holiday', 'previous'),
            holidays
          ),
          2025,
          2,
          11
        );
      });

      it('前の土日祝日は、より近い平日祝日を週末より先に選ぶ', () => {
        const result = applyWeekdayAdjustment(
          at(2025, 2, 12),
          condition('wednesday', 'weekend_holiday', 'previous'),
          holidays
        );

        expectLocalDate(result, 2025, 2, 11);
      });

      it('土曜から前の平日非祝日へ戻るとき、直前の金曜祝日を飛ばす', () => {
        const result = applyWeekdayAdjustment(
          at(2025, 2, 15),
          condition('saturday', 'non_weekend_holiday', 'previous'),
          holidays
        );

        expectLocalDate(result, 2025, 2, 13);
      });

      it('前の祝日は、より近い平日祝日を週末より先に選ぶ', () => {
        const result = applyWeekdayAdjustment(
          at(2025, 2, 13),
          condition('thursday', 'holiday', 'previous'),
          holidays
        );

        expectLocalDate(result, 2025, 2, 11);
      });

      it('前の祝日は、週末の方が近ければ平日祝日まで戻らない', () => {
        const result = applyWeekdayAdjustment(
          at(2025, 2, 17),
          condition('monday', 'holiday', 'previous'),
          holidays
        );

        expectLocalDate(result, 2025, 2, 16);
      });

      it('平日祝日の次の非祝日はその翌日', () => {
        const result = applyWeekdayAdjustment(
          at(2025, 2, 11),
          condition('tuesday', 'non_holiday', 'next'),
          holidays
        );

        expectLocalDate(result, 2025, 2, 12);
      });

      it('平日祝日の前の非祝日はその前日', () => {
        const result = applyWeekdayAdjustment(
          at(2025, 2, 11),
          condition('tuesday', 'non_holiday', 'previous'),
          holidays
        );

        expectLocalDate(result, 2025, 2, 10);
      });

      it('金曜の祝日の次の平日非祝日は、土日を飛ばした月曜', () => {
        const result = applyWeekdayAdjustment(
          at(2025, 2, 14),
          condition('friday', 'non_weekend_holiday', 'next'),
          holidays
        );

        expectLocalDate(result, 2025, 2, 17);
      });

      it('連続する平日祝日を飛ばして次の平日非祝日へ移動する', () => {
        const result = applyWeekdayAdjustment(
          at(2025, 5, 4),
          condition('sunday', 'non_weekend_holiday', 'next'),
          holidays
        );

        expectLocalDate(result, 2025, 5, 7);
      });

      it('連続する平日祝日の前の非祝日は、直前の週末も飛ばす', () => {
        const result = applyWeekdayAdjustment(
          at(2025, 5, 6),
          condition('tuesday', 'non_holiday', 'previous'),
          holidays
        );

        expectLocalDate(result, 2025, 5, 2);
      });

      it('次の土日祝日は、同じ週の後半にある平日祝日より先の土曜を選ぶ', () => {
        const result = applyWeekdayAdjustment(
          at(2025, 5, 1),
          condition('thursday', 'weekend_holiday', 'next'),
          holidays
        );

        expectLocalDate(result, 2025, 5, 3);
      });

      it('平日祝日の方が次の土曜より近いときは、その平日を土日祝日の移動先にする', () => {
        const result = applyWeekdayAdjustment(
          at(2025, 2, 10),
          condition('monday', 'weekend_holiday', 'next'),
          holidays
        );

        expectLocalDate(result, 2025, 2, 11);
      });

      it('年をまたいで次の平日祝日へ移動する', () => {
        const result = applyWeekdayAdjustment(
          at(2025, 12, 31),
          condition('wednesday', 'holiday', 'next'),
          holidays
        );

        expectLocalDate(result, 2026, 1, 1);
      });

      it('年をまたいで前の非祝日へ移動する', () => {
        const result = applyWeekdayAdjustment(
          at(2025, 1, 1),
          condition('wednesday', 'non_holiday', 'previous'),
          holidays
        );

        expectLocalDate(result, 2024, 12, 31);
      });

      it('すでに平日非祝日ならその日のまま', () => {
        const result = applyWeekdayAdjustment(
          at(2025, 2, 12),
          condition('wednesday', 'non_weekend_holiday', 'next'),
          holidays
        );

        expectLocalDate(result, 2025, 2, 12);
      });
    });
  });
});
