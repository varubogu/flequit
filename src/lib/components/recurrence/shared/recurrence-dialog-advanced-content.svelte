<script lang="ts">
  import RecurrenceLevelSelector from '../recurrence-level-selector.svelte';
  import RecurrenceCountSettings from '../recurrence-count-settings.svelte';
  import RecurrenceIntervalSettings from '../recurrence-interval-settings.svelte';
  import RecurrenceAdjustmentEditor from '../recurrence-adjustment-editor.svelte';
  import { formatDateTimeRange } from '$lib/utils/datetime/formatting';
  import RecurrencePreview from '../preview/recurrence-preview.svelte';
  import type { RecurrenceDialogLogic } from './recurrence-dialog-facade.svelte';

  interface Props {
    logic: RecurrenceDialogLogic;
  }

  let { logic }: Props = $props();
</script>

{#if logic}
  <div class="flex max-h-[calc(85vh-120px)] flex-wrap gap-6 overflow-y-auto">
    <!-- 設定パネル -->
    <div class="min-w-[480px] flex-1 space-y-6 overflow-y-auto">
      <RecurrenceLevelSelector
        bind:value={logic.recurrenceLevel}
        onchange={(value) => { logic.recurrenceLevel = value; }}
      />

      {#if logic.showBasicSettings}
        <RecurrenceCountSettings
          bind:value={logic.repeatCount}
          onChange={(value) => {
            logic.setRepeatCount(value);
          }}
        />
        <RecurrenceIntervalSettings
          unit={logic.unit}
          interval={logic.interval}
          daysOfWeek={logic.daysOfWeek}
          details={logic.details}
          showAdvancedSettings={logic.showAdvancedSettings}
          ontoggleDayOfWeek={logic.toggleDayOfWeek.bind(logic)}
          onunitchange={logic.setUnit.bind(logic)}
          onintervalchange={logic.setInterval.bind(logic)}
          ondetailschange={logic.setDetails.bind(logic)}
        />
        {#if logic.showAdvancedSettings}
          <RecurrenceAdjustmentEditor
            dateConditions={logic.dateConditions}
            weekdayConditions={logic.weekdayConditions}
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
{/if}
