<script lang="ts">
  import { useTranslation } from '$lib/hooks/use-translation.svelte';
  import type { RecurrencePattern } from '$lib/types/recurrence';
  import type { WeekOfMonth } from '$lib/types/datetime-calendar';
  import type { DayOfWeek } from '$lib/types/recurrence';

  type Props = {
    details?: RecurrencePattern;
    ondetailschange?: (details: RecurrencePattern) => void;
  };

  let { details, ondetailschange }: Props = $props();

  // WeekOfMonthマッピング（文字列 → 数値）
  const weekOfMonthToNumber: Record<WeekOfMonth, number> = {
    first: 1,
    second: 2,
    third: 3,
    fourth: 4,
    last: 5
  };

  // 数値 → 文字列のマッピング
  const numberToWeekOfMonth: Record<number, WeekOfMonth> = {
    1: 'first',
    2: 'second',
    3: 'third',
    4: 'fourth',
    5: 'last'
  };

  function handleSpecificDateChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const dayOfMonth = target.valueAsNumber || undefined;
    const newDetails: RecurrencePattern = {
      ...details,
      monthly: {
        ...details?.monthly,
        dayOfMonth
      }
    };
    ondetailschange?.(newDetails);
  }

  function handleWeekOfPeriodChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const weekOfMonthStr = target.value as WeekOfMonth | '';
    const weekOfMonth = weekOfMonthStr ? weekOfMonthToNumber[weekOfMonthStr] : undefined;

    const newDetails: RecurrencePattern = {
      ...details,
      monthly: {
        ...details?.monthly,
        weekOfMonth
      }
    };
    ondetailschange?.(newDetails);
  }

  function handleWeekdayOfWeekChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const dayOfWeek = (target.value as DayOfWeek) || undefined;

    const newDetails: RecurrencePattern = {
      ...details,
      monthly: {
        ...details?.monthly,
        dayOfWeek
      }
    };
    ondetailschange?.(newDetails);
  }

  const translationService = useTranslation();
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

<div class="space-y-3 pl-36" data-testid="advanced-recurrence-settings">
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
        value={details?.monthly?.dayOfMonth}
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
        value={details?.monthly?.weekOfMonth ? numberToWeekOfMonth[details.monthly.weekOfMonth] : ''}
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

  {#if details?.monthly?.weekOfMonth}
    <div>
      <label for="weekday-of-week-select" class="text-muted-foreground text-sm">
        {weekdayOfWeek()}
      </label>
      <select
        id="weekday-of-week-select"
        value={details?.monthly?.dayOfWeek}
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
