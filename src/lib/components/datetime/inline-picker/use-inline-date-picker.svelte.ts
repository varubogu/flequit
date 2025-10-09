import { CalendarDate } from '@internationalized/date';
import type { RecurrenceRule } from '$lib/types/datetime-calendar';
import { formatDate1, formatTime1 } from '$lib/utils/datetime/formatting';
import { SvelteDate } from 'svelte/reactivity';

export interface DateChangeData {
  date: string;
  dateTime: string;
  range?: { start: string; end: string };
  isRangeDate: boolean;
  recurrenceRule?: RecurrenceRule | null;
}

interface UseInlineDatePickerOptions {
  show: boolean;
  currentDate?: string;
  currentStartDate?: string;
  isRangeDate?: boolean;
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
  handleCalendarChange(date: CalendarDate): void;
  handleRangeChange(start: CalendarDate, end: CalendarDate): void;
  handleRangeModeChange(checked: boolean): void;
  handleRecurrenceEdit(): void;
  handleRecurrenceSave(rule: RecurrenceRule | null): void;
  handleRecurrenceDialogClose(): void;
  updateCurrentDate(date: string): void;
  updateCurrentStartDate(date?: string): void;
}

export function useInlineDatePicker(options: UseInlineDatePickerOptions) {
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

  function initializeState() {
    state.endDate = options.currentDate ? formatDate1(new SvelteDate(options.currentDate)) : '';
    state.endTime = options.currentDate ? formatTime1(new SvelteDate(options.currentDate)) : '00:00:00';
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

  function updateCurrentDate(date: string) {
    if (!date) return;
    const dateObj = new SvelteDate(date);
    state.endDate = formatDate1(dateObj);
    state.endTime = formatTime1(dateObj);
  }

  function updateCurrentStartDate(startDate?: string) {
    if (startDate) {
      const startDateObj = new SvelteDate(startDate);
      state.startDate = formatDate1(startDateObj);
      state.startTime = formatTime1(startDateObj);
    } else {
      state.startDate = '';
      state.startTime = '00:00:00';
    }
  }

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

  function setupOutsideClickHandler(pickerElement: HTMLElement | undefined) {
    if (!options.show || !pickerElement) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (state.recurrenceDialogOpen) return;
      if (pickerElement && !pickerElement.contains(event.target as Node)) {
        options.onClose?.();
      }
    };

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (state.recurrenceDialogOpen) {
          state.recurrenceDialogOpen = false;
          return;
        }
        options.onClose?.();
      }
    };

    setTimeout(() => {
      document.addEventListener('click', handleClickOutside, true);
      document.addEventListener('keydown', handleKeydown, true);
    }, 50);

    return () => {
      document.removeEventListener('click', handleClickOutside, true);
      document.removeEventListener('keydown', handleKeydown, true);
    };
  }

  $effect(() => {
    const nextMode = options.isRangeDate ?? false;
    if (nextMode !== state.lastSyncedRangeMode) {
      state.useRangeMode = nextMode;
      state.lastSyncedRangeMode = nextMode;
    }
  });

  $effect(() => {
    const nextRule = options.recurrenceRule ?? null;
    if (nextRule !== state.lastSyncedRecurrenceRule) {
      state.currentRecurrenceRule = nextRule;
      state.lastSyncedRecurrenceRule = nextRule;
    }
  });

  $effect(() => {
    if (options.show && options.currentDate) {
      updateCurrentDate(options.currentDate);
    }
  });

  $effect(() => {
    updateCurrentStartDate(options.currentStartDate);
  });

  return {
    get state() {
      return state;
    },
    initializeState,
    setupOutsideClickHandler,
    handleDateTimeInputChange,
    handleCalendarChange,
    handleRangeChange,
    handleRangeModeChange,
    handleRecurrenceEdit,
    handleRecurrenceSave,
    handleRecurrenceDialogClose,
    updateCurrentDate,
    updateCurrentStartDate
  };
}


