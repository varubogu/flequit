<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Switch } from '$lib/components/ui/switch';
  import { RangeCalendar } from '$lib/components/ui/range-calendar';
  import { Calendar } from '$lib/components/ui/calendar';
  import { CalendarDate, parseDate, now, getLocalTimeZone } from '@internationalized/date';

  interface Props {
    show: boolean;
    currentDate?: string;
    position?: { x: number; y: number };
  }

  let { show = false, currentDate = '', position = { x: 0, y: 0 } }: Props = $props();

  let pickerElement = $state<HTMLElement>();
  // Common end date/time (used for both single mode and range end)
  let endDate = $state(currentDate ? new Date(currentDate).toISOString().split('T')[0] : '');
  let endTime = $state(currentDate ? new Date(currentDate).toTimeString().split(' ')[0] : '00:00:00');
  
  let useRangeMode = $state(false);
  let startValue = $state<CalendarDate | undefined>(undefined);
  let endValue = $state<CalendarDate | undefined>(undefined);
  let rangeValue = $state<{start: CalendarDate | undefined, end: CalendarDate | undefined}>({start: undefined, end: undefined});
  let calendarValue = $state<CalendarDate | undefined>(undefined);
  let rangePlaceholder = $state<CalendarDate | undefined>(undefined);
  let startDate = $state('');
  let startTime = $state('00:00:00');

  const dispatch = createEventDispatcher<{
    change: { date: string; dateTime: string; range?: { start: string; end: string } };
    close: void;
    clear: void;
  }>();

  $effect(() => {
    if (show && currentDate && typeof currentDate === 'string') {
      const date = new Date(currentDate);
      endDate = date.toISOString().split('T')[0];
      endTime = date.toTimeString().split(' ')[0];
      
      // Update calendar value
      try {
        calendarValue = parseDate(endDate);
      } catch {
        const today = now(getLocalTimeZone());
        calendarValue = new CalendarDate(today.year, today.month, today.day);
      }
    }
  });

  // Handle click outside and auto-close
  $effect(() => {
    if (!show) return;

    function handleClickOutside(event: MouseEvent) {
      if (pickerElement && !pickerElement.contains(event.target as Node)) {
        dispatch('close');
      }
    }

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
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

  // Auto-save when date changes (single mode)
  function handleDateChange() {
    if (endDate) {
      const date = endDate;
      const dateTime = `${endDate}T${endTime}`;
      
      dispatch('change', { date, dateTime });
      dispatch('close');
    }
  }

  function handleRangeChange() {
    if (startValue && endValue) {
      const start = startValue.toString();
      const end = endValue.toString();
      dispatch('change', { 
        date: start, 
        dateTime: `${start}T${startTime}`,
        range: { 
          start: `${start}T${startTime}`, 
          end: `${end}T${endTime}` 
        } 
      });
      dispatch('close');
    }
  }

  function handleCalendarChange() {
    if (calendarValue) {
      endDate = calendarValue.toString();
      handleDateChange();
    }
  }

  // Sync calendar value when endDate changes
  $effect(() => {
    if (endDate && !useRangeMode) {
      try {
        const newCalendarValue = parseDate(endDate);
        if (!calendarValue || calendarValue.toString() !== newCalendarValue.toString()) {
          calendarValue = newCalendarValue;
        }
      } catch {
        // Invalid date format, ignore
      }
    }
  });

  function handleRangeInputChange() {
    if (startDate && endDate) {
      dispatch('change', { 
        date: startDate, 
        dateTime: `${startDate}T${startTime}`,
        range: { 
          start: `${startDate}T${startTime}`, 
          end: `${endDate}T${endTime}` 
        } 
      });
      dispatch('close');
    }
  }

  // Initialize default values
  let rangeInitialized = $state(false);
  
  // Watch for range mode changes only
  $effect(() => {
    if (useRangeMode && !rangeInitialized) {
      const today = now(getLocalTimeZone());
      const todayCalendar = new CalendarDate(today.year, today.month, today.day);
      
      rangePlaceholder = todayCalendar;
      rangeValue = {start: undefined, end: undefined};
      rangeInitialized = true;
    } else if (!useRangeMode) {
      rangeInitialized = false;
      rangePlaceholder = undefined;
    }
  });


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
      <Switch bind:checked={useRangeMode} />
      <span class="text-sm text-muted-foreground"></span>
    </div>

    {#if useRangeMode}
      <!-- Range Mode: Text inputs and Range Calendar -->
      <div class="space-y-3">
        <!-- Start Date/Time -->
        <div class="grid grid-cols-2 gap-2">
          <input
            type="date"
            bind:value={startDate}
            onchange={handleRangeInputChange}
            placeholder="開始日"
            class="px-3 py-2 text-sm border border-input rounded-md bg-background"
          />
          <input
            type="time"
            step="1"
            bind:value={startTime}
            onchange={handleRangeInputChange}
            class="px-3 py-2 text-sm border border-input rounded-md bg-background"
          />
        </div>
        
        <!-- End Date/Time -->
        <div class="grid grid-cols-2 gap-2">
          <input
            type="date"
            bind:value={endDate}
            onchange={handleRangeInputChange}
            placeholder="終了日"
            class="px-3 py-2 text-sm border border-input rounded-md bg-background"
          />
          <input
            type="time"
            step="1"
            bind:value={endTime}
            onchange={handleRangeInputChange}
            class="px-3 py-2 text-sm border border-input rounded-md bg-background"
          />
        </div>
        
        <!-- Range Calendar -->
        <RangeCalendar
          bind:value={rangeValue}
          bind:placeholder={rangePlaceholder}
          onValueChange={(v: any) => { 
            if (v?.start) {
              startValue = v.start;
              startDate = v.start.toString();
              rangeValue.start = v.start;
            }
            if (v?.end) {
              endValue = v.end;
              endDate = v.end.toString();
              rangeValue.end = v.end;
            }
            if (v?.start && v?.end) handleRangeChange();
          }}
          class="w-full"
        />
      </div>
    {:else}
      <!-- Single Mode: Text inputs and Calendar -->
      <div class="space-y-3">
        <!-- Date and Time Input -->
        <div class="grid grid-cols-2 gap-2">
          <input
            type="date"
            bind:value={endDate}
            onchange={handleDateChange}
            class="px-3 py-2 text-sm border border-input rounded-md bg-background"
          />
          <input
            type="time"
            step="1"
            bind:value={endTime}
            onchange={handleDateChange}
            class="px-3 py-2 text-sm border border-input rounded-md bg-background"
          />
        </div>
        
        <!-- Single Calendar -->
        <Calendar
          bind:value={calendarValue}
          onValueChange={(v: any) => {
            if (v) {
              calendarValue = v;
              endDate = v.toString();
              handleDateChange();
            }
          }}
          class="w-full"
        />
      </div>
    {/if}
  </div>
{/if}