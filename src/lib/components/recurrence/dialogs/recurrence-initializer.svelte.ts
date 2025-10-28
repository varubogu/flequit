import type { RecurrenceRule } from '$lib/types/datetime-calendar';
import type { RecurrenceLevel } from '$lib/types/datetime-calendar';
import { RecurrenceState } from '$lib/components/recurrence/dialogs/recurrence-state.svelte';
import { DateConditionManager } from '$lib/components/recurrence/date-conditions/date-condition-manager.svelte';
import { WeekdayConditionManager } from '$lib/components/recurrence/weekday-conditions/weekday-condition-manager.svelte';

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
            ((rule.adjustment.dateConditions?.length ?? 0) > 0 ||
              (rule.adjustment.weekdayConditions?.length ?? 0) > 0)) ||
          (rule.pattern && Object.keys(rule.pattern).length > 0)
        ? 'advanced'
        : 'enabled';

    // Initialize state
    state.recurrenceLevel = recurrenceLevel;
    state.setUnit(rule?.unit || 'day');
    state.setInterval(rule?.interval || 1);
    state.setDaysOfWeek(rule?.daysOfWeek || []);
    state.setDetails(rule?.pattern || {});
    state.endDate = rule?.endDate;
    state.repeatCount = rule?.maxOccurrences;

    // Initialize condition managers
    dateConditionManager.setConditions(rule?.adjustment?.dateConditions || []);
    weekdayConditionManager.setConditions(rule?.adjustment?.weekdayConditions || []);
  }
}
