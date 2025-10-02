<script lang="ts">
  import { getTranslationService } from '$lib/stores/locale.svelte';
  import NumericIntervalInput from './shared/numeric-interval-input.svelte';
  import WeekdaySelector from './weekday-conditions/weekday-selector.svelte';
  import AdvancedRecurrenceSettings from './shared/advanced-recurrence-settings.svelte';
  import type { RecurrencePattern } from '$lib/types/recurrence';
  import type { RecurrenceUnit } from '$lib/types/recurrence';
  import type { DayOfWeek } from '$lib/types/recurrence';

  type Props = {
    unit: RecurrenceUnit;
    interval: number;
    daysOfWeek: DayOfWeek[];
    details: RecurrencePattern;
    showAdvancedSettings: boolean;
    ontoggleDayOfWeek?: (day: DayOfWeek) => void;
    onunitchange?: (unit: RecurrenceUnit) => void;
    onintervalchange?: (interval: number) => void;
    ondetailschange?: (details: RecurrencePattern) => void;
  };

  let {
    unit,
    interval,
    daysOfWeek,
    details,
    showAdvancedSettings,
    ontoggleDayOfWeek,
    onunitchange,
    onintervalchange,
    ondetailschange
  }: Props = $props();

  function handleUnitChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    onunitchange?.(target.value as RecurrenceUnit);
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
    { value: 'halfyear', label: translationService.getMessage('half_year') },
    { value: 'year', label: translationService.getMessage('year') }
  ];

  const isComplexUnit = $derived(['year', 'halfyear', 'quarter', 'month', 'week'].includes(unit));
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
    <AdvancedRecurrenceSettings {details} {ondetailschange} />
  {/if}
</div>
