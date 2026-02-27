import type { InlineDatePickerState, UseInlineDatePickerOptions } from './types';
import {
  updateCurrentDate,
  updateCurrentStartDate
} from '$lib/components/datetime/inline-picker/composables/state.svelte';

function readShow(options: UseInlineDatePickerOptions): boolean {
  return options.getShow?.() ?? options.show ?? false;
}

function readCurrentDate(options: UseInlineDatePickerOptions): string | undefined {
  return options.getCurrentDate?.() ?? options.currentDate;
}

function readCurrentStartDate(options: UseInlineDatePickerOptions): string | undefined {
  return options.getCurrentStartDate?.() ?? options.currentStartDate;
}

function readIsRangeDate(options: UseInlineDatePickerOptions): boolean {
  return options.getIsRangeDate?.() ?? options.isRangeDate ?? false;
}

export function setupSyncEffects(
  state: InlineDatePickerState,
  options: UseInlineDatePickerOptions
) {
  // Sync range mode from options
  $effect(() => {
    const nextMode = readIsRangeDate(options);
    if (nextMode !== state.lastSyncedRangeMode) {
      state.useRangeMode = nextMode;
      state.lastSyncedRangeMode = nextMode;
    }
  });

  // Sync current date from options
  $effect(() => {
    const currentDate = readCurrentDate(options);
    if (readShow(options) && currentDate) {
      updateCurrentDate(state, currentDate);
    }
  });

  // Sync current start date from options
  $effect(() => {
    updateCurrentStartDate(state, readCurrentStartDate(options));
  });
}
