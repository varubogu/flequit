import type { InlineDatePickerState, UseInlineDatePickerOptions } from './types';
import { updateCurrentDate, updateCurrentStartDate } from './state.svelte';

export function setupSyncEffects(
  state: InlineDatePickerState,
  options: UseInlineDatePickerOptions
) {
  // Sync range mode from options
  $effect(() => {
    const nextMode = options.isRangeDate ?? false;
    if (nextMode !== state.lastSyncedRangeMode) {
      state.useRangeMode = nextMode;
      state.lastSyncedRangeMode = nextMode;
    }
  });

  // Sync recurrence rule from options
  $effect(() => {
    const nextRule = options.recurrenceRule ?? null;
    if (nextRule !== state.lastSyncedRecurrenceRule) {
      state.currentRecurrenceRule = nextRule;
      state.lastSyncedRecurrenceRule = nextRule;
    }
  });

  // Sync current date from options
  $effect(() => {
    if (options.show && options.currentDate) {
      updateCurrentDate(state, options.currentDate);
    }
  });

  // Sync current start date from options
  $effect(() => {
    updateCurrentStartDate(state, options.currentStartDate);
  });
}
