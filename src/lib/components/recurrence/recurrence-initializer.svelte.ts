import type { RecurrenceRule } from "$lib/types/datetime-calendar";
import type { RecurrenceLevel } from "$lib/types/datetime-calendar";
import { RecurrenceState } from './recurrence-state.svelte';
import { DateConditionManager } from './date-condition-manager.svelte';
import { WeekdayConditionManager } from './weekday-condition-manager.svelte';

export class RecurrenceInitializer {
  static initializeFromRule(
    rule: RecurrenceRule | null,
    state: RecurrenceState,
    dateConditionManager: DateConditionManager,
    weekdayConditionManager: WeekdayConditionManager
  ) {
    // Determine recurrence level
    const recurrenceLevel: RecurrenceLevel = !rule
      ? 'disabled'
      : (rule.adjustment &&
            (rule.adjustment.date_conditions.length > 0 ||
              rule.adjustment.weekday_conditions.length > 0)) ||
          (rule.details && Object.keys(rule.details).length > 0)
        ? 'advanced'
        : 'enabled';

    // Initialize state
    state.recurrenceLevel = recurrenceLevel;
    state.setUnit(rule?.unit || 'day');
    state.setInterval(rule?.interval || 1);
    state.setDaysOfWeek(rule?.days_of_week || []);
    state.setDetails(rule?.details || {});
    state.endDate = rule?.end_date;
    state.repeatCount = rule?.max_occurrences;

    // Initialize condition managers
    dateConditionManager.setConditions(rule?.adjustment?.date_conditions || []);
    weekdayConditionManager.setConditions(rule?.adjustment?.weekday_conditions || []);
  }
}