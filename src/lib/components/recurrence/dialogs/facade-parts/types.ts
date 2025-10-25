import type { RecurrenceRule } from '$lib/types/datetime-calendar';
import type { RecurrenceLevel } from '$lib/types/datetime-calendar';
import type { RecurrenceUnit, DayOfWeek, RecurrencePattern } from '$lib/types/recurrence';
import type { DateCondition, WeekdayCondition } from '$lib/types/datetime-calendar';

export interface RecurrenceDialogContext {
  startDateTime?: Date;
  endDateTime?: Date;
  isRangeDate?: boolean;
}

export interface RecurrenceDialogLogic {
  recurrenceLevel: RecurrenceLevel;
  unit: RecurrenceUnit;
  interval: number;
  daysOfWeek: DayOfWeek[];
  details: RecurrencePattern;
  endDate: Date | undefined;
  repeatCount: number | undefined;
  previewDates: Date[];
  displayCount: number;
  dateConditions: DateCondition[];
  weekdayConditions: WeekdayCondition[];
  showBasicSettings: boolean;
  showAdvancedSettings: boolean;
  isComplexUnit: boolean;
  recurrenceSettings: string;
  startDateTime?: Date;
  endDateTime?: Date;
  isRangeDate?: boolean;
  toggleDayOfWeek(day: DayOfWeek): void;
  addDateCondition(): void;
  removeDateCondition(id: string): void;
  updateDateCondition(id: string, updates: Partial<DateCondition>): void;
  addWeekdayCondition(): void;
  removeWeekdayCondition(id: string): void;
  updateWeekdayCondition(id: string, updates: Partial<WeekdayCondition>): void;
  setUnit(newUnit: RecurrenceUnit): void;
  setInterval(newInterval: number): void;
  setDaysOfWeek(newDaysOfWeek: DayOfWeek[]): void;
  setDetails(newDetails: RecurrencePattern): void;
  setRepeatCount(value: number | undefined): void;
}

export interface RecurrenceDialogFacade {
  readonly logic: RecurrenceDialogLogic;
  setRecurrenceRule(rule: RecurrenceRule | null): void;
  setOpen(open: boolean): void;
  setContext(context: RecurrenceDialogContext): void;
  setRecurrenceSettingsMessage(message: string): void;
}

export interface RecurrenceDialogOptions {
  onSave?: (rule: RecurrenceRule | null) => void;
}
