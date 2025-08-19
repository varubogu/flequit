import { CalendarDate } from '@internationalized/date';
import type { RecurrenceRule } from '$lib/types/datetime-calendar';
import { InlineDatePickerState } from './inline-date-picker-state.svelte';
import {
  InlineDatePickerHandlers,
  type DateChangeData
} from './inline-date-picker-handlers.svelte';

export { type DateChangeData };

export class InlineDatePickerLogic {
  private state: InlineDatePickerState;
  private handlers: InlineDatePickerHandlers;

  constructor(
    currentDate?: string,
    currentStartDate?: string,
    isRangeDate?: boolean,
    recurrenceRule?: RecurrenceRule | null,
    onchange?: (data: DateChangeData) => void,
    onclose?: () => void
  ) {
    this.state = new InlineDatePickerState(
      currentDate,
      currentStartDate,
      isRangeDate,
      recurrenceRule
    );

    this.handlers = new InlineDatePickerHandlers(this.state, onchange, onclose);
  }

  // State property getters
  get endDate() {
    return this.state.endDate;
  }
  get endTime() {
    return this.state.endTime;
  }
  get startDate() {
    return this.state.startDate;
  }
  get startTime() {
    return this.state.startTime;
  }
  get useRangeMode() {
    return this.state.useRangeMode;
  }
  get recurrenceDialogOpen() {
    return this.state.recurrenceDialogOpen;
  }
  get currentRecurrenceRule() {
    return this.state.currentRecurrenceRule;
  }

  // State property setters
  set endDate(value: string) {
    this.state.endDate = value;
  }
  set endTime(value: string) {
    this.state.endTime = value;
  }
  set startDate(value: string) {
    this.state.startDate = value;
  }
  set startTime(value: string) {
    this.state.startTime = value;
  }
  set useRangeMode(value: boolean) {
    this.state.useRangeMode = value;
  }
  set recurrenceDialogOpen(value: boolean) {
    this.state.recurrenceDialogOpen = value;
  }
  set currentRecurrenceRule(value: RecurrenceRule | null) {
    this.state.currentRecurrenceRule = value;
  }

  // Delegate methods to state
  updateCurrentDate(currentDate: string) {
    this.state.updateCurrentDate(currentDate);
  }

  updateCurrentStartDate(currentStartDate?: string) {
    this.state.updateCurrentStartDate(currentStartDate);
  }

  updateIsRangeDate(isRangeDate: boolean) {
    this.state.updateIsRangeDate(isRangeDate);
  }

  updateRecurrenceRule(recurrenceRule?: RecurrenceRule | null) {
    this.state.updateRecurrenceRule(recurrenceRule);
  }

  // Delegate methods to handlers
  setupOutsideClickHandler(pickerElement: HTMLElement | undefined, show: boolean) {
    return this.handlers.setupOutsideClickHandler(pickerElement, show);
  }

  handleDateTimeInputChange(data: {
    startDate?: string;
    startTime?: string;
    endDate?: string;
    endTime?: string;
  }) {
    this.handlers.handleDateTimeInputChange(data);
  }

  handleDateChange() {
    this.handlers.handleDateChange();
  }

  handleRangeInputChange() {
    this.handlers.handleRangeInputChange();
  }

  handleCalendarChange(date: CalendarDate) {
    this.handlers.handleCalendarChange(date);
  }

  handleRangeChange(start: CalendarDate, end: CalendarDate) {
    this.handlers.handleRangeChange(start, end);
  }

  handleRangeModeChange(checked: boolean) {
    this.handlers.handleRangeModeChange(checked);
  }

  handleRecurrenceEdit() {
    this.handlers.handleRecurrenceEdit();
  }

  handleRecurrenceSave(rule: RecurrenceRule | null) {
    this.handlers.handleRecurrenceSave(rule);
  }

  handleRecurrenceDialogClose() {
    this.handlers.handleRecurrenceDialogClose();
  }
}
