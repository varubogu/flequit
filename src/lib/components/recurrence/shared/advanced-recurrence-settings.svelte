<script lang="ts">
  import { getTranslationService } from '$lib/stores/locale.svelte';
  import type { RecurrenceDetails } from '$lib/types/datetime-calendar';
  import type { WeekOfMonth } from '$lib/types/datetime-calendar';
  import type { DayOfWeek } from '$lib/types/datetime-calendar';

  type Props = {
    details?: RecurrenceDetails;
    onchange?: (event: Event) => void;
    ondetailschange?: (details: RecurrenceDetails) => void;
  };

  let { details, onchange, ondetailschange }: Props = $props();

  function handleSpecificDateChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const newDetails = { ...(details || {}), specific_date: target.valueAsNumber || undefined };
    ondetailschange?.(newDetails);
    onchange?.(event);
  }

  function handleWeekOfPeriodChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const newDetails = {
      ...(details || {}),
      week_of_period: (target.value as WeekOfMonth) || undefined
    };
    ondetailschange?.(newDetails);
    onchange?.(event);
  }

  function handleWeekdayOfWeekChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const newDetails = {
      ...(details || {}),
      weekday_of_week: (target.value as DayOfWeek) || undefined
    };
    ondetailschange?.(newDetails);
    onchange?.(event);
  }

  const translationService = getTranslationService();
  const advancedSettings = translationService.getMessage('advanced_settings');
  const specificDate = translationService.getMessage('specific_date');
  const specificDateExample = translationService.getMessage('specific_date_example');
  const weekOfMonth = translationService.getMessage('week_of_month');
  const noSelection = translationService.getMessage('no_selection');
  const weekdayOfWeek = translationService.getMessage('weekday_of_week');

  const dayOfWeekOptions = [
    { value: 'sunday', label: translationService.getMessage('sunday') },
    { value: 'monday', label: translationService.getMessage('monday') },
    { value: 'tuesday', label: translationService.getMessage('tuesday') },
    { value: 'wednesday', label: translationService.getMessage('wednesday') },
    { value: 'thursday', label: translationService.getMessage('thursday') },
    { value: 'friday', label: translationService.getMessage('friday') },
    { value: 'saturday', label: translationService.getMessage('saturday') }
  ];

  const weekOfMonthOptions = [
    { value: 'first', label: translationService.getMessage('first_week') },
    { value: 'second', label: translationService.getMessage('second_week') },
    { value: 'third', label: translationService.getMessage('third_week') },
    { value: 'fourth', label: translationService.getMessage('fourth_week') },
    { value: 'last', label: translationService.getMessage('last_week') }
  ];
</script>

<div class="space-y-3 pl-36">
  <h4 class="font-medium">{advancedSettings()}</h4>

  <div class="grid grid-cols-2 gap-4">
    <!-- 特定日付 -->
    <div>
      <label for="specific-date-input" class="text-muted-foreground text-sm">
        {specificDate()}
      </label>
      <input
        id="specific-date-input"
        type="number"
        value={details?.specific_date}
        min="1"
        max="31"
        class="border-border bg-background text-foreground w-full rounded border p-2"
        placeholder={specificDateExample()}
        oninput={handleSpecificDateChange}
      />
    </div>

    <!-- 第◯週の指定 -->
    <div>
      <label for="week-of-period-select" class="text-muted-foreground text-sm">
        {weekOfMonth()}
      </label>
      <select
        id="week-of-period-select"
        value={details?.week_of_period}
        class="border-border bg-background text-foreground w-full rounded border p-2"
        onchange={handleWeekOfPeriodChange}
      >
        <option value="">{noSelection()}</option>
        {#each weekOfMonthOptions as option (option.value)}
          <option value={option.value}>{option.label()}</option>
        {/each}
      </select>
    </div>
  </div>

  {#if details?.week_of_period}
    <div>
      <label for="weekday-of-week-select" class="text-muted-foreground text-sm">
        {weekdayOfWeek()}
      </label>
      <select
        id="weekday-of-week-select"
        value={details?.weekday_of_week}
        class="border-border bg-background text-foreground w-full rounded border p-2"
        onchange={handleWeekdayOfWeekChange}
      >
        {#each dayOfWeekOptions as option (option.value)}
          <option value={option.value}>{option.label()}</option>
        {/each}
      </select>
    </div>
  {/if}
</div>
