import { RecurrenceState } from './recurrence-state.svelte';
import { DateConditionManager } from '../date-conditions/date-condition-manager.svelte';
import { WeekdayConditionManager } from '../weekday-conditions/weekday-condition-manager.svelte';
import { RecurrenceRuleBuilder } from './recurrence-rule-builder.svelte';
import { RecurrencePreviewManager } from '../preview/recurrence-preview-manager.svelte';
import { RecurrenceInitializer } from './recurrence-initializer.svelte';
import type { RecurrenceRule } from '$lib/types/datetime-calendar';
import {
  type RecurrenceDialogFacade,
  type RecurrenceDialogLogic,
  type RecurrenceDialogOptions
} from './facade-parts/types';
import { createStateSetters } from './facade-parts/state-setters.svelte';
import { buildDialogLogic } from './facade-parts/logic-builder.svelte';
import { setupPreviewEffect, setupAutoSaveEffect } from './facade-parts/effects.svelte';

// Re-export types for backward compatibility
export type {
  RecurrenceDialogContext,
  RecurrenceDialogLogic,
  RecurrenceDialogFacade,
  RecurrenceDialogOptions
} from './facade-parts/types';

export function createRecurrenceDialogFacade(options: RecurrenceDialogOptions): RecurrenceDialogFacade {
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

  // Create state setters
  const stateSetters = createStateSetters({
    recurrenceState,
    isInitializing: () => isInitializing,
    saveCurrentRule
  });

  // Setup effects
  setupPreviewEffect({
    recurrenceState,
    dateConditionManager,
    weekdayConditionManager,
    previewManager,
    openState: () => openState,
    startDateTime: () => startDateTime,
    endDateTime: () => endDateTime,
    isInitializing: () => isInitializing,
    isSaving: () => isSaving,
    isUpdatingPreview: {
      get: () => isUpdatingPreview,
      set: (value) => { isUpdatingPreview = value; }
    },
    updatePreview,
    saveCurrentRule,
    onSave: options.onSave
  });

  setupAutoSaveEffect({
    recurrenceState,
    dateConditionManager,
    weekdayConditionManager,
    previewManager,
    openState: () => openState,
    startDateTime: () => startDateTime,
    endDateTime: () => endDateTime,
    isInitializing: () => isInitializing,
    isSaving: () => isSaving,
    isUpdatingPreview: {
      get: () => isUpdatingPreview,
      set: (value) => { isUpdatingPreview = value; }
    },
    updatePreview,
    saveCurrentRule,
    onSave: options.onSave
  });

  // Build logic object
  const logic = $derived.by(() =>
    buildDialogLogic({
      recurrenceState,
      dateConditionManager,
      weekdayConditionManager,
      previewManager,
      recurrenceSettingsMessage: () => recurrenceSettingsMessage,
      startDateTime: () => startDateTime,
      endDateTime: () => endDateTime,
      isRangeDate: () => isRangeDate,
      setRecurrenceLevel: stateSetters.setRecurrenceLevel,
      setUnit: stateSetters.setUnit,
      setInterval: stateSetters.setInterval,
      setDaysOfWeek: stateSetters.setDaysOfWeek,
      setDetails: stateSetters.setDetails,
      setRepeatCount: stateSetters.setRepeatCount,
      setDisplayCount
    })
  );

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
