import type { RecurrenceState } from '../recurrence-state.svelte';
import type { RecurrenceLevel } from '$lib/types/datetime-calendar';
import type { RecurrenceUnit, DayOfWeek, RecurrencePattern } from '$lib/types/recurrence';

export interface StateSettersContext {
  recurrenceState: RecurrenceState;
  isInitializing: () => boolean;
  saveCurrentRule: () => void;
}

export function createStateSetters(context: StateSettersContext) {
  const { recurrenceState, isInitializing, saveCurrentRule } = context;

  function setRecurrenceLevel(value: RecurrenceLevel) {
    recurrenceState.recurrenceLevel = value;
    if (!isInitializing()) {
      saveCurrentRule();
    }
  }

  function setUnit(newUnit: RecurrenceUnit) {
    recurrenceState.setUnit(newUnit);
  }

  function setInterval(newInterval: number) {
    recurrenceState.setInterval(newInterval);
  }

  function setDaysOfWeek(newDaysOfWeek: DayOfWeek[]) {
    recurrenceState.setDaysOfWeek(newDaysOfWeek);
  }

  function setDetails(newDetails: RecurrencePattern) {
    recurrenceState.setDetails(newDetails);
  }

  function setRepeatCount(value: number | undefined) {
    recurrenceState.repeatCount = value;
  }

  return {
    setRecurrenceLevel,
    setUnit,
    setInterval,
    setDaysOfWeek,
    setDetails,
    setRepeatCount
  };
}
