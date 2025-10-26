import { SvelteDate } from 'svelte/reactivity';
import { formatDate1, formatTime1 } from '$lib/utils/datetime/formatting';
import type { InlineDatePickerState, UseInlineDatePickerOptions } from './types';

export function createInlineDatePickerState(
  options: UseInlineDatePickerOptions
): InlineDatePickerState {
  const state = $state<InlineDatePickerState>({
    endDate: '',
    endTime: '00:00:00',
    startDate: '',
    startTime: '00:00:00',
    useRangeMode: options.isRangeDate ?? false,
    recurrenceDialogOpen: false,
    currentRecurrenceRule: options.recurrenceRule ?? null,
    lastSyncedRangeMode: options.isRangeDate ?? false,
    lastSyncedRecurrenceRule: options.recurrenceRule ?? null
  });
  return state;
}

export function initializeState(
  state: InlineDatePickerState,
  options: UseInlineDatePickerOptions
) {
  state.endDate = options.currentDate ? formatDate1(new SvelteDate(options.currentDate)) : '';
  state.endTime = options.currentDate
    ? formatTime1(new SvelteDate(options.currentDate))
    : '00:00:00';
  state.useRangeMode = options.isRangeDate || false;
  state.lastSyncedRangeMode = state.useRangeMode;
  state.startDate = options.currentStartDate
    ? formatDate1(new SvelteDate(options.currentStartDate))
    : '';
  state.startTime = options.currentStartDate
    ? formatTime1(new SvelteDate(options.currentStartDate))
    : '00:00:00';
  state.currentRecurrenceRule = options.recurrenceRule || null;
  state.lastSyncedRecurrenceRule = state.currentRecurrenceRule;
}

export function updateCurrentDate(state: InlineDatePickerState, date: string) {
  if (!date) return;
  const dateObj = new SvelteDate(date);
  state.endDate = formatDate1(dateObj);
  state.endTime = formatTime1(dateObj);
}

export function updateCurrentStartDate(state: InlineDatePickerState, startDate?: string) {
  if (startDate) {
    const startDateObj = new SvelteDate(startDate);
    state.startDate = formatDate1(startDateObj);
    state.startTime = formatTime1(startDateObj);
  } else {
    state.startDate = '';
    state.startTime = '00:00:00';
  }
}
