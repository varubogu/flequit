import { describe, it, expect, vi } from 'vitest';
import { CalendarDate } from '@internationalized/date';
import { createEventHandlers } from '$lib/components/datetime/inline-picker/composables/handlers.svelte';
import { createInlineDatePickerState } from '$lib/components/datetime/inline-picker/composables/state.svelte';
import type { UseInlineDatePickerOptions } from '$lib/components/datetime/inline-picker/composables/types';

describe('Inline Date Picker Handlers', () => {
  describe('handleDateTimeInputChange', () => {
    it('単一日付モードで日付と時刻を変更する', () => {
      const onChange = vi.fn();
      const options: UseInlineDatePickerOptions = { show: false, onChange };
      const state = createInlineDatePickerState(options);
      const handlers = createEventHandlers(state, options);

      state.endDate = '2024-01-15';
      state.endTime = '10:30:00';

      handlers.handleDateTimeInputChange({
        endDate: '2024-01-20',
        endTime: '14:00:00'
      });

      expect(state.endDate).toBe('2024-01-20');
      expect(state.endTime).toBe('14:00:00');
      expect(onChange).toHaveBeenCalledWith({
        date: '2024-01-20',
        dateTime: '2024-01-20T14:00:00',
        isRangeDate: false,
        recurrenceRule: null
      });
    });

    it('範囲日付モードで開始日と終了日を変更する', () => {
      const onChange = vi.fn();
      const options: UseInlineDatePickerOptions = {
        show: false,
        isRangeDate: true,
        onChange
      };
      const state = createInlineDatePickerState(options);
      state.useRangeMode = true;
      const handlers = createEventHandlers(state, options);

      handlers.handleDateTimeInputChange({
        startDate: '2024-01-10',
        startTime: '09:00:00',
        endDate: '2024-01-20',
        endTime: '17:00:00'
      });

      expect(state.startDate).toBe('2024-01-10');
      expect(state.startTime).toBe('09:00:00');
      expect(state.endDate).toBe('2024-01-20');
      expect(state.endTime).toBe('17:00:00');
      expect(onChange).toHaveBeenCalledWith({
        date: '2024-01-10',
        dateTime: '2024-01-10T09:00:00',
        range: {
          start: '2024-01-10T09:00:00',
          end: '2024-01-20T17:00:00'
        },
        isRangeDate: true,
        recurrenceRule: null
      });
    });
  });

  describe('handleCalendarChange', () => {
    it('カレンダーから日付を選択する', () => {
      const onChange = vi.fn();
      const options: UseInlineDatePickerOptions = { show: false, onChange };
      const state = createInlineDatePickerState(options);
      state.endTime = '12:00:00';
      const handlers = createEventHandlers(state, options);

      const date = new CalendarDate(2024, 3, 15);
      handlers.handleCalendarChange(date);

      expect(state.endDate).toBe('2024-03-15');
      expect(onChange).toHaveBeenCalledWith({
        date: '2024-03-15',
        dateTime: '2024-03-15T12:00:00',
        isRangeDate: false,
        recurrenceRule: null
      });
    });
  });

  describe('handleRangeChange', () => {
    it('範囲選択で開始日と終了日を設定する', () => {
      const onChange = vi.fn();
      const options: UseInlineDatePickerOptions = { show: false, onChange };
      const state = createInlineDatePickerState(options);
      state.startTime = '08:00:00';
      state.endTime = '18:00:00';
      const handlers = createEventHandlers(state, options);

      const start = new CalendarDate(2024, 2, 1);
      const end = new CalendarDate(2024, 2, 28);
      handlers.handleRangeChange(start, end);

      expect(state.startDate).toBe('2024-02-01');
      expect(state.endDate).toBe('2024-02-28');
      expect(onChange).toHaveBeenCalledWith({
        date: '2024-02-01',
        dateTime: '2024-02-01T08:00:00',
        range: {
          start: '2024-02-01T08:00:00',
          end: '2024-02-28T18:00:00'
        },
        isRangeDate: true,
        recurrenceRule: null
      });
    });
  });

  describe('handleRangeModeChange', () => {
    it('範囲モードをONにする', () => {
      const onChange = vi.fn();
      const options: UseInlineDatePickerOptions = { show: false, onChange };
      const state = createInlineDatePickerState(options);
      state.endDate = '2024-01-15';
      state.endTime = '10:00:00';
      const handlers = createEventHandlers(state, options);

      handlers.handleRangeModeChange(true);

      expect(state.useRangeMode).toBe(true);
      expect(state.lastSyncedRangeMode).toBe(true);
      expect(onChange).toHaveBeenCalledWith({
        date: '2024-01-15',
        dateTime: '2024-01-15T10:00:00',
        isRangeDate: true,
        recurrenceRule: null
      });
    });

    it('範囲モードをOFFにする', () => {
      const onChange = vi.fn();
      const options: UseInlineDatePickerOptions = {
        show: false,
        isRangeDate: true,
        onChange
      };
      const state = createInlineDatePickerState(options);
      state.useRangeMode = true;
      state.endDate = '2024-01-15';
      state.endTime = '10:00:00';
      const handlers = createEventHandlers(state, options);

      handlers.handleRangeModeChange(false);

      expect(state.useRangeMode).toBe(false);
      expect(state.lastSyncedRangeMode).toBe(false);
      expect(onChange).toHaveBeenCalledWith({
        date: '2024-01-15',
        dateTime: '2024-01-15T10:00:00',
        isRangeDate: false,
        recurrenceRule: null
      });
    });
  });

  describe('handleRecurrenceEdit', () => {
    it('繰り返しダイアログを開く', () => {
      const options: UseInlineDatePickerOptions = { show: false };
      const state = createInlineDatePickerState(options);
      const handlers = createEventHandlers(state, options);

      handlers.handleRecurrenceEdit();

      expect(state.recurrenceDialogOpen).toBe(true);
    });
  });

  describe('handleRecurrenceSave', () => {
    it('繰り返しルールを保存する（単一日付モード）', () => {
      const onChange = vi.fn();
      const options: UseInlineDatePickerOptions = { show: false, onChange };
      const state = createInlineDatePickerState(options);
      state.endDate = '2024-01-15';
      state.endTime = '10:00:00';
      const handlers = createEventHandlers(state, options);

      const rule = { unit: 'day' as const, interval: 2 };
      handlers.handleRecurrenceSave(rule);

      expect(state.currentRecurrenceRule).toEqual(rule);
      expect(state.lastSyncedRecurrenceRule).toEqual(rule);
      expect(onChange).toHaveBeenCalledWith({
        date: '2024-01-15',
        dateTime: '2024-01-15T10:00:00',
        isRangeDate: false,
        recurrenceRule: rule
      });
    });

    it('繰り返しルールをnullで保存する', () => {
      const onChange = vi.fn();
      const options: UseInlineDatePickerOptions = { show: false, onChange };
      const state = createInlineDatePickerState(options);
      state.endDate = '2024-01-15';
      state.endTime = '10:00:00';
      state.currentRecurrenceRule = { unit: 'day' as const, interval: 1 };
      const handlers = createEventHandlers(state, options);

      handlers.handleRecurrenceSave(null);

      expect(state.currentRecurrenceRule).toBeNull();
      expect(state.lastSyncedRecurrenceRule).toBeNull();
    });
  });

  describe('handleRecurrenceDialogClose', () => {
    it('繰り返しダイアログを閉じる', () => {
      const options: UseInlineDatePickerOptions = { show: false };
      const state = createInlineDatePickerState(options);
      state.recurrenceDialogOpen = true;
      const handlers = createEventHandlers(state, options);

      handlers.handleRecurrenceDialogClose();

      expect(state.recurrenceDialogOpen).toBe(false);
    });
  });
});
