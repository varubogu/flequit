import type {
  RecurrenceLevel,
  DateCondition,
  WeekdayCondition
} from '$lib/types/datetime-calendar';
import type { RecurrenceUnit, DayOfWeek, RecurrencePattern } from '$lib/types/recurrence';

export interface RecurrenceStateSnapshot {
  recurrenceLevel: RecurrenceLevel;
  unit: RecurrenceUnit;
  interval: number;
  daysOfWeek: DayOfWeek[];
  details: RecurrencePattern;
  endDate?: Date;
  repeatCount?: number;
  dateConditions: DateCondition[];
  weekdayConditions: WeekdayCondition[];
}

export class RecurrenceState {
  // Basic recurrence settings
  recurrenceLevel = $state<RecurrenceLevel>('disabled');
  unit = $state<RecurrenceUnit>('day');
  interval = $state(1);
  daysOfWeek = $state<DayOfWeek[]>([]);
  details = $state<RecurrencePattern>({});

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

  toSnapshot(): RecurrenceStateSnapshot {
    return {
      recurrenceLevel: this.recurrenceLevel,
      unit: this.unit,
      interval: this.interval,
      daysOfWeek: [...this.daysOfWeek],
      details: { ...this.details },
      endDate: this.endDate,
      repeatCount: this.repeatCount,
      dateConditions: [...this.dateConditions],
      weekdayConditions: [...this.weekdayConditions]
    };
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

  setDetails(details: RecurrencePattern) {
    this.details = details;
  }

  toggleDayOfWeek(day: DayOfWeek) {
    this.daysOfWeek = this.daysOfWeek.includes(day)
      ? this.daysOfWeek.filter((d) => d !== day)
      : [...this.daysOfWeek, day];
  }
}
