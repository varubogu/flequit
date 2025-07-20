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
    isRangeDate?: boolean;
    onchange?: (event: CustomEvent) => void;
    onclose?: () => void;
    onclear?: () => void;
  }

  let { show = false, currentDate = '', position = { x: 0, y: 0 }, isRangeDate = false, onchange, onclose, onclear }: Props = $props();

  let pickerElement = $state<HTMLElement>();
  // Common end date/time (used for both single mode and range end)
  let endDate = $state(currentDate ? new Date(currentDate).toISOString().split('T')[0] : '');
  let endTime = $state(currentDate ? new Date(currentDate).toTimeString().split(' ')[0] : '00:00:00');
  
  let useRangeMode = $state(isRangeDate);
  let startValue = $state<CalendarDate | undefined>(undefined);
  let endValue = $state<CalendarDate | undefined>(undefined);
  let rangeValue = $state<{start: CalendarDate | undefined, end: CalendarDate | undefined}>({start: undefined, end: undefined});
  let calendarValue = $state<CalendarDate | undefined>(undefined);
  let rangePlaceholder = $state<CalendarDate | undefined>(undefined);
  let startDate = $state('');
  let startTime = $state('00:00:00');

  const dispatch = createEventDispatcher<{
    change: { date: string; dateTime: string; range?: { start: string; end: string }; isRangeDate: boolean };
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

  // Auto-save when date changes (single mode) - NO AUTO CLOSE
  function handleDateChange() {
    if (endDate) {
      const date = endDate;
      const dateTime = `${endDate}T${endTime}`;
      
      const changeEvent = new CustomEvent('change', { detail: { date, dateTime, isRangeDate: false } });
      onchange?.(changeEvent);
      dispatch('change', { date, dateTime, isRangeDate: false });
      
      // REMOVED AUTO CLOSE - only close on Esc or click outside
    }
  }

  // Validate date format (YYYY-MM-DD)
  function isValidDate(dateString: string): boolean {
    if (!dateString || dateString.length !== 10) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime()) && dateString === date.toISOString().split('T')[0];
  }

  function handleRangeChange() {
    if (startValue && endValue) {
      const start = startValue.toString();
      const end = endValue.toString();
      const eventDetail = { 
        date: start, 
        dateTime: `${start}T${startTime}`,
        range: { 
          start: `${start}T${startTime}`, 
          end: `${end}T${endTime}` 
        },
        isRangeDate: true
      };
      
      const changeEvent = new CustomEvent('change', { detail: eventDetail });
      onchange?.(changeEvent);
      dispatch('change', eventDetail);
      
      // CLOSE on range calendar selection (this is intentional)
      onclose?.();
      dispatch('close');
    }
  }

  function handleCalendarChange() {
    if (calendarValue) {
      endDate = calendarValue.toString();
      
      // Only close when selecting from calendar component
      const date = endDate;
      const dateTime = `${endDate}T${endTime}`;
      
      const changeEvent = new CustomEvent('change', { detail: { date, dateTime, isRangeDate: false } });
      onchange?.(changeEvent);
      dispatch('change', { date, dateTime, isRangeDate: false });
      
      onclose?.();
      dispatch('close');
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
    if (startDate || endDate) {
      // Just update the values, don't close
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
      
      // REMOVED AUTO CLOSE - only close on Esc or click outside
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

    <!-- Date/Time Inputs (Always shown) -->
    <div class="space-y-3">
      <!-- Due Date/Time (Always visible) -->
      <div class="grid grid-cols-2 gap-2">
        <input
          type="date"
          bind:value={endDate}
          oninput={(e) => {
            if (useRangeMode) {
              handleRangeInputChange();
            } else {
              handleDateChange();
            }
          }}
          onkeydown={(e) => {
            // Allow normal typing and navigation
            if (e.key === 'Tab' || e.key === 'Shift' || e.key === 'Backspace' || e.key === 'Delete' || 
                e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Home' || e.key === 'End' ||
                /^[0-9/-]$/.test(e.key)) {
              return;
            }
            // Block other keys that might trigger calendar
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
            }
          }}
          class="px-3 py-2 text-sm border border-input rounded-md bg-background [&::-webkit-calendar-picker-indicator]:hidden"
        />
        <input
          type="time"
          step="1"
          bind:value={endTime}
          oninput={(e) => {
            if (useRangeMode) {
              handleRangeInputChange();
            } else {
              handleDateChange();
            }
          }}
          class="px-3 py-2 text-sm border border-input rounded-md bg-background"
        />
      </div>

      {#if useRangeMode}
        <!-- Start Date/Time (Range mode only) -->
        <div class="grid grid-cols-2 gap-2">
          <input
            type="date"
            bind:value={startDate}
            oninput={handleRangeInputChange}
            onkeydown={(e) => {
              // Allow normal typing and navigation
              if (e.key === 'Tab' || e.key === 'Shift' || e.key === 'Backspace' || e.key === 'Delete' || 
                  e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Home' || e.key === 'End' ||
                  /^[0-9/-]$/.test(e.key)) {
                return;
              }
              // Block other keys that might trigger calendar
              if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
              }
            }}
            class="px-3 py-2 text-sm border border-input rounded-md bg-background [&::-webkit-calendar-picker-indicator]:hidden"
          />
          <input
            type="time"
            step="1"
            bind:value={startTime}
            oninput={handleRangeInputChange}
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
            if (v?.start && v?.end) {
              handleRangeChange();
            }
          }}
          class="w-full"
        />
      {:else}
        <!-- Single Calendar -->
        <Calendar
          bind:value={calendarValue}
          onValueChange={(v: any) => {
            if (v) {
              calendarValue = v;
              endDate = v.toString();
              handleCalendarChange();
            }
          }}
          class="w-full"
        />
      {/if}
    </div>
  </div>
{/if}