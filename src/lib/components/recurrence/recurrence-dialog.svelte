<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Repeat } from 'lucide-svelte';
  import { untrack } from 'svelte';
  import { getTranslationService } from '$lib/stores/locale.svelte';
  import type { RecurrenceRule, RecurrencePattern } from '$lib/types/recurrence';
  import type { WeekdayCondition, DateCondition, RecurrenceLevel } from '$lib/types/datetime-calendar';
  import type { RecurrenceUnit, DayOfWeek } from '$lib/types/recurrence';
  import { RecurrenceState } from './shared/recurrence-state.svelte';
  import { DateConditionManager } from './date-conditions/date-condition-manager.svelte';
  import { WeekdayConditionManager } from './weekday-conditions/weekday-condition-manager.svelte';
  import { RecurrenceRuleBuilder } from './shared/recurrence-rule-builder.svelte';
  import { RecurrencePreviewManager } from './preview/recurrence-preview-manager.svelte';
  import { RecurrenceInitializer } from './shared/recurrence-initializer.svelte';
  import RecurrenceDialogAdvancedContent from './shared/recurrence-dialog-advanced-content.svelte';

  interface Props {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    recurrenceRule?: RecurrenceRule | null;
    onSave?: (rule: RecurrenceRule | null) => void;
    startDateTime?: Date;
    endDateTime?: Date;
    isRangeDate?: boolean;
  }

  let {
    open = $bindable(false),
    onOpenChange,
    recurrenceRule,
    onSave,
    startDateTime,
    endDateTime
  }: Props = $props();

  // Composed managers (kept as helper classes)
  const recurrenceState = new RecurrenceState();
  const dateConditionManager = new DateConditionManager();
  const weekdayConditionManager = new WeekdayConditionManager();
  const ruleBuilder = new RecurrenceRuleBuilder();
  const previewManager = new RecurrencePreviewManager();

  // Translation service
  const translationService = getTranslationService();

  // Flags for preventing unwanted saves
  let isInitializing = $state(true);
  let isSaving = $state(false);

  // Track open state for initialization
  let previousOpen = $state(false);

  // Derived states
  const recurrenceLevel = $derived(recurrenceState.recurrenceLevel);
  const unit = $derived(recurrenceState.unit);
  const interval = $derived(recurrenceState.interval);
  const daysOfWeek = $derived(recurrenceState.daysOfWeek);
  const details = $derived(recurrenceState.details);
  const endDate = $derived(recurrenceState.endDate);
  const repeatCount = $derived(recurrenceState.repeatCount);
  const previewDates = $derived(previewManager.getPreviewDates());
  const displayCount = $derived(previewManager.getDisplayCount());
  const dateConditions = $derived(dateConditionManager.getConditions());
  const weekdayConditions = $derived(weekdayConditionManager.getConditions());
  const showBasicSettings = $derived(recurrenceState.showBasicSettings);
  const showAdvancedSettings = $derived(recurrenceState.showAdvancedSettings);
  const isComplexUnit = $derived(['year', 'halfyear', 'quarter', 'month', 'week'].includes(unit));

  // Messages
  const recurrenceSettings = $derived(translationService.getMessage('recurrence_settings')());

  function initializeState() {
    RecurrenceInitializer.initializeFromRule(
      recurrenceRule || null,
      recurrenceState,
      dateConditionManager,
      weekdayConditionManager
    );
  }

  /**
   * Update state from new recurrenceRule prop
   * Called when the recurrenceRule prop changes externally
   * NOTE: Does NOT clear isInitializing flag - caller is responsible
   */
  function updateFromRecurrenceRule() {
    initializeState();
  }

  // Initialize on mount (but don't clear flag yet - will be cleared when dialog opens)

  // Update preview when settings change
  let isUpdatingPreview = $state(false);

  $effect(() => {
    if (isUpdatingPreview) return;

    // Track the dependencies
    void recurrenceState.recurrenceLevel;
    void recurrenceState.unit;
    void recurrenceState.interval;
    void recurrenceState.daysOfWeek;
    void recurrenceState.details;
    void recurrenceState.repeatCount;
    void dateConditionManager.conditions;
    void weekdayConditionManager.conditions;

    if (showBasicSettings && open) {
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

  // Auto-save effect - use untrack to prevent infinite loops
  $effect(() => {
    // Track all state changes by referencing them
    void recurrenceState.recurrenceLevel;
    void recurrenceState.unit;
    void recurrenceState.interval;
    void recurrenceState.daysOfWeek;
    void recurrenceState.details;
    void recurrenceState.endDate;
    void recurrenceState.repeatCount;
    void dateConditionManager.conditions;
    void weekdayConditionManager.conditions;

    // Use untrack to prevent re-triggering when flags change
    // This prevents the effect from running when isInitializing changes from true to false
    if (untrack(() => isInitializing) || untrack(() => isSaving)) return;

    // Skip if onSave is not provided or dialog is not open
    if (untrack(() => !onSave)) return;
    if (untrack(() => !open)) return;

    // Save the current rule
    saveCurrentRule();
  });

  // Dialog opened - initialize with latest props
  $effect(() => {
    if (open && !previousOpen) {
      // Start initialization when dialog opens
      isInitializing = true;
      updateFromRecurrenceRule();

      // Clear initialization flag after all reactive updates settle
      setTimeout(() => {
        isInitializing = false;
      }, 100);
    } else if (!open && previousOpen) {
      // Reset initialization flag when dialog closes
      isInitializing = true;
    }

    previousOpen = open;
  });

  function saveCurrentRule() {
    if (isSaving) return; // Prevent re-entry

    isSaving = true;

    try {
      const rule = buildRecurrenceRule();
      onSave?.(rule);
    } finally {
      // Use setTimeout instead of queueMicrotask for more reliable timing
      setTimeout(() => {
        isSaving = false;
      }, 0);
    }
  }

  function buildRecurrenceRule(): RecurrenceRule | null {
    return ruleBuilder.buildRule(
      recurrenceLevel,
      unit,
      interval,
      daysOfWeek,
      details,
      dateConditions,
      weekdayConditions,
      endDate,
      repeatCount,
      showAdvancedSettings
    );
  }

  function updatePreview() {
    const rule = buildRecurrenceRule();
    previewManager.updatePreview(rule, startDateTime, endDateTime);
  }

  // Event Handlers
  function toggleDayOfWeek(day: DayOfWeek) {
    recurrenceState.toggleDayOfWeek(day);
  }

  function addDateCondition() {
    dateConditionManager.addCondition();
  }

  function removeDateCondition(id: string) {
    dateConditionManager.removeCondition(id);
  }

  function updateDateCondition(id: string, updates: Partial<DateCondition>) {
    dateConditionManager.updateCondition(id, updates);
  }

  function addWeekdayCondition() {
    weekdayConditionManager.addCondition();
  }

  function removeWeekdayCondition(id: string) {
    weekdayConditionManager.removeCondition(id);
  }

  function updateWeekdayCondition(id: string, updates: Partial<WeekdayCondition>) {
    weekdayConditionManager.updateCondition(id, updates);
  }

  // Setter functions
  function setRecurrenceLevel(value: RecurrenceLevel) {
    recurrenceState.recurrenceLevel = value;
    // レベル変更時に即座に保存
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

  // Create logic object for child components
  const logic = $derived.by(() => ({
    get recurrenceLevel() {
      return recurrenceLevel;
    },
    set recurrenceLevel(value: RecurrenceLevel) {
      setRecurrenceLevel(value);
    },
    unit,
    interval,
    daysOfWeek,
    details,
    endDate,
    get repeatCount() {
      return repeatCount;
    },
    set repeatCount(value: number | undefined) {
      setRepeatCount(value);
    },
    previewDates,
    get displayCount() {
      return displayCount;
    },
    set displayCount(value: number) {
      setDisplayCount(value);
    },
    dateConditions,
    weekdayConditions,
    showBasicSettings,
    showAdvancedSettings,
    isComplexUnit,
    recurrenceSettings,
    toggleDayOfWeek,
    addDateCondition,
    removeDateCondition,
    updateDateCondition,
    addWeekdayCondition,
    removeWeekdayCondition,
    updateWeekdayCondition,
    setUnit,
    setInterval,
    setDaysOfWeek,
    setDetails
  }));
</script>

<Dialog.Root bind:open {onOpenChange}>
  <Dialog.Content class="z-[60] max-h-[85vh] !w-[90vw] !max-w-[1200px] overflow-hidden">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <Repeat class="h-5 w-5" />
        {recurrenceSettings}
      </Dialog.Title>
    </Dialog.Header>

    <RecurrenceDialogAdvancedContent {logic} />
  </Dialog.Content>
</Dialog.Root>
