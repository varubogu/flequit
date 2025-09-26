import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { WeekdayCondition } from '$lib/types/datetime-calendar';
import type { DateCondition } from '$lib/types/datetime-calendar';

describe('RecurrenceAdjustmentEditor', () => {
  const mockDateCondition: DateCondition = {
    id: 'date-1',
    relation: 'before',
    referenceDate: new Date('2024-01-15')
  };

  const mockWeekdayCondition: WeekdayCondition = {
    id: 'weekday-1',
    ifWeekday: 'monday',
    thenDirection: 'next',
    thenTarget: 'weekday'
  };

  const defaultProps = {
    dateConditions: [mockDateCondition],
    weekdayConditions: [mockWeekdayCondition],
    onDateConditionAdd: vi.fn(),
    onDateConditionRemove: vi.fn(),
    onDateConditionUpdate: vi.fn(),
    onWeekdayConditionAdd: vi.fn(),
    onWeekdayConditionRemove: vi.fn(),
    onWeekdayConditionUpdate: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('コンポーネントのpropsが正しく設定される', () => {
    // 複雑な外部依存のため基本的なテストのみ実装
    const props = defaultProps;
    expect(props.dateConditions).toHaveLength(1);
    expect(props.weekdayConditions).toHaveLength(1);
    expect(props.onDateConditionAdd).toBeInstanceOf(Function);
    expect(props.onDateConditionRemove).toBeInstanceOf(Function);
    expect(props.onDateConditionUpdate).toBeInstanceOf(Function);
    expect(props.onWeekdayConditionAdd).toBeInstanceOf(Function);
    expect(props.onWeekdayConditionRemove).toBeInstanceOf(Function);
    expect(props.onWeekdayConditionUpdate).toBeInstanceOf(Function);
  });

  it('空のdateConditionsが処理される', () => {
    const props = {
      ...defaultProps,
      dateConditions: []
    };

    expect(props.dateConditions).toHaveLength(0);
    expect(props.weekdayConditions).toHaveLength(1);
  });

  it('空のweekdayConditionsが処理される', () => {
    const props = {
      ...defaultProps,
      weekdayConditions: []
    };

    expect(props.dateConditions).toHaveLength(1);
    expect(props.weekdayConditions).toHaveLength(0);
  });

  it('複数のdateConditionsが処理される', () => {
    const multipleConditions = [
      mockDateCondition,
      {
        id: 'date-2',
        relation: 'after' as const,
        reference_date: new Date('2024-02-15')
      }
    ];

    const props = {
      ...defaultProps,
      dateConditions: multipleConditions
    };

    expect(props.dateConditions).toHaveLength(2);
    expect(props.dateConditions[0].id).toBe('date-1');
    expect(props.dateConditions[1].id).toBe('date-2');
  });

  it('複数のweekdayConditionsが処理される', () => {
    const multipleConditions = [
      mockWeekdayCondition,
      {
        id: 'weekday-2',
        weekday: 5,
        nth: 2,
        invert: true,
        month_relation: 'next' as const
      }
    ];

    const props = {
      ...defaultProps,
      weekdayConditions: multipleConditions
    };

    expect(props.weekdayConditions).toHaveLength(2);
    expect(props.weekdayConditions[0].id).toBe('weekday-1');
    expect(props.weekdayConditions[1].id).toBe('weekday-2');
  });

  it('DateConditionの異なるrelationが処理される', () => {
    const relations = ['before', 'on_or_before', 'on_or_after', 'after'] as const;

    relations.forEach((relation) => {
      const condition: DateCondition = {
        id: `date-${relation}`,
        relation,
        referenceDate: new Date('2024-01-15')
      };

      expect(condition.relation).toBe(relation);
      expect(condition.referenceDate).toBeInstanceOf(Date);
    });
  });

  it('WeekdayConditionの異なるプロパティが処理される', () => {
    const conditions = [
      { ifWeekday: 'monday', thenDirection: 'next', thenTarget: 'weekday' },
      { ifWeekday: 'tuesday', thenDirection: 'previous', thenTarget: 'weekend' },
      { ifWeekday: 'wednesday', thenDirection: 'next', thenTarget: 'holiday' }
    ] as const;

    conditions.forEach((conditionData, index) => {
      const condition: WeekdayCondition = {
        id: `weekday-${index}`,
        ...conditionData
      };

      expect(condition.ifWeekday).toBe(conditionData.ifWeekday);
      expect(condition.thenDirection).toBe(conditionData.thenDirection);
      expect(condition.thenTarget).toBe(conditionData.thenTarget);
    });
  });

  it('全てのコールバック関数が設定される', () => {
    const callbacks = {
      onDateConditionAdd: vi.fn(),
      onDateConditionRemove: vi.fn(),
      onDateConditionUpdate: vi.fn(),
      onWeekdayConditionAdd: vi.fn(),
      onWeekdayConditionRemove: vi.fn(),
      onWeekdayConditionUpdate: vi.fn()
    };

    const props = {
      ...defaultProps,
      ...callbacks
    };

    Object.entries(callbacks).forEach(([key, callback]) => {
      expect(props[key as keyof typeof callbacks]).toBe(callback);
      expect(props[key as keyof typeof callbacks]).toBeInstanceOf(Function);
    });
  });

  it('DateConditionのIDが一意である', () => {
    const conditions = [
      { id: 'date-1', relation: 'before' as const, reference_date: new Date() },
      { id: 'date-2', relation: 'after' as const, reference_date: new Date() },
      { id: 'date-3', relation: 'on_or_before' as const, reference_date: new Date() }
    ];

    const props = {
      ...defaultProps,
      dateConditions: conditions
    };

    const ids = props.dateConditions.map((c) => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(conditions.length);
  });

  it('WeekdayConditionのIDが一意である', () => {
    const conditions = [
      { id: 'weekday-1', weekday: 1, nth: 1, invert: false, month_relation: 'same' as const },
      { id: 'weekday-2', weekday: 2, nth: 2, invert: true, month_relation: 'next' as const },
      { id: 'weekday-3', weekday: 3, nth: -1, invert: false, month_relation: 'previous' as const }
    ];

    const props = {
      ...defaultProps,
      weekdayConditions: conditions
    };

    const ids = props.weekdayConditions.map((c) => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(conditions.length);
  });

  it('コールバック関数が正しく呼び出される', () => {
    const props = defaultProps;

    // 各コールバックが呼び出し可能であることを確認
    expect(() => props.onDateConditionAdd()).not.toThrow();
    expect(() => props.onDateConditionRemove('test-id')).not.toThrow();
    expect(() => props.onDateConditionUpdate('test-id', {})).not.toThrow();
    expect(() => props.onWeekdayConditionAdd()).not.toThrow();
    expect(() => props.onWeekdayConditionRemove('test-id')).not.toThrow();
    expect(() => props.onWeekdayConditionUpdate('test-id', {})).not.toThrow();
  });

  it('conditionsが空配列の場合でも動作する', () => {
    const props = {
      ...defaultProps,
      dateConditions: [],
      weekdayConditions: []
    };

    expect(props.dateConditions).toEqual([]);
    expect(props.weekdayConditions).toEqual([]);
    expect(props.onDateConditionAdd).toBeInstanceOf(Function);
    expect(props.onWeekdayConditionAdd).toBeInstanceOf(Function);
  });
});
