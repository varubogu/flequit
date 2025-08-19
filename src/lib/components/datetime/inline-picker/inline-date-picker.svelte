<script lang="ts">
  import RecurrenceDialog from '$lib/components/recurrence/recurrence-dialog.svelte';
  import type { RecurrenceRule } from '$lib/types/datetime-calendar';
  import { InlineDatePickerLogic, type DateChangeData } from './inline-date-picker-logic.svelte';
  import InlineDatePickerUI from './inline-date-picker-ui.svelte';
  import { SvelteDate } from 'svelte/reactivity';

  interface Props {
    show: boolean;
    currentDate?: string;
    currentStartDate?: string;
    position?: { x: number; y: number };
    isRangeDate?: boolean;
    recurrenceRule?: RecurrenceRule | null;
    onchange?: (data: DateChangeData) => void;
    onclose?: () => void;
    onclear?: () => void;
  }

  let {
    show = false,
    currentDate = '',
    currentStartDate = '',
    position = { x: 0, y: 0 },
    isRangeDate = false,
    recurrenceRule,
    onchange,
    onclose
  }: Props = $props();

  // Initialize logic
  const logic = new InlineDatePickerLogic(
    currentDate,
    currentStartDate,
    isRangeDate,
    recurrenceRule,
    onchange,
    onclose
  );

  let uiComponent = $state<InlineDatePickerUI>();

  // Sync with prop changes
  $effect(() => {
    logic.updateIsRangeDate(isRangeDate);
  });

  $effect(() => {
    logic.updateRecurrenceRule(recurrenceRule);
  });

  $effect(() => {
    if (show && currentDate) {
      logic.updateCurrentDate(currentDate);
    }
  });

  $effect(() => {
    logic.updateCurrentStartDate(currentStartDate);
  });

  // Handle click outside and auto-close
  $effect(() => {
    if (!show) return;

    const pickerElement = uiComponent?.getPickerElement();
    return logic.setupOutsideClickHandler(pickerElement, show);
  });
</script>

{#if show}
  <InlineDatePickerUI
    bind:this={uiComponent}
    {position}
    startDate={logic.startDate}
    startTime={logic.startTime}
    endDate={logic.endDate}
    endTime={logic.endTime}
    useRangeMode={logic.useRangeMode}
    currentRecurrenceRule={logic.currentRecurrenceRule}
    onDateTimeInputChange={logic.handleDateTimeInputChange.bind(logic)}
    onCalendarChange={logic.handleCalendarChange.bind(logic)}
    onRangeChange={logic.handleRangeChange.bind(logic)}
    onRangeModeChange={logic.handleRangeModeChange.bind(logic)}
    onRecurrenceEdit={logic.handleRecurrenceEdit.bind(logic)}
  />
{/if}

<!-- 繰り返しダイアログ - より高いZ-indexで独立して配置 -->
<RecurrenceDialog
  bind:open={logic.recurrenceDialogOpen}
  recurrenceRule={logic.currentRecurrenceRule}
  startDateTime={logic.useRangeMode && logic.startDate && logic.startTime
    ? new SvelteDate(`${logic.startDate}T${logic.startTime}`)
    : undefined}
  endDateTime={logic.endDate && logic.endTime
    ? new SvelteDate(`${logic.endDate}T${logic.endTime}`)
    : undefined}
  isRangeDate={logic.useRangeMode}
  onSave={logic.handleRecurrenceSave.bind(logic)}
  onOpenChange={logic.handleRecurrenceDialogClose.bind(logic)}
/>
