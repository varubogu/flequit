import type { RecurrenceRule } from '$lib/types/datetime-calendar';
import type { RecurrenceLevel } from '$lib/types/datetime-calendar';
import type { RecurrenceUnit } from '$lib/types/datetime-calendar';
import type { DayOfWeek } from '$lib/types/datetime-calendar';
import type { RecurrenceDetails } from '$lib/types/datetime-calendar';
import type { DateCondition } from '$lib/types/datetime-calendar';
import type { WeekdayCondition } from '$lib/types/datetime-calendar';

export class RecurrenceRuleBuilder {
  buildRule(
    recurrenceLevel: RecurrenceLevel,
    unit: RecurrenceUnit,
    interval: number,
    daysOfWeek: DayOfWeek[],
    details: RecurrenceDetails,
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
      ...(showAdvancedSettings && isComplexUnit && Object.keys(details).length > 0 && { details }),
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
