import { CalendarDate } from '@internationalized/date';
import { formatDate1, formatTime1 } from '$lib/utils/datetime-utils';
import type { RecurrenceRule } from '$lib/types/task';
import { SvelteDate } from 'svelte/reactivity';

export interface DateChangeData {
  date: string;
  dateTime: string;
  range?: { start: string; end: string };
  isRangeDate: boolean;
  recurrenceRule?: RecurrenceRule | null;
}

export class InlineDatePickerLogic {
  // State
  endDate = $state('');
  endTime = $state('00:00:00');
  startDate = $state('');
  startTime = $state('00:00:00');
  useRangeMode = $state(false);
  recurrenceDialogOpen = $state(false);
  currentRecurrenceRule = $state<RecurrenceRule | null>(null);

  // Callbacks
  private onchange?: (data: DateChangeData) => void;
  private onclose?: () => void;

  constructor(
    currentDate?: string,
    currentStartDate?: string,
    isRangeDate?: boolean,
    recurrenceRule?: RecurrenceRule | null,
    onchange?: (data: DateChangeData) => void,
    onclose?: () => void
  ) {
    this.onchange = onchange;
    this.onclose = onclose;

    // Initialize state
    this.endDate = currentDate ? formatDate1(new SvelteDate(currentDate)) : '';
    this.endTime = currentDate ? formatTime1(new SvelteDate(currentDate)) : '00:00:00';
    this.useRangeMode = isRangeDate || false;
    this.startDate = currentStartDate ? formatDate1(new SvelteDate(currentStartDate)) : '';
    this.startTime = currentStartDate ? formatTime1(new SvelteDate(currentStartDate)) : '00:00:00';
    this.currentRecurrenceRule = recurrenceRule || null;

    // Set up effects for prop synchronization
    this.setupEffects();
  }

  private setupEffects() {
    // Note: In a real implementation, these would be called from the parent component
    // when props change. For now, we provide update methods.
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

  // Event handling for outside clicks
  setupOutsideClickHandler(pickerElement: HTMLElement | undefined, show: boolean) {
    if (!show || !pickerElement) return;

    const handleClickOutside = (event: MouseEvent) => {
      // 繰り返しダイアログが開いている場合は期日ダイアログを閉じない
      if (this.recurrenceDialogOpen) return;

      if (pickerElement && !pickerElement.contains(event.target as Node)) {
        this.onclose?.();
      }
    };

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // 繰り返しダイアログが開いている場合は、まず繰り返しダイアログを閉じる
        if (this.recurrenceDialogOpen) {
          this.recurrenceDialogOpen = false;
          return;
        }
        this.onclose?.();
      }
    };

    // Add a small delay to avoid immediate closing when opening
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside, true);
      document.addEventListener('keydown', handleKeydown, true);
    }, 50);

    return () => {
      document.removeEventListener('click', handleClickOutside, true);
      document.removeEventListener('keydown', handleKeydown, true);
    };
  }

  // Input change handlers
  handleDateTimeInputChange(data: {
    startDate?: string;
    startTime?: string;
    endDate?: string;
    endTime?: string;
  }) {
    if (data.startDate !== undefined) this.startDate = data.startDate;
    if (data.startTime !== undefined) this.startTime = data.startTime;
    if (data.endDate !== undefined) this.endDate = data.endDate;
    if (data.endTime !== undefined) this.endTime = data.endTime;

    if (this.useRangeMode) {
      this.handleRangeInputChange();
    } else {
      this.handleDateChange();
    }
  }

  handleDateChange() {
    if (this.endDate) {
      const date = this.endDate;
      const dateTime = `${this.endDate}T${this.endTime}`;

      this.onchange?.({
        date,
        dateTime,
        isRangeDate: false,
        recurrenceRule: this.currentRecurrenceRule
      });
    }
  }

  handleRangeInputChange() {
    if (this.startDate || this.endDate) {
      const eventDetail = {
        date: this.startDate || this.endDate || '',
        dateTime: `${this.startDate || this.endDate || ''}T${this.startTime}`,
        range:
          this.startDate && this.endDate
            ? {
                start: `${this.startDate}T${this.startTime}`,
                end: `${this.endDate}T${this.endTime}`
              }
            : undefined,
        isRangeDate: true,
        recurrenceRule: this.currentRecurrenceRule
      };

      this.onchange?.(eventDetail);
    }
  }

  handleCalendarChange(date: CalendarDate) {
    this.endDate = date.toString();
    const dateTime = `${this.endDate}T${this.endTime}`;

    this.onchange?.({
      date: this.endDate,
      dateTime,
      isRangeDate: false,
      recurrenceRule: this.currentRecurrenceRule
    });
  }

  handleRangeChange(start: CalendarDate, end: CalendarDate) {
    this.startDate = start.toString();
    this.endDate = end.toString();

    const eventDetail = {
      date: this.startDate,
      dateTime: `${this.startDate}T${this.startTime}`,
      range: {
        start: `${this.startDate}T${this.startTime}`,
        end: `${this.endDate}T${this.endTime}`
      },
      isRangeDate: true,
      recurrenceRule: this.currentRecurrenceRule
    };

    this.onchange?.(eventDetail);
  }

  handleRangeModeChange(checked: boolean) {
    this.useRangeMode = checked;
    const eventDetail = {
      date: this.endDate || '',
      dateTime: `${this.endDate || ''}T${this.endTime}`,
      isRangeDate: checked,
      recurrenceRule: this.currentRecurrenceRule
    };

    this.onchange?.(eventDetail);
  }

  // Recurrence handling
  handleRecurrenceEdit() {
    this.recurrenceDialogOpen = true;
  }

  handleRecurrenceSave(rule: RecurrenceRule | null) {
    this.currentRecurrenceRule = rule;

    // 現在の日付情報と一緒に繰り返し設定も通知
    if (this.useRangeMode) {
      this.handleRangeInputChange();
    } else {
      this.handleDateChange();
    }
  }

  handleRecurrenceDialogClose() {
    this.recurrenceDialogOpen = false;
  }
}
