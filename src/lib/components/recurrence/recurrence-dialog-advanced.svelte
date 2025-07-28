<script lang="ts">
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { Repeat } from "lucide-svelte";
  import type {
    RecurrenceRule,
    RecurrenceUnit,
    RecurrenceLevel,
    DayOfWeek,
    DateCondition,
    WeekdayCondition,
    RecurrenceDetails
  } from '$lib/types/task';
  import { RecurrenceService } from '$lib/services/recurrence-service';
  import * as m from '$paraglide/messages.js';
  import { reactiveMessage } from '$lib/stores/locale.svelte';

  import RecurrenceLevelSelector from './recurrence-level-selector.svelte';
  import RecurrenceCountInput from './recurrence-count-input.svelte';
  import RecurrenceIntervalEditor from './recurrence-interval-editor.svelte';
  import RecurrenceAdjustmentEditor from './recurrence-adjustment-editor.svelte';
  import { formatDateTimeRange } from '$lib/utils/datetime-utils';
  import RecurrencePreview from './recurrence-preview.svelte';

  interface Props {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    recurrenceRule?: RecurrenceRule | null;
    onSave?: (rule: RecurrenceRule | null) => void;
    startDateTime?: Date;
    endDateTime?: Date;
    isRangeDate?: boolean;
  }

  let { open = $bindable(false), onOpenChange, recurrenceRule, onSave, startDateTime, endDateTime, isRangeDate }: Props = $props();

  // --- State ---
  let recurrenceLevel = $state<RecurrenceLevel>(
    !recurrenceRule ? 'disabled' :
    (recurrenceRule.adjustment && (recurrenceRule.adjustment.date_conditions.length > 0 || recurrenceRule.adjustment.weekday_conditions.length > 0)) ||
    (recurrenceRule.details && Object.keys(recurrenceRule.details).length > 0) ? 'advanced' : 'enabled'
  );
  let unit = $state<RecurrenceUnit>(recurrenceRule?.unit || 'day');
  let interval = $state(recurrenceRule?.interval || 1);
  let daysOfWeek = $state<DayOfWeek[]>(recurrenceRule?.days_of_week || []);
  let details = $state<RecurrenceDetails>(recurrenceRule?.details || {});
  let dateConditions = $state<DateCondition[]>(recurrenceRule?.adjustment?.date_conditions || []);
  let weekdayConditions = $state<WeekdayCondition[]>(recurrenceRule?.adjustment?.weekday_conditions || []);
  let endDate = $state<Date | undefined>(recurrenceRule?.end_date);
  let repeatCount = $state<number | undefined>(recurrenceRule?.max_occurrences);
  let previewDates = $state<Date[]>([]);
  let displayCount = $state(10);

  // --- Derived State ---
  const showBasicSettings = $derived(recurrenceLevel === 'enabled' || recurrenceLevel === 'advanced');
  const showAdvancedSettings = $derived(recurrenceLevel === 'advanced');
  const isComplexUnit = $derived(['year', 'half_year', 'quarter', 'month', 'week'].includes(unit));

  // --- Messages ---
  const recurrenceSettings = reactiveMessage(m.recurrence_settings);

  // --- Effects ---
  $effect(() => {
    if (showBasicSettings) {
      updatePreview();
    } else {
      previewDates = [];
    }
  });

  // --- Logic ---
  function buildRecurrenceRule(): RecurrenceRule | null {
    if (recurrenceLevel === 'disabled') return null;
    const rule: RecurrenceRule = {
      unit,
      interval,
      ...(unit === 'week' && daysOfWeek.length > 0 && { days_of_week: daysOfWeek }),
      ...(showAdvancedSettings && isComplexUnit && Object.keys(details).length > 0 && { details }),
      ...(showAdvancedSettings && (dateConditions.length > 0 || weekdayConditions.length > 0) && {
        adjustment: {
          date_conditions: dateConditions,
          weekday_conditions: weekdayConditions
        }
      }),
      ...(endDate && { end_date: endDate }),
      ...(repeatCount && repeatCount > 0 && { max_occurrences: repeatCount })
    };
    return rule;
  }

  function handleImmediateSave() {
    const rule = buildRecurrenceRule();
    onSave?.(rule);
  }

  function updatePreview() {
    try {
      const rule = buildRecurrenceRule();
      if (rule) {
        const baseDate = startDateTime || endDateTime || new Date();
        const previewLimit = 20;
        previewDates = RecurrenceService.generateRecurrenceDates(baseDate, rule, previewLimit);
      } else {
        previewDates = [];
      }
    } catch (error) {
      console.error('プレビュー生成エラー:', error);
      previewDates = [];
    }
  }

  // --- Event Handlers ---
  function toggleDayOfWeek(day: DayOfWeek) {
    daysOfWeek = daysOfWeek.includes(day) ? daysOfWeek.filter(d => d !== day) : [...daysOfWeek, day];
    handleImmediateSave();
  }

  function addDateCondition() {
    dateConditions = [...dateConditions, { id: crypto.randomUUID(), relation: 'before', reference_date: new Date() }];
    handleImmediateSave();
  }
  function removeDateCondition(id: string) {
    dateConditions = dateConditions.filter(c => c.id !== id);
    handleImmediateSave();
  }
  function updateDateCondition(id: string, updates: Partial<DateCondition>) {
    dateConditions = dateConditions.map(c => c.id === id ? { ...c, ...updates } : c);
    handleImmediateSave();
  }

  function addWeekdayCondition() {
    weekdayConditions = [...weekdayConditions, { id: crypto.randomUUID(), if_weekday: 'monday', then_direction: 'next', then_target: 'weekday' }];
    handleImmediateSave();
  }
  function removeWeekdayCondition(id: string) {
    weekdayConditions = weekdayConditions.filter(c => c.id !== id);
    handleImmediateSave();
  }
  function updateWeekdayCondition(id: string, updates: Partial<WeekdayCondition>) {
    weekdayConditions = weekdayConditions.map(c => c.id === id ? { ...c, ...updates } : c);
    handleImmediateSave();
  }
