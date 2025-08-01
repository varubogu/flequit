<script lang="ts">
  import { RangeCalendar } from '$lib/components/ui/range-calendar';
  import { Calendar } from '$lib/components/ui/calendar';
  import { CalendarDate, parseDate, now, getLocalTimeZone } from '@internationalized/date';

  interface Props {
    isRangeMode?: boolean;
    startDate?: string;
    endDate?: string;
    onCalendarChange?: (date: CalendarDate) => void;
    onRangeChange?: (start: CalendarDate, end: CalendarDate) => void;
  }

  let {
    isRangeMode = false,
    startDate = '',
    endDate = '',
    onCalendarChange,
    onRangeChange
  }: Props = $props();

  let rangeValue = $state<{ start: CalendarDate | undefined; end: CalendarDate | undefined }>({
    start: undefined,
    end: undefined
  });
  let calendarValue = $state<CalendarDate | undefined>(undefined);
  let rangePlaceholder = $state<CalendarDate | undefined>(undefined);
  let rangeInitialized = $state(false);

  // Initialize range mode
  $effect(() => {
    if (isRangeMode && !rangeInitialized) {
      const today = now(getLocalTimeZone());
      const todayCalendar = new CalendarDate(today.year, today.month, today.day);

      rangePlaceholder = todayCalendar;

      let startCal: CalendarDate | undefined = undefined;
      let endCal: CalendarDate | undefined = undefined;

      if (startDate) {
        try {
          startCal = parseDate(startDate);
        } catch {
          // Invalid start date format, ignore
        }
      }

      if (endDate) {
        try {
          endCal = parseDate(endDate);
        } catch {
          // Invalid end date format, ignore
        }
      }

      rangeValue = { start: startCal, end: endCal };
      rangeInitialized = true;
    } else if (!isRangeMode) {
      rangeInitialized = false;
      rangePlaceholder = undefined;
    }
  });

  // Sync calendar value when endDate changes
  $effect(() => {
    if (endDate && !isRangeMode) {
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

  function handleRangeCalendarChange(v: { start?: CalendarDate; end?: CalendarDate }) {
    if (v?.start) {
      rangeValue.start = v.start;
    }
    if (v?.end) {
      rangeValue.end = v.end;
    }
    if (v?.start && v?.end) {
      onRangeChange?.(v.start, v.end);
    }
  }

  function handleSingleCalendarChange(v: CalendarDate) {
    if (v) {
      calendarValue = v;
      onCalendarChange?.(v);
    }
  }
</script>

{#if isRangeMode}
  <!-- Range Calendar -->
  <RangeCalendar
    bind:value={rangeValue}
    bind:placeholder={rangePlaceholder}
    onValueChange={handleRangeCalendarChange}
    class="w-full"
  />
{:else}
  <!-- Single Calendar -->
  <Calendar bind:value={calendarValue} onValueChange={handleSingleCalendarChange} class="w-full" />
{/if}
