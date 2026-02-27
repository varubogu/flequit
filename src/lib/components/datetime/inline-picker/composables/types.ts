import type { RecurrenceRule } from '$lib/types/datetime-calendar';

export interface DateChangeData {
  date: string;
  dateTime: string;
  range?: { start: string; end: string };
  isRangeDate: boolean;
  recurrenceRule?: RecurrenceRule | null;
}

export interface UseInlineDatePickerOptions {
  getShow?: () => boolean;
  show?: boolean;
  getCurrentDate?: () => string | undefined;
  currentDate?: string;
  getCurrentStartDate?: () => string | undefined;
  currentStartDate?: string;
  getIsRangeDate?: () => boolean | undefined;
  isRangeDate?: boolean;
  getRecurrenceRule?: () => RecurrenceRule | null | undefined;
  recurrenceRule?: RecurrenceRule | null;
  onChange?: (data: DateChangeData) => void;
  onClose?: () => void;
}

export interface InlineDatePickerState {
  endDate: string;
  endTime: string;
  startDate: string;
  startTime: string;
  useRangeMode: boolean;
  recurrenceDialogOpen: boolean;
  currentRecurrenceRule: RecurrenceRule | null;
  lastSyncedRangeMode: boolean;
  lastSyncedRecurrenceRule: RecurrenceRule | null;
}

export interface InlineDatePickerReturn {
  state: InlineDatePickerState;
  initializeState(): void;
  setupOutsideClickHandler(pickerElement: HTMLElement | undefined): (() => void) | undefined;
  handleDateTimeInputChange(data: {
    startDate?: string;
    startTime?: string;
    endDate?: string;
    endTime?: string;
  }): void;
  handleCalendarChange(date: import('@internationalized/date').CalendarDate): void;
  handleRangeChange(
    start: import('@internationalized/date').CalendarDate,
    end: import('@internationalized/date').CalendarDate
  ): void;
  handleRangeModeChange(checked: boolean): void;
  handleRecurrenceEdit(): void;
  handleRecurrenceSave(rule: RecurrenceRule | null): void;
  handleRecurrenceDialogClose(): void;
  updateCurrentDate(date: string): void;
  updateCurrentStartDate(date?: string): void;
}
