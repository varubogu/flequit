import { formatDate1, formatTime1 } from '$lib/utils/datetime-utils';
import type { RecurrenceRule } from '$lib/types/datetime-calendar';
import { SvelteDate } from 'svelte/reactivity';

export class InlineDatePickerState {
  // State
  endDate = $state('');
  endTime = $state('00:00:00');
  startDate = $state('');
  startTime = $state('00:00:00');
  useRangeMode = $state(false);
  recurrenceDialogOpen = $state(false);
  currentRecurrenceRule = $state<RecurrenceRule | null>(null);

  constructor(
    currentDate?: string,
    currentStartDate?: string,
    isRangeDate?: boolean,
    recurrenceRule?: RecurrenceRule | null
  ) {
    // Initialize state
    this.endDate = currentDate ? formatDate1(new SvelteDate(currentDate)) : '';
    this.endTime = currentDate ? formatTime1(new SvelteDate(currentDate)) : '00:00:00';
    this.useRangeMode = isRangeDate || false;
    this.startDate = currentStartDate ? formatDate1(new SvelteDate(currentStartDate)) : '';
    this.startTime = currentStartDate ? formatTime1(new SvelteDate(currentStartDate)) : '00:00:00';
    this.currentRecurrenceRule = recurrenceRule || null;
  }

  // Methods to update from parent props
  updateCurrentDate(currentDate: string) {
    if (currentDate && typeof currentDate === 'string') {
      const date = new SvelteDate(currentDate);
      this.endDate = formatDate1(date);
      this.endTime = formatTime1(date);
    }
  }

  updateCurrentStartDate(currentStartDate?: string) {
    if (currentStartDate && typeof currentStartDate === 'string') {
      const startDateObj = new SvelteDate(currentStartDate);
      this.startDate = formatDate1(startDateObj);
      this.startTime = formatTime1(startDateObj);
    } else {
      this.startDate = '';
      this.startTime = '00:00:00';
    }
  }

  updateIsRangeDate(isRangeDate: boolean) {
    this.useRangeMode = isRangeDate;
  }

  updateRecurrenceRule(recurrenceRule?: RecurrenceRule | null) {
    this.currentRecurrenceRule = recurrenceRule || null;
  }
}
