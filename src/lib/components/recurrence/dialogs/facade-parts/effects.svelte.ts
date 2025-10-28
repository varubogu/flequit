import { untrack } from 'svelte';
import type { RecurrenceState } from '$lib/components/recurrence/dialogs/recurrence-state.svelte';
import type { DateConditionManager } from '$lib/components/recurrence/date-conditions/date-condition-manager.svelte';
import type { WeekdayConditionManager } from '$lib/components/recurrence/weekday-conditions/weekday-condition-manager.svelte';
import type { RecurrencePreviewManager } from '$lib/components/recurrence/preview/recurrence-preview-manager.svelte';
import type { RecurrenceRule } from '$lib/types/datetime-calendar';

export interface EffectsContext {
  recurrenceState: RecurrenceState;
  dateConditionManager: DateConditionManager;
  weekdayConditionManager: WeekdayConditionManager;
  previewManager: RecurrencePreviewManager;
  openState: () => boolean;
  startDateTime: () => Date | undefined;
  endDateTime: () => Date | undefined;
  isInitializing: () => boolean;
  isSaving: () => boolean;
  isUpdatingPreview: {
    get: () => boolean;
    set: (value: boolean) => void;
  };
  updatePreview: () => void;
  saveCurrentRule: () => void;
  onSave?: (rule: RecurrenceRule | null) => void;
}

export function setupPreviewEffect(context: EffectsContext) {
  const {
    recurrenceState,
    dateConditionManager,
    weekdayConditionManager,
    previewManager,
    openState,
    startDateTime,
    endDateTime,
    isUpdatingPreview,
    updatePreview
  } = context;

  $effect(() => {
    if (isUpdatingPreview.get()) return;

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
    void openState();
    void startDateTime();
    void endDateTime();

    if (recurrenceState.showBasicSettings && openState()) {
      isUpdatingPreview.set(true);
      try {
        updatePreview();
      } finally {
        setTimeout(() => {
          isUpdatingPreview.set(false);
        }, 0);
      }
    } else {
      previewManager.clearPreview();
    }
  });
}

export function setupAutoSaveEffect(context: EffectsContext) {
  const {
    recurrenceState,
    dateConditionManager,
    weekdayConditionManager,
    openState,
    isInitializing,
    isSaving,
    saveCurrentRule,
    onSave
  } = context;

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

    if (untrack(() => isInitializing()) || untrack(() => isSaving())) return;
    if (!onSave) return;
    if (untrack(() => !openState())) return;

    saveCurrentRule();
  });
}
