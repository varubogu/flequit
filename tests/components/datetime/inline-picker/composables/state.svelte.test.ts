import { describe, it, expect } from 'vitest';
import {
  createInlineDatePickerState,
  initializeState,
  updateCurrentDate,
  updateCurrentStartDate
} from '$lib/components/datetime/inline-picker/composables/state.svelte';
import type { UseInlineDatePickerOptions } from '$lib/components/datetime/inline-picker/composables/types';

describe('Inline Date Picker State', () => {
  describe('createInlineDatePickerState', () => {
    it('デフォルト値で状態を作成する', () => {
      const options: UseInlineDatePickerOptions = {
        show: false
      };

      const state = createInlineDatePickerState(options);

      expect(state.endDate).toBe('');
      expect(state.endTime).toBe('00:00:00');
      expect(state.startDate).toBe('');
      expect(state.startTime).toBe('00:00:00');
      expect(state.useRangeMode).toBe(false);
      expect(state.recurrenceDialogOpen).toBe(false);
      expect(state.currentRecurrenceRule).toBeNull();
      expect(state.lastSyncedRangeMode).toBe(false);
      expect(state.lastSyncedRecurrenceRule).toBeNull();
    });

    it('isRangeDateオプションを反映する', () => {
      const options: UseInlineDatePickerOptions = {
        show: false,
        isRangeDate: true
      };

      const state = createInlineDatePickerState(options);

      expect(state.useRangeMode).toBe(true);
      expect(state.lastSyncedRangeMode).toBe(true);
    });

    it('recurrenceRuleオプションを反映する', () => {
      const rule = { unit: 'day' as const, interval: 1 };
      const options: UseInlineDatePickerOptions = {
        show: false,
        recurrenceRule: rule
      };

      const state = createInlineDatePickerState(options);

      expect(state.currentRecurrenceRule).toEqual(rule);
      expect(state.lastSyncedRecurrenceRule).toEqual(rule);
    });
  });

  describe('initializeState', () => {
    it('currentDateから状態を初期化する', () => {
      const options: UseInlineDatePickerOptions = {
        show: false,
        currentDate: '2024-01-15T10:30:00'
      };

      const state = createInlineDatePickerState(options);
      initializeState(state, options);

      expect(state.endDate).toBe('2024-01-15');
      expect(state.endTime).toBe('10:30:00');
    });

    it('currentStartDateから状態を初期化する', () => {
      const options: UseInlineDatePickerOptions = {
        show: false,
        currentStartDate: '2024-01-10T08:00:00'
      };

      const state = createInlineDatePickerState(options);
      initializeState(state, options);

      expect(state.startDate).toBe('2024-01-10');
      expect(state.startTime).toBe('08:00:00');
    });

    it('isRangeDateを反映する', () => {
      const options: UseInlineDatePickerOptions = {
        show: false,
        isRangeDate: true
      };

      const state = createInlineDatePickerState(options);
      initializeState(state, options);

      expect(state.useRangeMode).toBe(true);
      expect(state.lastSyncedRangeMode).toBe(true);
    });

    it('recurrenceRuleを反映する', () => {
      const rule = { unit: 'week' as const, interval: 2 };
      const options: UseInlineDatePickerOptions = {
        show: false,
        recurrenceRule: rule
      };

      const state = createInlineDatePickerState(options);
      initializeState(state, options);

      expect(state.currentRecurrenceRule).toEqual(rule);
      expect(state.lastSyncedRecurrenceRule).toEqual(rule);
    });
  });

  describe('updateCurrentDate', () => {
    it('日付を更新する', () => {
      const state = createInlineDatePickerState({ show: false });

      updateCurrentDate(state, '2024-02-20T14:45:30');

      expect(state.endDate).toBe('2024-02-20');
      expect(state.endTime).toBe('14:45:30');
    });

    it('空文字列の場合は何もしない', () => {
      const state = createInlineDatePickerState({ show: false });
      state.endDate = '2024-01-01';
      state.endTime = '12:00:00';

      updateCurrentDate(state, '');

      expect(state.endDate).toBe('2024-01-01');
      expect(state.endTime).toBe('12:00:00');
    });
  });

  describe('updateCurrentStartDate', () => {
    it('開始日を更新する', () => {
      const state = createInlineDatePickerState({ show: false });

      updateCurrentStartDate(state, '2024-03-10T09:15:00');

      expect(state.startDate).toBe('2024-03-10');
      expect(state.startTime).toBe('09:15:00');
    });

    it('undefinedの場合は空文字列にリセットする', () => {
      const state = createInlineDatePickerState({ show: false });
      state.startDate = '2024-01-01';
      state.startTime = '12:00:00';

      updateCurrentStartDate(state, undefined);

      expect(state.startDate).toBe('');
      expect(state.startTime).toBe('00:00:00');
    });
  });
});
