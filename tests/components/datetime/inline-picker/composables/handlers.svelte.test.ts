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

  describe('boundary values', () => {
    function create(statePatch: Partial<ReturnType<typeof createInlineDatePickerState>> = {}) {
      const onChange = vi.fn();
      const options: UseInlineDatePickerOptions = { show: false, onChange };
      const state = createInlineDatePickerState(options);
      Object.assign(state, statePatch);
      return { onChange, state, handlers: createEventHandlers(state, options) };
    }

    it('does not emit a single-date change when the end date is missing', () => {
      const { onChange, handlers } = create({ endDate: '' });
      handlers.handleDateTimeInputChange({ endTime: '09:00:00' });
      expect(onChange).not.toHaveBeenCalled();
    });

    it('emits a partial range without a range object and ignores undefined fields', () => {
      const { onChange, state, handlers } = create({
        useRangeMode: true,
        startDate: '2024-04-01',
        startTime: '08:00:00',
        endDate: '',
        endTime: '18:00:00'
      });

      handlers.handleDateTimeInputChange({});
      expect(state.startDate).toBe('2024-04-01');
      expect(onChange).toHaveBeenCalledWith({
        date: '2024-04-01',
        dateTime: '2024-04-01T08:00:00',
        range: undefined,
        isRangeDate: true,
        recurrenceRule: null
      });

      onChange.mockClear();
      handlers.handleDateTimeInputChange({ endDate: '2024-04-03' });
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          date: '2024-04-01',
          range: { start: '2024-04-01T08:00:00', end: '2024-04-03T18:00:00' }
        })
      );
    });

    it('uses the end date when a range has no start, and does nothing when both dates are empty', () => {
      const onlyEnd = create({
        useRangeMode: true,
        startDate: '',
        endDate: '2024-05-02',
        startTime: '07:00:00',
        endTime: '19:00:00'
      });
      onlyEnd.handlers.handleDateTimeInputChange({});
      expect(onlyEnd.onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          date: '2024-05-02',
          dateTime: '2024-05-02T07:00:00',
          range: undefined
        })
      );

      const neither = create({ useRangeMode: true, startDate: '', endDate: '' });
      neither.handlers.handleDateTimeInputChange({});
      expect(neither.onChange).not.toHaveBeenCalled();
    });

    it('emits an empty date when range mode changes without an end date', () => {
      const { onChange, handlers } = create({ endDate: '', endTime: '00:00:00' });
      handlers.handleRangeModeChange(true);
      expect(onChange).toHaveBeenCalledWith({
        date: '',
        dateTime: 'T00:00:00',
        isRangeDate: true,
        recurrenceRule: null
      });
    });

    it('saves recurrence through the range path and skips a single-date save without an end date', () => {
      const ranged = create({
        useRangeMode: true,
        startDate: '2024-06-01',
        endDate: '2024-06-02',
        startTime: '09:00:00',
        endTime: '10:00:00'
      });
      ranged.handlers.handleRecurrenceSave({ unit: 'week', interval: 1 });
      expect(ranged.onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          isRangeDate: true,
          recurrenceRule: { unit: 'week', interval: 1 }
        })
      );

      const missingEnd = create({ endDate: '' });
      missingEnd.handlers.handleRecurrenceSave({ unit: 'day', interval: 3 });
      expect(missingEnd.state.currentRecurrenceRule).toEqual({ unit: 'day', interval: 3 });
      expect(missingEnd.onChange).not.toHaveBeenCalled();
    });

    it('does not throw when no onChange callback is registered', () => {
      const options: UseInlineDatePickerOptions = { show: false };
      const state = createInlineDatePickerState(options);
      state.endDate = '2024-07-01';
      state.endTime = '12:00:00';
      const handlers = createEventHandlers(state, options);

      expect(() => handlers.handleCalendarChange(new CalendarDate(2024, 7, 4))).not.toThrow();
      expect(state.endDate).toBe('2024-07-04');
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
