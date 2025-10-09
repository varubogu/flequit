import { untrack } from 'svelte';
import { RecurrenceState } from './recurrence-state.svelte';
import { DateConditionManager } from '../date-conditions/date-condition-manager.svelte';
import { WeekdayConditionManager } from '../weekday-conditions/weekday-condition-manager.svelte';
import { RecurrenceRuleBuilder } from './recurrence-rule-builder.svelte';
import { RecurrencePreviewManager } from '../preview/recurrence-preview-manager.svelte';
import { RecurrenceInitializer } from './recurrence-initializer.svelte';
import type { RecurrenceRule } from '$lib/types/datetime-calendar';
import type { RecurrenceLevel } from '$lib/types/datetime-calendar';
import type { RecurrenceUnit, DayOfWeek, RecurrencePattern } from '$lib/types/recurrence';
import type { DateCondition, WeekdayCondition } from '$lib/types/datetime-calendar';

interface RecurrenceDialogContext {
  startDateTime?: Date;
  endDateTime?: Date;
  isRangeDate?: boolean;
}

export interface RecurrenceDialogLogic {
  recurrenceLevel: RecurrenceLevel;
  unit: RecurrenceUnit;
  interval: number;
  daysOfWeek: DayOfWeek[];
  details: RecurrencePattern;
  endDate: Date | undefined;
  repeatCount: number | undefined;
  previewDates: Date[];
  displayCount: number;
  dateConditions: DateCondition[];
  weekdayConditions: WeekdayCondition[];
  showBasicSettings: boolean;
  showAdvancedSettings: boolean;
  isComplexUnit: boolean;
  recurrenceSettings: string;
  startDateTime?: Date;
  endDateTime?: Date;
  isRangeDate?: boolean;
  toggleDayOfWeek(day: DayOfWeek): void;
  addDateCondition(): void;
  removeDateCondition(id: string): void;
  updateDateCondition(id: string, updates: Partial<DateCondition>): void;
  addWeekdayCondition(): void;
  removeWeekdayCondition(id: string): void;
  updateWeekdayCondition(id: string, updates: Partial<WeekdayCondition>): void;
  setUnit(newUnit: RecurrenceUnit): void;
  setInterval(newInterval: number): void;
  setDaysOfWeek(newDaysOfWeek: DayOfWeek[]): void;
  setDetails(newDetails: RecurrencePattern): void;
  setRepeatCount(value: number | undefined): void;
}

export interface RecurrenceDialogFacade {
  readonly logic: RecurrenceDialogLogic;
  setRecurrenceRule(rule: RecurrenceRule | null): void;
  setOpen(open: boolean): void;
  setContext(context: RecurrenceDialogContext): void;
  setRecurrenceSettingsMessage(message: string): void;
}

export function createRecurrenceDialogFacade(options: {
  onSave?: (rule: RecurrenceRule | null) => void;
}): RecurrenceDialogFacade {
  const recurrenceState = new RecurrenceState();
  const dateConditionManager = new DateConditionManager();
  const weekdayConditionManager = new WeekdayConditionManager();
  const ruleBuilder = new RecurrenceRuleBuilder();
  const previewManager = new RecurrencePreviewManager();

  let latestRecurrenceRule: RecurrenceRule | null = null;
  let startDateTime = $state<Date | undefined>(undefined);
  let endDateTime = $state<Date | undefined>(undefined);
  let isRangeDate = $state<boolean | undefined>(undefined);
  let openState = $state(false);

  let isInitializing = $state(true);
  let isSaving = $state(false);
  let isUpdatingPreview = $state(false);
  let recurrenceSettingsMessage = $state('');

  let previousOpen = false;

  function initializeState() {
    RecurrenceInitializer.initializeFromRule(
      latestRecurrenceRule,
      recurrenceState,
      dateConditionManager,
      weekdayConditionManager
    );
  }

  function updatePreview() {
    const rule = buildRecurrenceRule();
    previewManager.updatePreview(rule, startDateTime, endDateTime);
  }

  function buildRecurrenceRule(): RecurrenceRule | null {
    return ruleBuilder.buildRule(
      recurrenceState.recurrenceLevel,
      recurrenceState.unit,
      recurrenceState.interval,
      recurrenceState.daysOfWeek,
      recurrenceState.details,
      dateConditionManager.getConditions(),
      weekdayConditionManager.getConditions(),
      recurrenceState.endDate,
      recurrenceState.repeatCount,
      recurrenceState.showAdvancedSettings
    );
  }

  function saveCurrentRule() {
    if (isSaving) return;

    isSaving = true;
    try {
      const rule = buildRecurrenceRule();
      options.onSave?.(rule);
    } finally {
      setTimeout(() => {
        isSaving = false;
      }, 0);
    }
  }

  function setRecurrenceLevel(value: RecurrenceLevel) {
    recurrenceState.recurrenceLevel = value;
    if (!isInitializing) {
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

  function setDisplayCount(value: number) {
    previewManager.setDisplayCount(value);
  }

  function handleDialogOpened() {
    isInitializing = true;
    initializeState();
    setTimeout(() => {
      isInitializing = false;
    }, 100);
  }

  function handleDialogClosed() {
    isInitializing = true;
  }

  $effect(() => {
    if (isUpdatingPreview) return;

    void recurrenceState.recurrenceLevel;
    void recurrenceState.unit;
    void recurrenceState.interval;
    void recurrenceState.daysOfWeek;
    void recurrenceState.details;
    void recurrenceState.repeatCount;
    void recurrenceState.endDate;
    void dateConditionManager.conditions;
    void weekdayConditionManager.conditions;
    void recurrenceState.showBasicSettings;
    void openState;
    void startDateTime;
    void endDateTime;

    if (recurrenceState.showBasicSettings && openState) {
      isUpdatingPreview = true;
      try {
        updatePreview();
      } finally {
        setTimeout(() => {
          isUpdatingPreview = false;
        }, 0);
      }
    } else {
      previewManager.clearPreview();
    }
  });

  $effect(() => {
    void recurrenceState.recurrenceLevel;
    void recurrenceState.unit;
    void recurrenceState.interval;
    void recurrenceState.daysOfWeek;
    void recurrenceState.details;
    void recurrenceState.endDate;
    void recurrenceState.repeatCount;
    void dateConditionManager.conditions;
    void weekdayConditionManager.conditions;

    if (untrack(() => isInitializing) || untrack(() => isSaving)) return;
    if (!options.onSave) return;
    if (untrack(() => !openState)) return;

    saveCurrentRule();
  });

  const logic = $derived.by<RecurrenceDialogLogic>(() => ({
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
      return recurrenceSettingsMessage;
    },
    get startDateTime() {
      return startDateTime;
    },
    get endDateTime() {
      return endDateTime;
    },
    get isRangeDate() {
      return isRangeDate;
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
  }));

  return {
    logic,
    setRecurrenceRule(rule) {
      latestRecurrenceRule = rule;
      if (!openState) {
        initializeState();
      }
    },
    setOpen(open) {
      if (openState === open) return;

      openState = open;
      if (open && !previousOpen) {
        handleDialogOpened();
      } else if (!open && previousOpen) {
        handleDialogClosed();
      }
      previousOpen = open;
    },
    setContext(context) {
      startDateTime = context.startDateTime;
      endDateTime = context.endDateTime;
      isRangeDate = context.isRangeDate;
    },
    setRecurrenceSettingsMessage(message: string) {
      recurrenceSettingsMessage = message;
    }
  } satisfies RecurrenceDialogFacade;
}
