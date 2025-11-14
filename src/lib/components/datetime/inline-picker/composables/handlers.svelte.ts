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
    console.log('[InlineDatePicker.handleDateChange] 呼び出し:', { endDate: state.endDate, endTime: state.endTime });
    if (!state.endDate) return;
    const dateTime = `${state.endDate}T${state.endTime}`;
    console.log('[InlineDatePicker.handleDateChange] emitChange呼び出し:', {
      date: state.endDate,
      dateTime,
      isRangeDate: false,
      recurrenceRule: state.currentRecurrenceRule
    });
    emitChange({
      date: state.endDate,
      dateTime,
      isRangeDate: false,
      recurrenceRule: state.currentRecurrenceRule
    });
  }

  function handleRangeInputChange() {
    console.log('[InlineDatePicker.handleRangeInputChange] 呼び出し:', { 
      startDate: state.startDate, 
      endDate: state.endDate,
      startTime: state.startTime,
      endTime: state.endTime
    });
    if (!state.startDate && !state.endDate) return;
    console.log('[InlineDatePicker.handleRangeInputChange] emitChange呼び出し:', {
      date: state.startDate || state.endDate || '',
      dateTime: `${state.startDate || state.endDate || ''}T${state.startTime}`,
      range: state.startDate && state.endDate ? {
        start: `${state.startDate}T${state.startTime}`,
        end: `${state.endDate}T${state.endTime}`
      } : undefined,
      isRangeDate: true,
      recurrenceRule: state.currentRecurrenceRule
    });
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
    console.log('[InlineDatePicker.handleRecurrenceSave] 開始:', rule);
    console.log('[InlineDatePicker.handleRecurrenceSave] 現在の状態:', {
      useRangeMode: state.useRangeMode,
      startDate: state.startDate,
      endDate: state.endDate,
      startTime: state.startTime,
      endTime: state.endTime
    });
    
    state.currentRecurrenceRule = rule;
    state.lastSyncedRecurrenceRule = rule;

    console.log('[InlineDatePicker.handleRecurrenceSave] state更新完了、emitChange呼び出し開始');
    if (state.useRangeMode) {
      handleRangeInputChange();
    } else {
      handleDateChange();
    }
    console.log('[InlineDatePicker.handleRecurrenceSave] 完了');
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
