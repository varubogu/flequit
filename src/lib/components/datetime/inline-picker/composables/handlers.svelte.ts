import type { CalendarDate } from '@internationalized/date';
import type { RecurrenceRule } from '$lib/types/datetime-calendar';
import type { InlineDatePickerState, DateChangeData, UseInlineDatePickerOptions } from './types';

export function createEventHandlers(
  state: InlineDatePickerState,
  options: UseInlineDatePickerOptions
) {
  function emitChange(data: DateChangeData) {
    options.onChange?.(data);
  }

  function handleDateChange() {
    if (!state.endDate) return;
    const dateTime = `${state.endDate}T${state.endTime}`;
    emitChange({
      date: state.endDate,
      dateTime,
      isRangeDate: false,
      recurrenceRule: state.currentRecurrenceRule
    });
  }

  function handleRangeInputChange() {
    if (!state.startDate && !state.endDate) return;
    emitChange({
      date: state.startDate || state.endDate || '',
      dateTime: `${state.startDate || state.endDate || ''}T${state.startTime}`,
      range:
        state.startDate && state.endDate
          ? {
              start: `${state.startDate}T${state.startTime}`,
              end: `${state.endDate}T${state.endTime}`
            }
          : undefined,
      isRangeDate: true,
      recurrenceRule: state.currentRecurrenceRule
    });
  }

  function handleDateTimeInputChange(data: {
    startDate?: string;
    startTime?: string;
    endDate?: string;
    endTime?: string;
  }) {
    if (data.startDate !== undefined) state.startDate = data.startDate;
    if (data.startTime !== undefined) state.startTime = data.startTime;
    if (data.endDate !== undefined) state.endDate = data.endDate;
    if (data.endTime !== undefined) state.endTime = data.endTime;

    if (state.useRangeMode) {
      handleRangeInputChange();
    } else {
      handleDateChange();
    }
  }

  function handleCalendarChange(date: CalendarDate) {
    state.endDate = date.toString();
    const dateTime = `${state.endDate}T${state.endTime}`;
    emitChange({
      date: state.endDate,
      dateTime,
      isRangeDate: false,
      recurrenceRule: state.currentRecurrenceRule
    });
  }

  function handleRangeChange(start: CalendarDate, end: CalendarDate) {
    state.startDate = start.toString();
    state.endDate = end.toString();
    emitChange({
      date: state.startDate,
      dateTime: `${state.startDate}T${state.startTime}`,
      range: {
        start: `${state.startDate}T${state.startTime}`,
        end: `${state.endDate}T${state.endTime}`
      },
      isRangeDate: true,
      recurrenceRule: state.currentRecurrenceRule
    });
  }

  function handleRangeModeChange(checked: boolean) {
    state.useRangeMode = checked;
    state.lastSyncedRangeMode = checked;
    emitChange({
      date: state.endDate || '',
      dateTime: `${state.endDate || ''}T${state.endTime}`,
      isRangeDate: checked,
      recurrenceRule: state.currentRecurrenceRule
    });
  }

  function handleRecurrenceEdit() {
    state.recurrenceDialogOpen = true;
  }

  function handleRecurrenceSave(rule: RecurrenceRule | null) {
    state.currentRecurrenceRule = rule;
    state.lastSyncedRecurrenceRule = rule;

    if (state.useRangeMode) {
      handleRangeInputChange();
    } else {
      handleDateChange();
    }
  }

  function handleRecurrenceDialogClose() {
    state.recurrenceDialogOpen = false;
  }

  return {
    handleDateTimeInputChange,
    handleCalendarChange,
    handleRangeChange,
    handleRangeModeChange,
    handleRecurrenceEdit,
    handleRecurrenceSave,
    handleRecurrenceDialogClose
  };
}
