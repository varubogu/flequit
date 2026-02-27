import { SvelteDate } from 'svelte/reactivity';
import { formatDate1, formatTime1 } from '$lib/utils/datetime/formatting';
import type { InlineDatePickerState, UseInlineDatePickerOptions } from './types';

function readCurrentDate(options: UseInlineDatePickerOptions): string | undefined {
  return options.getCurrentDate?.() ?? options.currentDate;
}

function readCurrentStartDate(options: UseInlineDatePickerOptions): string | undefined {
  return options.getCurrentStartDate?.() ?? options.currentStartDate;
}

function readIsRangeDate(options: UseInlineDatePickerOptions): boolean {
  return options.getIsRangeDate?.() ?? options.isRangeDate ?? false;
}

function readRecurrenceRule(options: UseInlineDatePickerOptions) {
  return options.getRecurrenceRule?.() ?? options.recurrenceRule ?? null;
}

export function createInlineDatePickerState(
  options: UseInlineDatePickerOptions
): InlineDatePickerState {
  const isRangeDate = readIsRangeDate(options);
  const recurrenceRule = readRecurrenceRule(options);

  const state = $state<InlineDatePickerState>({
    endDate: '',
    endTime: '00:00:00',
    startDate: '',
    startTime: '00:00:00',
    useRangeMode: isRangeDate ?? false,
    recurrenceDialogOpen: false,
    currentRecurrenceRule: recurrenceRule ?? null,
    lastSyncedRangeMode: isRangeDate ?? false,
    lastSyncedRecurrenceRule: recurrenceRule ?? null
  });
  return state;
}

export function initializeState(state: InlineDatePickerState, options: UseInlineDatePickerOptions) {
  const currentDate = readCurrentDate(options);
  const currentStartDate = readCurrentStartDate(options);
  const isRangeDate = readIsRangeDate(options);
  const recurrenceRule = readRecurrenceRule(options);

  state.endDate = currentDate ? formatDate1(new SvelteDate(currentDate)) : '';
  state.endTime = currentDate
    ? formatTime1(new SvelteDate(currentDate))
    : '00:00:00';
  state.useRangeMode = isRangeDate || false;
  state.lastSyncedRangeMode = state.useRangeMode;
  state.startDate = currentStartDate
    ? formatDate1(new SvelteDate(currentStartDate))
    : '';
  state.startTime = currentStartDate
    ? formatTime1(new SvelteDate(currentStartDate))
    : '00:00:00';
  state.currentRecurrenceRule = recurrenceRule || null;
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
