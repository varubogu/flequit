import type { RecurrenceDialogLogic } from './types';
import type { RecurrenceState } from '$lib/components/recurrence/dialogs/recurrence-state.svelte';
import type { DateConditionManager } from '$lib/components/recurrence/date-conditions/date-condition-manager.svelte';
import type { WeekdayConditionManager } from '$lib/components/recurrence/weekday-conditions/weekday-condition-manager.svelte';
import type { RecurrencePreviewManager } from '$lib/components/recurrence/preview/recurrence-preview-manager.svelte';
import type { RecurrenceUnit, DayOfWeek, RecurrencePattern } from '$lib/types/recurrence';
import type { DateCondition, WeekdayCondition, RecurrenceLevel } from '$lib/types/datetime-calendar';

export interface LogicBuilderContext {
  recurrenceState: RecurrenceState;
  dateConditionManager: DateConditionManager;
  weekdayConditionManager: WeekdayConditionManager;
  previewManager: RecurrencePreviewManager;
  recurrenceSettingsMessage: () => string;
  startDateTime: () => Date | undefined;
  endDateTime: () => Date | undefined;
  isRangeDate: () => boolean | undefined;
  setRecurrenceLevel: (value: RecurrenceLevel) => void;
  setUnit: (value: RecurrenceUnit) => void;
  setInterval: (value: number) => void;
  setDaysOfWeek: (value: DayOfWeek[]) => void;
  setDetails: (value: RecurrencePattern) => void;
  setRepeatCount: (value: number | undefined) => void;
  setDisplayCount: (value: number) => void;
}

export function buildDialogLogic(context: LogicBuilderContext): RecurrenceDialogLogic {
  const {
    recurrenceState,
    dateConditionManager,
    weekdayConditionManager,
    previewManager,
    recurrenceSettingsMessage,
    startDateTime,
    endDateTime,
    isRangeDate,
    setRecurrenceLevel,
    setUnit,
    setInterval,
    setDaysOfWeek,
    setDetails,
    setRepeatCount,
    setDisplayCount
  } = context;

  return {
    get recurrenceLevel() {
      return recurrenceState.recurrenceLevel;
    },
    set recurrenceLevel(value: RecurrenceLevel) {
      setRecurrenceLevel(value);
    },
    get unit() {
      return recurrenceState.unit;
    },
    set unit(value: RecurrenceUnit) {
      setUnit(value);
    },
    get interval() {
      return recurrenceState.interval;
    },
    set interval(value: number) {
      setInterval(value);
    },
    get daysOfWeek() {
      return recurrenceState.daysOfWeek;
    },
    set daysOfWeek(value: DayOfWeek[]) {
      setDaysOfWeek(value);
    },
    get details() {
      return recurrenceState.details;
    },
    set details(value: RecurrencePattern) {
      setDetails(value);
    },
    get endDate() {
      return recurrenceState.endDate;
    },
    set endDate(value: Date | undefined) {
      recurrenceState.endDate = value;
    },
    get repeatCount() {
      return recurrenceState.repeatCount;
    },
    set repeatCount(value: number | undefined) {
      setRepeatCount(value);
    },
    setRepeatCount: (value: number | undefined) => {
      setRepeatCount(value);
    },
    get previewDates() {
      return previewManager.getPreviewDates();
    },
    get displayCount() {
      return previewManager.getDisplayCount();
    },
    set displayCount(value: number) {
      setDisplayCount(value);
    },
    get dateConditions() {
      return dateConditionManager.getConditions();
    },
    get weekdayConditions() {
      return weekdayConditionManager.getConditions();
    },
    get showBasicSettings() {
      return recurrenceState.showBasicSettings;
    },
    get showAdvancedSettings() {
      return recurrenceState.showAdvancedSettings;
    },
    get isComplexUnit() {
      return ['year', 'halfyear', 'quarter', 'month', 'week'].includes(
        recurrenceState.unit
      );
    },
    get recurrenceSettings() {
      return recurrenceSettingsMessage();
    },
    get startDateTime() {
      return startDateTime();
    },
    get endDateTime() {
      return endDateTime();
    },
    get isRangeDate() {
      return isRangeDate();
    },
    toggleDayOfWeek: (day: DayOfWeek) => {
      recurrenceState.toggleDayOfWeek(day);
    },
    addDateCondition: () => {
      dateConditionManager.addCondition();
    },
    removeDateCondition: (id: string) => {
      dateConditionManager.removeCondition(id);
    },
    updateDateCondition: (id: string, updates: Partial<DateCondition>) => {
      dateConditionManager.updateCondition(id, updates);
    },
    addWeekdayCondition: () => {
      weekdayConditionManager.addCondition();
    },
    removeWeekdayCondition: (id: string) => {
      weekdayConditionManager.removeCondition(id);
    },
    updateWeekdayCondition: (id: string, updates: Partial<WeekdayCondition>) => {
      weekdayConditionManager.updateCondition(id, updates);
    },
    setUnit: (value: RecurrenceUnit) => setUnit(value),
    setInterval: (value: number) => setInterval(value),
    setDaysOfWeek: (value: DayOfWeek[]) => setDaysOfWeek(value),
    setDetails: (value: RecurrencePattern) => setDetails(value)
  };
}
