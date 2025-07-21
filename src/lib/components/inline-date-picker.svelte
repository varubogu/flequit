<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Switch } from '$lib/components/ui/switch';
  import { CalendarDate } from '@internationalized/date';
  import { formatLocalDate, formatTimeForInput } from '$lib/utils/date-time';
  import DateTimeInputs from './date-time-inputs.svelte';
  import CalendarPicker from './calendar-picker.svelte';

  interface Props {
    show: boolean;
    currentDate?: string;
    currentStartDate?: string;
    position?: { x: number; y: number };
    isRangeDate?: boolean;
    onchange?: (event: CustomEvent) => void;
    onclose?: () => void;
    onclear?: () => void;
  }

  let { show = false, currentDate = '', currentStartDate = '', position = { x: 0, y: 0 }, isRangeDate = false, onchange, onclose }: Props = $props();

  let pickerElement = $state<HTMLElement>();
  
  let endDate = $state(currentDate ? formatLocalDate(new Date(currentDate)) : '');
  let endTime = $state(currentDate ? formatTimeForInput(new Date(currentDate)) : '00:00:00');

  let useRangeMode = $state(isRangeDate);
  let startDate = $state(currentStartDate ? formatLocalDate(new Date(currentStartDate)) : '');
  let startTime = $state(currentStartDate ? formatTimeForInput(new Date(currentStartDate)) : '00:00:00');
  
  // Sync useRangeMode with isRangeDate prop changes
  $effect(() => {
    useRangeMode = isRangeDate;
  });

  const dispatch = createEventDispatcher<{
    change: { date: string; dateTime: string; range?: { start: string; end: string }; isRangeDate: boolean };
    close: void;
    clear: void;
  }>();

  $effect(() => {
    if (show && currentDate && typeof currentDate === 'string') {
      const date = new Date(currentDate);
      endDate = formatLocalDate(date);
      endTime = formatTimeForInput(date);

    }
  });

  // Update start date/time when currentStartDate changes
  $effect(() => {
    if (currentStartDate && typeof currentStartDate === 'string') {
      const startDateObj = new Date(currentStartDate);
      startDate = formatLocalDate(startDateObj);
      startTime = formatTimeForInput(startDateObj);
    } else {
      startDate = '';
      startTime = '00:00:00';
    }
  });

  // Handle click outside and auto-close
  $effect(() => {
    if (!show) return;

    function handleClickOutside(event: MouseEvent) {
      if (pickerElement && !pickerElement.contains(event.target as Node)) {
        onclose?.();
        dispatch('close');
      }
    }

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onclose?.();
        dispatch('close');
      }
    }

    // Add a small delay to avoid immediate closing when opening
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside, true);
      document.addEventListener('keydown', handleKeydown, true);
    }, 50);

    return () => {
      document.removeEventListener('click', handleClickOutside, true);
      document.removeEventListener('keydown', handleKeydown, true);
    };
  });

  function handleDateTimeInputChange(data: {startDate?: string, startTime?: string, endDate?: string, endTime?: string}) {
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

      const changeEvent = new CustomEvent('change', { detail: { date, dateTime, isRangeDate: false } });
      onchange?.(changeEvent);
      dispatch('change', { date, dateTime, isRangeDate: false });
    }
  }

  function handleRangeInputChange() {
    if (startDate || endDate) {
      const eventDetail = {
        date: startDate || endDate || '',
        dateTime: `${startDate || endDate || ''}T${startTime}`,
        range: startDate && endDate ? {
          start: `${startDate}T${startTime}`,
          end: `${endDate}T${endTime}`
        } : undefined,
        isRangeDate: true
      };

      const changeEvent = new CustomEvent('change', { detail: eventDetail });
      onchange?.(changeEvent);
      dispatch('change', eventDetail);
    }
  }

  function handleCalendarChange(date: CalendarDate) {
    endDate = date.toString();
    const dateTime = `${endDate}T${endTime}`;

    const changeEvent = new CustomEvent('change', { detail: { date: endDate, dateTime, isRangeDate: false } });
    onchange?.(changeEvent);
    dispatch('change', { date: endDate, dateTime, isRangeDate: false });

    onclose?.();
    dispatch('close');
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
      isRangeDate: true
    };

    const changeEvent = new CustomEvent('change', { detail: eventDetail });
    onchange?.(changeEvent);
    dispatch('change', eventDetail);

    onclose?.();
    dispatch('close');
  }


</script>

{#if show}
  <div
    bind:this={pickerElement}
    class="fixed bg-popover border border-border rounded-lg shadow-lg p-3 z-50 min-w-[320px]"
    style="left: {position.x}px; top: {position.y}px;"
  >
    <!-- Range Mode Switch -->
    <div class="flex items-center justify-between mb-3">
      <span class="text-sm text-muted-foreground">範囲</span>
      <Switch bind:checked={useRangeMode} onCheckedChange={(checked: boolean) => {
        const eventDetail = {
          date: endDate || '',
          dateTime: `${endDate || ''}T${endTime}`,
          isRangeDate: checked
        };

        const changeEvent = new CustomEvent('change', { detail: eventDetail });
        onchange?.(changeEvent);
        dispatch('change', eventDetail);
      }} />
      <span class="text-sm text-muted-foreground"></span>
    </div>

    <div class="space-y-3">
      <DateTimeInputs
        {startDate}
        {startTime}
        {endDate}
        {endTime}
        showStartInputs={useRangeMode}
        onInput={handleDateTimeInputChange}
      />

      <CalendarPicker
        isRangeMode={useRangeMode}
        {startDate}
        {endDate}
        onCalendarChange={handleCalendarChange}
        onRangeChange={handleRangeChange}
      />
    </div>
  </div>
{/if}
