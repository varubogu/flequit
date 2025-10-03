<script lang="ts">
  import { CalendarDate } from '@internationalized/date';
  import RecurrenceDialog from '$lib/components/recurrence/recurrence-dialog.svelte';
  import type { RecurrenceRule } from '$lib/types/datetime-calendar';
  import { formatDate1, formatTime1 } from '$lib/utils/datetime-utils';
  import InlineDatePickerUI from './inline-date-picker-ui.svelte';
  import { SvelteDate } from 'svelte/reactivity';

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

  // State
  let endDate = $state('');
  let endTime = $state('00:00:00');
  let startDate = $state('');
  let startTime = $state('00:00:00');
  let useRangeMode = $state(false);
  let recurrenceDialogOpen = $state(false);
  let currentRecurrenceRule = $state<RecurrenceRule | null>(null);

  let uiComponent = $state<InlineDatePickerUI>();

  // Initialize state from props
  function initializeState() {
    endDate = currentDate ? formatDate1(new SvelteDate(currentDate)) : '';
    endTime = currentDate ? formatTime1(new SvelteDate(currentDate)) : '00:00:00';
    useRangeMode = isRangeDate || false;
    startDate = currentStartDate ? formatDate1(new SvelteDate(currentStartDate)) : '';
    startTime = currentStartDate ? formatTime1(new SvelteDate(currentStartDate)) : '00:00:00';
    currentRecurrenceRule = recurrenceRule || null;
  }

  // Update from prop changes
  function updateCurrentDate(date: string) {
    if (date && typeof date === 'string') {
      const dateObj = new SvelteDate(date);
      endDate = formatDate1(dateObj);
      endTime = formatTime1(dateObj);
    }
  }

  function updateCurrentStartDate(startDateStr?: string) {
    if (startDateStr && typeof startDateStr === 'string') {
      const startDateObj = new SvelteDate(startDateStr);
      startDate = formatDate1(startDateObj);
      startTime = formatTime1(startDateObj);
    } else {
      startDate = '';
      startTime = '00:00:00';
    }
  }

  // Sync with prop changes
  $effect(() => {
    useRangeMode = isRangeDate;
  });

  $effect(() => {
    currentRecurrenceRule = recurrenceRule || null;
  });

  $effect(() => {
    if (show && currentDate) {
      updateCurrentDate(currentDate);
    }
  });

  $effect(() => {
    updateCurrentStartDate(currentStartDate);
  });

  // Event handling for outside clicks
  function setupOutsideClickHandler(pickerElement: HTMLElement | undefined) {
    if (!show || !pickerElement) return;

    const handleClickOutside = (event: MouseEvent) => {
      // 繰り返しダイアログが開いている場合は期日ダイアログを閉じない
      if (recurrenceDialogOpen) return;

      if (pickerElement && !pickerElement.contains(event.target as Node)) {
        onclose?.();
      }
    };

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // 繰り返しダイアログが開いている場合は、まず繰り返しダイアログを閉じる
        if (recurrenceDialogOpen) {
          recurrenceDialogOpen = false;
          return;
        }
        onclose?.();
      }
    };

    // Add a small delay to avoid immediate closing when opening
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside, true);
      document.addEventListener('keydown', handleKeydown, true);
    }, 50);

    return () => {
      document.removeEventListener('click', handleClickOutside, true);
      document.removeEventListener('keydown', handleKeydown, true);
    };
  }

  // Handle click outside and auto-close
  $effect(() => {
    if (!show) return;

    const pickerElement = uiComponent?.getPickerElement();
    return setupOutsideClickHandler(pickerElement);
  });

  // Input change handlers
  function handleDateTimeInputChange(data: {
    startDate?: string;
    startTime?: string;
    endDate?: string;
    endTime?: string;
  }) {
    if (data.startDate !== undefined) startDate = data.startDate;
    if (data.startTime !== undefined) startTime = data.startTime;
    if (data.endDate !== undefined) endDate = data.endDate;
    if (data.endTime !== undefined) endTime = data.endTime;

    if (useRangeMode) {
      handleRangeInputChange();
    } else {
      handleDateChange();
    }
  }

  function handleDateChange() {
    if (endDate) {
      const date = endDate;
      const dateTime = `${endDate}T${endTime}`;

      onchange?.({
        date,
        dateTime,
        isRangeDate: false,
        recurrenceRule: currentRecurrenceRule
      });
    }
  }

  function handleRangeInputChange() {
    if (startDate || endDate) {
      onchange?.({
        date: startDate || endDate || '',
        dateTime: `${startDate || endDate || ''}T${startTime}`,
        range:
          startDate && endDate
            ? {
                start: `${startDate}T${startTime}`,
                end: `${endDate}T${endTime}`
              }
            : undefined,
        isRangeDate: true,
        recurrenceRule: currentRecurrenceRule
      });
    }
  }

  function handleCalendarChange(date: CalendarDate) {
    endDate = date.toString();
    const dateTime = `${endDate}T${endTime}`;

    onchange?.({
      date: endDate,
      dateTime,
      isRangeDate: false,
      recurrenceRule: currentRecurrenceRule
    });
  }

  function handleRangeChange(start: CalendarDate, end: CalendarDate) {
    startDate = start.toString();
    endDate = end.toString();

    const eventDetail = {
      date: startDate,
      dateTime: `${startDate}T${startTime}`,
      range: {
        start: `${startDate}T${startTime}`,
        end: `${endDate}T${endTime}`
      },
      isRangeDate: true,
      recurrenceRule: currentRecurrenceRule
    };

    onchange?.(eventDetail);
  }

  function handleRangeModeChange(checked: boolean) {
    useRangeMode = checked;
    const eventDetail = {
      date: endDate || '',
      dateTime: `${endDate || ''}T${endTime}`,
      isRangeDate: checked,
      recurrenceRule: currentRecurrenceRule
    };

    onchange?.(eventDetail);
  }

  // Recurrence handling
  function handleRecurrenceEdit() {
    recurrenceDialogOpen = true;
  }

  function handleRecurrenceSave(rule: RecurrenceRule | null) {
    currentRecurrenceRule = rule;

    // 繰り返しルール変更を親コンポーネントに通知
    // 親コンポーネント（TaskDetailLogic）で専用サービスを使って保存される
    if (useRangeMode) {
      handleRangeInputChange();
    } else {
      handleDateChange();
    }
  }

  function handleRecurrenceDialogClose() {
    recurrenceDialogOpen = false;
  }

  // Initialize on mount
  initializeState();
</script>

{#if show}
  <InlineDatePickerUI
    bind:this={uiComponent}
    {position}
    {startDate}
    {startTime}
    {endDate}
    {endTime}
    {useRangeMode}
    {currentRecurrenceRule}
    onDateTimeInputChange={handleDateTimeInputChange}
    onCalendarChange={handleCalendarChange}
    onRangeChange={handleRangeChange}
    onRangeModeChange={handleRangeModeChange}
    onRecurrenceEdit={handleRecurrenceEdit}
  />
{/if}

<!-- 繰り返しダイアログ - より高いZ-indexで独立して配置 -->
<RecurrenceDialog
  bind:open={recurrenceDialogOpen}
  recurrenceRule={currentRecurrenceRule}
  startDateTime={useRangeMode && startDate && startTime
    ? new SvelteDate(`${startDate}T${startTime}`)
    : undefined}
  endDateTime={endDate && endTime ? new SvelteDate(`${endDate}T${endTime}`) : undefined}
  isRangeDate={useRangeMode}
  onSave={handleRecurrenceSave}
  onOpenChange={handleRecurrenceDialogClose}
/>
