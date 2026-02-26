<script lang="ts">
  import RecurrenceDialog from '$lib/components/recurrence/dialogs/recurrence-dialog.svelte';
  import { SvelteDate } from 'svelte/reactivity';
  import type { RecurrenceRule } from '$lib/types/datetime-calendar';
  import InlineDatePickerUI from '$lib/components/datetime/inline-picker/inline-date-picker-ui.svelte';
  import { useInlineDatePicker } from '$lib/components/datetime/inline-picker/use-inline-date-picker.svelte';

  export interface DateChangeData {
    date: string;
    dateTime: string;
    range?: { start: string; end: string };
    isRangeDate: boolean;
    recurrenceRule?: RecurrenceRule | null;
  }

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

  const {
    state: pickerState,
    initializeState,
    setupOutsideClickHandler,
    handleDateTimeInputChange,
    handleCalendarChange,
    handleRangeChange,
    handleRangeModeChange,
    handleRecurrenceEdit,
    handleRecurrenceSave,
    handleRecurrenceDialogClose
  } = useInlineDatePicker({
    show,
    currentDate,
    currentStartDate,
    isRangeDate,
    recurrenceRule,
    onChange: onchange,
    onClose: onclose
  });

  let uiComponent: InlineDatePickerUI | undefined = $state();

  initializeState();

  // Props の recurrenceRule 変更を pickerState に手動で同期
  $effect(() => {
    const nextRule = recurrenceRule ?? null;
    if (nextRule !== pickerState.lastSyncedRecurrenceRule) {
      pickerState.currentRecurrenceRule = nextRule;
      pickerState.lastSyncedRecurrenceRule = nextRule;
    }
  });

  $effect(() => {
    if (!show) return;
    const pickerElement = uiComponent?.getPickerElement();
    return setupOutsideClickHandler(pickerElement);
  });
</script>

{#if show}
  <InlineDatePickerUI
    bind:this={uiComponent}
    {position}
    startDate={pickerState.startDate}
    startTime={pickerState.startTime}
    endDate={pickerState.endDate}
    endTime={pickerState.endTime}
    useRangeMode={pickerState.useRangeMode}
    currentRecurrenceRule={pickerState.currentRecurrenceRule}
    onDateTimeInputChange={handleDateTimeInputChange}
    onCalendarChange={handleCalendarChange}
    onRangeChange={handleRangeChange}
    onRangeModeChange={handleRangeModeChange}
    onRecurrenceEdit={handleRecurrenceEdit}
  />
{/if}

<!-- 繰り返しダイアログ - より高いZ-indexで独立して配置 -->
<RecurrenceDialog
  bind:open={pickerState.recurrenceDialogOpen}
  recurrenceRule={pickerState.currentRecurrenceRule}
  startDateTime={pickerState.useRangeMode && pickerState.startDate && pickerState.startTime
    ? new SvelteDate(`${pickerState.startDate}T${pickerState.startTime}`)
    : undefined}
  endDateTime={pickerState.endDate && pickerState.endTime
    ? new SvelteDate(`${pickerState.endDate}T${pickerState.endTime}`)
    : undefined}
  isRangeDate={pickerState.useRangeMode}
  onSave={handleRecurrenceSave}
  onOpenChange={handleRecurrenceDialogClose}
/>
