import { CalendarDate } from '@internationalized/date';
import type { RecurrenceRule } from '$lib/types/datetime-calendar';
import type { InlineDatePickerState } from './inline-date-picker-state.svelte';

export interface DateChangeData {
  date: string;
  dateTime: string;
  range?: { start: string; end: string };
  isRangeDate: boolean;
  recurrenceRule?: RecurrenceRule | null;
}

export class InlineDatePickerHandlers {
  private state: InlineDatePickerState;
  private onchange?: (data: DateChangeData) => void;
  private onclose?: () => void;

  constructor(
    state: InlineDatePickerState,
    onchange?: (data: DateChangeData) => void,
    onclose?: () => void
  ) {
    this.state = state;
    this.onchange = onchange;
    this.onclose = onclose;
  }

  // Event handling for outside clicks
  setupOutsideClickHandler(pickerElement: HTMLElement | undefined, show: boolean) {
    if (!show || !pickerElement) return;

    const handleClickOutside = (event: MouseEvent) => {
      // 繰り返しダイアログが開いている場合は期日ダイアログを閉じない
      if (this.state.recurrenceDialogOpen) return;

      if (pickerElement && !pickerElement.contains(event.target as Node)) {
        this.onclose?.();
      }
    };

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // 繰り返しダイアログが開いている場合は、まず繰り返しダイアログを閉じる
        if (this.state.recurrenceDialogOpen) {
          this.state.recurrenceDialogOpen = false;
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
    if (data.startDate !== undefined) this.state.startDate = data.startDate;
    if (data.startTime !== undefined) this.state.startTime = data.startTime;
    if (data.endDate !== undefined) this.state.endDate = data.endDate;
    if (data.endTime !== undefined) this.state.endTime = data.endTime;

    if (this.state.useRangeMode) {
      this.handleRangeInputChange();
    } else {
      this.handleDateChange();
    }
  }

  handleDateChange() {
    if (this.state.endDate) {
      const date = this.state.endDate;
      const dateTime = `${this.state.endDate}T${this.state.endTime}`;

      this.onchange?.({
        date,
        dateTime,
        isRangeDate: false,
        recurrenceRule: this.state.currentRecurrenceRule
      });
    }
  }

  handleRangeInputChange() {
    if (this.state.startDate || this.state.endDate) {
      this.onchange?.({
        date: this.state.startDate || this.state.endDate || '',
        dateTime: `${this.state.startDate || this.state.endDate || ''}T${this.state.startTime}`,
        range:
          this.state.startDate && this.state.endDate
            ? {
                start: `${this.state.startDate}T${this.state.startTime}`,
                end: `${this.state.endDate}T${this.state.endTime}`
              }
            : undefined,
        isRangeDate: true,
        recurrenceRule: this.state.currentRecurrenceRule
      });
    }
  }

  handleCalendarChange(date: CalendarDate) {
    this.state.endDate = date.toString();
    const dateTime = `${this.state.endDate}T${this.state.endTime}`;

    this.onchange?.({
      date: this.state.endDate,
      dateTime,
      isRangeDate: false,
      recurrenceRule: this.state.currentRecurrenceRule
    });
  }

  handleRangeChange(start: CalendarDate, end: CalendarDate) {
    this.state.startDate = start.toString();
    this.state.endDate = end.toString();

    const eventDetail = {
      date: this.state.startDate,
      dateTime: `${this.state.startDate}T${this.state.startTime}`,
      range: {
        start: `${this.state.startDate}T${this.state.startTime}`,
        end: `${this.state.endDate}T${this.state.endTime}`
      },
      isRangeDate: true,
      recurrenceRule: this.state.currentRecurrenceRule
    };

    this.onchange?.(eventDetail);
  }

  handleRangeModeChange(checked: boolean) {
    this.state.useRangeMode = checked;
    const eventDetail = {
      date: this.state.endDate || '',
      dateTime: `${this.state.endDate || ''}T${this.state.endTime}`,
      isRangeDate: checked,
      recurrenceRule: this.state.currentRecurrenceRule
    };

    this.onchange?.(eventDetail);
  }

  // Recurrence handling
  handleRecurrenceEdit() {
    this.state.recurrenceDialogOpen = true;
  }

  handleRecurrenceSave(rule: RecurrenceRule | null) {
    this.state.currentRecurrenceRule = rule;

    // 現在の日付情報と一緒に繰り返し設定も通知
    if (this.state.useRangeMode) {
      this.handleRangeInputChange();
    } else {
      this.handleDateChange();
    }
  }

  handleRecurrenceDialogClose() {
    this.state.recurrenceDialogOpen = false;
  }
}
