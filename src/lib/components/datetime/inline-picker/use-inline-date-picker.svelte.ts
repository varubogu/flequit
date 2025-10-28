import {
  createInlineDatePickerState,
  initializeState,
  updateCurrentDate,
  updateCurrentStartDate
} from '$lib/components/datetime/inline-picker/composables/state.svelte';
import { createEventHandlers } from '$lib/components/datetime/inline-picker/composables/handlers.svelte';
import { setupOutsideClickHandler } from '$lib/components/datetime/inline-picker/composables/outside-click.svelte';
import { setupSyncEffects } from '$lib/components/datetime/inline-picker/composables/effects.svelte';

// Re-export types for backward compatibility
export type {
  DateChangeData,
  UseInlineDatePickerOptions,
  InlineDatePickerState,
  InlineDatePickerReturn
} from './composables/types';

export function useInlineDatePicker(options: import('./composables/types').UseInlineDatePickerOptions) {
  const state = createInlineDatePickerState(options);
  const handlers = createEventHandlers(state, options);

  // Setup sync effects
  setupSyncEffects(state, options);

  return {
    get state() {
      return state;
    },
    initializeState: () => initializeState(state, options),
    setupOutsideClickHandler: (pickerElement: HTMLElement | undefined) =>
      setupOutsideClickHandler(state, options, pickerElement),
    handleDateTimeInputChange: handlers.handleDateTimeInputChange,
    handleCalendarChange: handlers.handleCalendarChange,
    handleRangeChange: handlers.handleRangeChange,
    handleRangeModeChange: handlers.handleRangeModeChange,
    handleRecurrenceEdit: handlers.handleRecurrenceEdit,
    handleRecurrenceSave: handlers.handleRecurrenceSave,
    handleRecurrenceDialogClose: handlers.handleRecurrenceDialogClose,
    updateCurrentDate: (date: string) => updateCurrentDate(state, date),
    updateCurrentStartDate: (date?: string) => updateCurrentStartDate(state, date)
  };
}
