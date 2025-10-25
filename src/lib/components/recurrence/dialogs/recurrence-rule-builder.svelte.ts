import type { RecurrenceRule, RecurrencePattern, RecurrenceUnit, DayOfWeek } from '$lib/types/recurrence';
import type { RecurrenceLevel, DateCondition, WeekdayCondition } from '$lib/types/datetime-calendar';

export class RecurrenceRuleBuilder {
  buildRule(
    recurrenceLevel: RecurrenceLevel,
    unit: RecurrenceUnit,
    interval: number,
    daysOfWeek: DayOfWeek[],
    pattern: RecurrencePattern,
    dateConditions: DateCondition[],
    weekdayConditions: WeekdayCondition[],
    endDate: Date | undefined,
    repeatCount: number | undefined,
    showAdvancedSettings: boolean
  ): RecurrenceRule | null {
    if (recurrenceLevel === 'disabled') return null;

    const isComplexUnit = ['year', 'halfyear', 'quarter', 'month', 'week'].includes(unit);

    const rule: RecurrenceRule = {
      unit,
      interval,
      ...(unit === 'week' && daysOfWeek.length > 0 && { daysOfWeek: daysOfWeek }),
      ...(showAdvancedSettings && isComplexUnit && Object.keys(pattern).length > 0 && { pattern }),
      ...(showAdvancedSettings &&
        (dateConditions.length > 0 || weekdayConditions.length > 0) && {
          adjustment: {
            dateConditions: dateConditions,
            weekdayConditions: weekdayConditions
          }
        }),
      ...(endDate && { endDate: endDate }),
      ...(repeatCount && repeatCount > 0 && { maxOccurrences: repeatCount })
    };

    return rule;
  }
}