</script>

<Dialog.Root bind:open onOpenChange={onOpenChange}>
  <Dialog.Content class="!w-[90vw] !max-w-[1200px] max-h-[85vh] overflow-y-auto z-[60]">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <Repeat class="h-5 w-5" />
        {recurrenceSettings()}
      </Dialog.Title>
    </Dialog.Header>

    <div class="flex flex-wrap gap-6">
      <!-- 設定パネル -->
      <div class="flex-1 min-w-[480px] space-y-6">
        <RecurrenceLevelSelector bind:value={recurrenceLevel} onchange={handleImmediateSave} />

        {#if showBasicSettings}
          <RecurrenceCountInput bind:value={repeatCount} oninput={handleImmediateSave} />
          <RecurrenceIntervalEditor
            bind:unit
            bind:interval
            bind:daysOfWeek
            bind:details
            {showAdvancedSettings}
            onchange={handleImmediateSave}
            ontoggleDayOfWeek={toggleDayOfWeek}
          />
          {#if showAdvancedSettings}
            <RecurrenceAdjustmentEditor
              bind:dateConditions
              bind:weekdayConditions
              onDateConditionAdd={addDateCondition}
              onDateConditionRemove={removeDateCondition}
              onDateConditionUpdate={updateDateCondition}
              onWeekdayConditionAdd={addWeekdayCondition}
              onWeekdayConditionRemove={removeWeekdayCondition}
              onWeekdayConditionUpdate={updateWeekdayCondition}
            />
          {/if}
        {/if}
      </div>

      <!-- プレビューパネル -->
      {#if showBasicSettings}
        <div class="w-[480px] min-w-[480px] flex-shrink-0">
          <RecurrencePreview
            {showBasicSettings}
            {previewDates}
            bind:displayCount
            {repeatCount}
            formatDate={(date) => formatDateTimeRange(date, { startDateTime, endDateTime, isRangeDate })}
          />
        </div>
      {/if}
    </div>
  </Dialog.Content>
</Dialog.Root>
