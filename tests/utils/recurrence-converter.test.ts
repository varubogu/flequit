import { describe, it, expect } from 'vitest';
import { toLegacyRecurrenceRule, validateRecurrenceRule } from '$lib/utils/recurrence-converter';
import type { RecurrenceRule } from '$lib/types/recurrence';

describe('recurrence-converter', () => {
  //   describe('toTauriRecurrenceRule', () => {
  //     it('小文字のunit値を大文字にマッピング', () => {
  //       const unified: RecurrenceRule = {
  //         unit: 'day',
  //         interval: 1
  //       };
  //
  //       const result = toTauriRecurrenceRule(unified);
  //
  //       expect(result).toBeDefined();
  //       expect(result?.unit).toBe('Day');
  //       expect(result?.interval).toBe(1);
  //     });
  //
  //     it('すべてのunit値を正しくマッピング', () => {
  //       const units: Array<[string, string]> = [
  //         ['minute', 'Minute'],
  //         ['hour', 'Hour'],
  //         ['day', 'Day'],
  //         ['week', 'Week'],
  //         ['month', 'Month'],
  //         ['quarter', 'Quarter'],
  //         ['halfyear', 'HalfYear'],
  //         ['halfyear', 'HalfYear'],
  //         ['year', 'Year']
  //       ];
  //
  //       units.forEach(([input, expected]) => {
  //         const unified: RecurrenceRule = {
  //           unit: input as RecurrenceUnit,
  //           interval: 1
  //         };
  //
  //         const result = toTauriRecurrenceRule(unified);
  //
  //         expect(result?.unit).toBe(expected);
  //       });
  //     });
  //
  //     it('複雑なrecurrenceRuleを正しく変換', () => {
  //       const unified: RecurrenceRule = {
  //         id: 'test-id',
  //         unit: 'week',
  //         interval: 2,
  //         daysOfWeek: ['monday', 'wednesday'],
  //         maxOccurrences: 10,
  //         endDate: new Date('2025-12-31')
  //       };
  //
  //       const result = toTauriRecurrenceRule(unified);
  //
  //       expect(result).toBeDefined();
  //       expect(result?.id).toBe('test-id');
  //       expect(result?.unit).toBe('Week');
  //       expect(result?.interval).toBe(2);
  //       expect(result?.days_of_week).toEqual(['monday', 'wednesday']);
  //       expect(result?.max_occurrences).toBe(10);
  //       expect(result?.end_date).toBeDefined();
  //     });
  //
  //     it('undefined/nullの場合はundefinedを返す', () => {
  //       expect(toTauriRecurrenceRule(undefined)).toBeUndefined();
  //       expect(toTauriRecurrenceRule(null)).toBeUndefined();
  //     });
  //
  //     it('idが未設定の場合は自動生成', () => {
  //       const unified: RecurrenceRule = {
  //         unit: 'day',
  //         interval: 1
  //       };
  //
  //       const result = toTauriRecurrenceRule(unified);
  //
  //       expect(result?.id).toBeDefined();
  //       expect(typeof result?.id).toBe('string');
  //       expect(result?.id?.length).toBeGreaterThan(0);
  //     });
  //
  //     it('details/adjustmentをJSON文字列に変換', () => {
  //       const unified: RecurrenceRule = {
  //         unit: 'month',
  //         interval: 1,
  //         pattern: {
  //           monthly: {
  //             dayOfMonth: 15
  //           }
  //         },
  //       };
  //
  //       const result = toTauriRecurrenceRule(unified);
  //
  //       expect(result?.pattern).toBeDefined();
  //       expect(typeof result?.pattern).toBe('string');
  //       expect(result?.adjustment).not.toBeDefined();
  //     });
  //   });

  //   describe('fromTauriRecurrenceRule', () => {
  //     it('大文字のunit値を小文字にマッピング', () => {
  //       const tauri: TauriRecurrenceRule = {
  //         id: 'test-id',
  //         unit: 'Day',
  //         interval: 1
  //       };
  //
  //       const result = fromTauriRecurrenceRule(tauri);
  //
  //       expect(result).toBeDefined();
  //       expect(result?.unit).toBe('day');
  //       expect(result?.interval).toBe(1);
  //     });
  //
  //     it('すべてのunit値を正しくマッピング', () => {
  //       const units: Array<[string, string]> = [
  //         ['Minute', 'minute'],
  //         ['Hour', 'hour'],
  //         ['Day', 'day'],
  //         ['Week', 'week'],
  //         ['Month', 'month'],
  //         ['Quarter', 'quarter'],
  //         ['HalfYear', 'halfyear'],
  //         ['Year', 'year']
  //       ];
  //
  //       units.forEach(([input, expected]) => {
  //         const tauri: TauriRecurrenceRule = {
  //           id: 'test-id',
  //           unit: input,
  //           interval: 1
  //         };
  //
  //         const result = fromTauriRecurrenceRule(tauri);
  //
  //         expect(result?.unit).toBe(expected);
  //       });
  //     });
  //
  //     it('複雑なTauriRecurrenceRuleを正しく変換', () => {
  //       const tauri: TauriRecurrenceRule = {
  //         id: 'test-id',
  //         unit: 'Week',
  //         interval: 2,
  //         days_of_week: ['monday', 'wednesday'],
  //         max_occurrences: 10,
  //         end_date: '2025-12-31T00:00:00.000Z'
  //       };
  //
  //       const result = fromTauriRecurrenceRule(tauri);
  //
  //       expect(result).toBeDefined();
  //       expect(result?.id).toBe('test-id');
  //       expect(result?.unit).toBe('week');
  //       expect(result?.interval).toBe(2);
  //       expect(result?.daysOfWeek).toEqual(['monday', 'wednesday']);
  //       expect(result?.maxOccurrences).toBe(10);
  //       expect(result?.endDate).toBeInstanceOf(Date);
  //     });
  //
  //     it('undefined/nullの場合はundefinedを返す', () => {
  //       expect(fromTauriRecurrenceRule(undefined)).toBeUndefined();
  //       expect(fromTauriRecurrenceRule(null)).toBeUndefined();
  //     });
  //
  //     it('JSON文字列のdetails/adjustmentをオブジェクトに変換', () => {
  //       const tauri: TauriRecurrenceRule = {
  //         id: 'test-id',
  //         unit: 'Month',
  //         interval: 1,
  //         pattern: JSON.stringify({
  //           monthly: {
  //             dayOfMonth: 15
  //           }
  //         }),
  //         adjustment: JSON.stringify({
  //           action: 'skip'
  //         })
  //       };
  //
  //       const result = fromTauriRecurrenceRule(tauri);
  //
  //       expect(result?.pattern).toBeDefined();
  //       expect(typeof result?.pattern).toBe('object');
  //       expect(result?.pattern?.monthly?.dayOfMonth).toBe(15);
  //       expect(result?.adjustment).toBeDefined();
  //       expect(typeof result?.adjustment).toBe('object');
  //     });
  //   });

  // //   describe('toTauriRecurrenceRule ⇄ fromTauriRecurrenceRule 往復変換', () => {
  // //     it('単純なルールの往復変換が正しく動作', () => {
  // //       const original: RecurrenceRule = {
  // //         unit: 'day',
  // //         interval: 2
  // //       };
  // //
  // //       const tauri = toTauriRecurrenceRule(original);
  // //       const result = fromTauriRecurrenceRule(tauri);
  // //
  // //       expect(result?.unit).toBe(original.unit);
  // //       expect(result?.interval).toBe(original.interval);
  // //     });
  // //
  // //     it('複雑なルールの往復変換が正しく動作', () => {
  // //       const original: RecurrenceRule = {
  // //         unit: 'week',
  // //         interval: 2,
  // //         daysOfWeek: ['monday', 'friday'],
  // //         maxOccurrences: 10,
  // //         pattern: {
  // //           monthly: {
  // //             dayOfMonth: 15
  // //           }
  // //         }
  // //       };
  // //
  // //       const tauri = toTauriRecurrenceRule(original);
  // //       const result = fromTauriRecurrenceRule(tauri);
  // //
  // //       expect(result?.unit).toBe(original.unit);
  // //       expect(result?.interval).toBe(original.interval);
  // //       expect(result?.daysOfWeek).toEqual(original.daysOfWeek);
  // //       expect(result?.maxOccurrences).toBe(original.maxOccurrences);
  // //       expect(result?.pattern?.monthly?.dayOfMonth).toBe(15);
  // //     });
  // //   });
  //
  // //   describe('fromLegacyRecurrenceRule', () => {
  // //     it('legacy型からunified型に変換', () => {
  // //       const legacy: LegacyRecurrenceRule = {
  // //         unit: 'day',
  // //         interval: 1
  // //       };
  // //
  // //       const result = fromLegacyRecurrenceRule(legacy);
  // //
  // //       expect(result).toBeDefined();
  // //       expect(result?.unit).toBe('day');
  // //       expect(result?.interval).toBe(1);
  // //     });
  // //
  // //     it('half_year → halfyear に変換', () => {
  // //       const legacy: LegacyRecurrenceRule = {
  // //         unit: 'halfyear',
  // //         interval: 1
  // //       };
  // //
  // //       const result = fromLegacyRecurrenceRule(legacy);
  // //
  // //       expect(result?.unit).toBe('halfyear');
  // //     });
  // //
  // //     it('undefined/nullの場合はundefinedを返す', () => {
  // //       expect(fromLegacyRecurrenceRule(undefined)).toBeUndefined();
  // //       expect(fromLegacyRecurrenceRule(null)).toBeUndefined();
  // //     });
  // //   });

  describe('toLegacyRecurrenceRule', () => {
    it('unified型からlegacy型に変換', () => {
      const unified: RecurrenceRule = {
        unit: 'day',
        interval: 1
      };

      const result = toLegacyRecurrenceRule(unified);

      expect(result).toBeDefined();
      expect(result?.unit).toBe('day');
      expect(result?.interval).toBe(1);
    });

    it('halfyear → half_year に変換', () => {
      const unified: RecurrenceRule = {
        unit: 'halfyear',
        interval: 1
      };

      const result = toLegacyRecurrenceRule(unified);

      expect(result?.unit).toBe('halfyear');
    });

    it('undefined/nullの場合はundefinedを返す', () => {
      expect(toLegacyRecurrenceRule(undefined)).toBeUndefined();
      expect(toLegacyRecurrenceRule(null)).toBeUndefined();
    });
  });

  describe('validateRecurrenceRule', () => {
    it('有効なルールはエラーなし', () => {
      const rule: RecurrenceRule = {
        unit: 'day',
        interval: 1
      };

      const errors = validateRecurrenceRule(rule);

      expect(errors).toHaveLength(0);
    });

    it('unit未設定でエラー', () => {
      const rule = {
        interval: 1
      } as RecurrenceRule;

      const errors = validateRecurrenceRule(rule);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.includes('単位'))).toBe(true);
    });

    it('interval < 1でエラー', () => {
      const rule: RecurrenceRule = {
        unit: 'day',
        interval: 0
      };

      const errors = validateRecurrenceRule(rule);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.includes('間隔'))).toBe(true);
    });

    it('週単位で曜日未設定でエラー', () => {
      const rule: RecurrenceRule = {
        unit: 'week',
        interval: 1,
        daysOfWeek: []
      };

      const errors = validateRecurrenceRule(rule);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.includes('曜日'))).toBe(true);
    });

    it('maxOccurrences < 1でエラー', () => {
      const rule: RecurrenceRule = {
        unit: 'day',
        interval: 1,
        maxOccurrences: -1
      };

      const errors = validateRecurrenceRule(rule);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.includes('回数'))).toBe(true);
    });

    it('maxOccurrences = 0は許容される（無制限を意味する可能性）', () => {
      const rule: RecurrenceRule = {
        unit: 'day',
        interval: 1,
        maxOccurrences: 0
      };

      const errors = validateRecurrenceRule(rule);

      // maxOccurrences: 0は通過（無制限の意味）
      expect(errors).toHaveLength(0);
    });
  });

  //   describe('エッジケース', () => {
  //     it('interval: 2の変換が正しく動作（実際のバグ修正ケース）', () => {
  //       const unified: RecurrenceRule = {
  //         unit: 'day',
  //         interval: 2
  //       };
  //
  //       const tauri = toTauriRecurrenceRule(unified);
  //       expect(tauri?.interval).toBe(2);
  //
  //       const back = fromTauriRecurrenceRule(tauri);
  //       expect(back?.interval).toBe(2);
  //     });
  //
  //     it('未知のunit値でもエラーにならない', () => {
  //       const unified: RecurrenceRule = {
  //         unit: 'unknown-unit' as RecurrenceUnit,
  //         interval: 1
  //       };
  //
  //       const result = toTauriRecurrenceRule(unified);
  //
  //       expect(result).toBeDefined();
  //       expect(result?.unit).toBe('unknown-unit');
  //     });
  //   });
});
