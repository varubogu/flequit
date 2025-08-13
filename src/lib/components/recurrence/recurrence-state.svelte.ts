import type { RecurrenceLevel } from "$lib/types/datetime-calendar";
import type { RecurrenceUnit } from "$lib/types/datetime-calendar";
import type { DayOfWeek } from "$lib/types/datetime-calendar";
import type { RecurrenceDetails } from "$lib/types/datetime-calendar";
import type { DateCondition } from "$lib/types/datetime-calendar";
import type { WeekdayCondition } from "$lib/types/datetime-calendar";

export class RecurrenceState {
  // Basic recurrence settings
  recurrenceLevel = $state<RecurrenceLevel>('disabled');
  unit = $state<RecurrenceUnit>('day');
  interval = $state(1);
  daysOfWeek = $state<DayOfWeek[]>([]);
  details = $state<RecurrenceDetails>({});
  
  // End conditions
  endDate = $state<Date | undefined>(undefined);
  repeatCount = $state<number | undefined>(undefined);
  
  // Adjustment conditions
  dateConditions = $state<DateCondition[]>([]);
  weekdayConditions = $state<WeekdayCondition[]>([]);

  // Computed properties
  get showBasicSettings() {
    return this.recurrenceLevel !== 'disabled';
  }

  get showAdvancedSettings() {
    return this.recurrenceLevel === 'advanced';
  }

  // Setters
  setUnit(unit: RecurrenceUnit) {
    this.unit = unit;
  }

  setInterval(interval: number) {
    this.interval = interval;
  }

  setDaysOfWeek(daysOfWeek: DayOfWeek[]) {
    this.daysOfWeek = daysOfWeek;
  }

  setDetails(details: RecurrenceDetails) {
    this.details = details;
  }

  toggleDayOfWeek(day: DayOfWeek) {
    this.daysOfWeek = this.daysOfWeek.includes(day)
      ? this.daysOfWeek.filter((d) => d !== day)
      : [...this.daysOfWeek, day];
  }
}