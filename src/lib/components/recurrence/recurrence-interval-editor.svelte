<script lang="ts">
  import { getTranslationService } from '$lib/stores/locale.svelte';
  import NumericIntervalInput from './numeric-interval-input.svelte';
  import WeekdaySelector from './weekday-selector.svelte';
  import AdvancedRecurrenceSettings from './advanced-recurrence-settings.svelte';
  import type { RecurrenceDetails } from "$lib/types/datetime-calendar";
  import type { RecurrenceUnit } from "$lib/types/datetime-calendar";
  import type { DayOfWeek } from "$lib/types/datetime-calendar";

  type Props = {
    unit: RecurrenceUnit;
    interval: number;
    daysOfWeek: DayOfWeek[];
    details: RecurrenceDetails;
    showAdvancedSettings: boolean;
    onchange?: (event: Event) => void;
    ontoggleDayOfWeek?: (day: DayOfWeek) => void;
    onunitchange?: (unit: RecurrenceUnit) => void;
    onintervalchange?: (interval: number) => void;
    ondetailschange?: (details: RecurrenceDetails) => void;
  };

  let {
    unit,
    interval,
    daysOfWeek,
    details,
    showAdvancedSettings,
    onchange,
    ontoggleDayOfWeek,
    onunitchange,
    onintervalchange,
    ondetailschange
  }: Props = $props();

  function handleUnitChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    onunitchange?.(target.value as RecurrenceUnit);
    onchange?.(event);
  }

  function handleIntervalChange(newInterval: number) {
    onintervalchange?.(newInterval);
  }

  const translationService = getTranslationService();
  const recurrenceInterval = translationService.getMessage('recurrence_interval');

  const unitOptions = [
    { value: 'minute', label: translationService.getMessage('minute') },
    { value: 'hour', label: translationService.getMessage('hour') },
    { value: 'day', label: translationService.getMessage('day') },
    { value: 'week', label: translationService.getMessage('week') },
    { value: 'month', label: translationService.getMessage('month') },
    { value: 'quarter', label: translationService.getMessage('quarter') },
    { value: 'half_year', label: translationService.getMessage('half_year') },
    { value: 'year', label: translationService.getMessage('year') }
  ];

  const isComplexUnit = $derived(['year', 'half_year', 'quarter', 'month', 'week'].includes(unit));
</script>

<div class="space-y-3">
  <div class="flex items-center gap-4">
    <h3 class="w-32 flex-shrink-0 text-lg font-semibold">{recurrenceInterval()}</h3>
    <div class="flex flex-1 items-center gap-4">
      <NumericIntervalInput value={interval} onchange={handleIntervalChange} />
      <select
        value={unit}
        class="border-border bg-background text-foreground w-32 rounded border p-2"
        onchange={handleUnitChange}
      >
        {#each unitOptions as option (option.value)}
          <option value={option.value}>{option.label()}</option>
        {/each}
      </select>
    </div>
  </div>

  <!-- 週単位の曜日選択 -->
  {#if unit === 'week'}
    <WeekdaySelector selectedDays={daysOfWeek} {ontoggleDayOfWeek} />
  {/if}

  <!-- 複雑な単位の詳細設定 -->
  {#if showAdvancedSettings && isComplexUnit}
    <AdvancedRecurrenceSettings {details} {onchange} ondetailschange={ondetailschange} />
  {/if}
</div>
