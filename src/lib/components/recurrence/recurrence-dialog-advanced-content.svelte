<script lang="ts">
  import RecurrenceLevelSelector from './recurrence-level-selector.svelte';
  import RecurrenceCountInput from './recurrence-count-input.svelte';
  import RecurrenceIntervalEditor from './recurrence-interval-editor.svelte';
  import RecurrenceAdjustmentEditor from './recurrence-adjustment-editor.svelte';
  import { formatDateTimeRange } from '$lib/utils/datetime-utils';
  import RecurrencePreview from './recurrence-preview.svelte';
  import type { RecurrenceDialogAdvancedLogic } from './recurrence-dialog-advanced-logic.svelte';

  interface Props {
    logic: RecurrenceDialogAdvancedLogic;
  }

  let { logic }: Props = $props();
</script>

<div class="flex max-h-[calc(85vh-120px)] flex-wrap gap-6 overflow-y-auto">
  <!-- 設定パネル -->
  <div class="min-w-[480px] flex-1 space-y-6 overflow-y-auto">
    <RecurrenceLevelSelector
      bind:value={logic.recurrenceLevel}
      onchange={logic.handleImmediateSave.bind(logic)}
    />

    {#if logic.showBasicSettings}
      <RecurrenceCountInput
        bind:value={logic.repeatCount}
        oninput={logic.handleImmediateSave.bind(logic)}
      />
      <RecurrenceIntervalEditor
        bind:unit={logic.unit}
        bind:interval={logic.interval}
        bind:daysOfWeek={logic.daysOfWeek}
        bind:details={logic.details}
        showAdvancedSettings={logic.showAdvancedSettings}
        onchange={logic.handleImmediateSave.bind(logic)}
        ontoggleDayOfWeek={logic.toggleDayOfWeek.bind(logic)}
      />
      {#if logic.showAdvancedSettings}
        <RecurrenceAdjustmentEditor
          bind:dateConditions={logic.dateConditions}
          bind:weekdayConditions={logic.weekdayConditions}
          onDateConditionAdd={logic.addDateCondition.bind(logic)}
          onDateConditionRemove={logic.removeDateCondition.bind(logic)}
          onDateConditionUpdate={logic.updateDateCondition.bind(logic)}
          onWeekdayConditionAdd={logic.addWeekdayCondition.bind(logic)}
          onWeekdayConditionRemove={logic.removeWeekdayCondition.bind(logic)}
          onWeekdayConditionUpdate={logic.updateWeekdayCondition.bind(logic)}
        />
      {/if}
    {/if}
  </div>

  <!-- プレビューパネル -->
  {#if logic.showBasicSettings}
    <div class="w-[480px] min-w-[480px] flex-shrink-0">
      <RecurrencePreview
        showBasicSettings={logic.showBasicSettings}
        previewDates={logic.previewDates}
        bind:displayCount={logic.displayCount}
        repeatCount={logic.repeatCount}
        formatDate={(date) =>
          formatDateTimeRange(date, {
            startDateTime: logic.startDateTime,
            endDateTime: logic.endDateTime,
            isRangeDate: logic.isRangeDate
          })}
      />
    </div>
  {/if}
</div>
