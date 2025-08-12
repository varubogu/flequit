<script lang="ts">
  import { getTranslationService } from '$lib/stores/locale.svelte';
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
  };

  let {
    unit = $bindable(),
    interval = $bindable(),
    daysOfWeek = $bindable(),
    details = $bindable(),
    showAdvancedSettings,
    onchange,
    ontoggleDayOfWeek
  }: Props = $props();

  const translationService = getTranslationService();
  let inputValue = $state(String(interval));

  $effect(() => {
    const parentValueStr = String(interval);
    if (parentValueStr !== inputValue) {
      inputValue = parentValueStr;
    }
  });

  function handleKeyDown(event: KeyboardEvent) {
    if (
      [
        'Backspace',
        'Delete',
        'Tab',
        'Escape',
        'Enter',
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown'
      ].includes(event.key)
    )
      return;
    if ((event.ctrlKey || event.metaKey) && ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase()))
      return;
    if (!/^[0-9]$/.test(event.key)) event.preventDefault();
  }

  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    setTimeout(() => {
      const sanitizedInput = target.value.replace(/[^0-9]/g, '');
      if (target.value !== sanitizedInput) target.value = sanitizedInput;

      inputValue = sanitizedInput;

      if (sanitizedInput === '' || parseInt(sanitizedInput, 10) < 1) {
        interval = 1;
      } else {
        interval = parseInt(sanitizedInput, 10);
      }
      if (onchange) onchange(event);
    }, 0);
  }

  const recurrenceInterval = translationService.getMessage('recurrence_interval');
  const repeatWeekdays = translationService.getMessage('repeat_weekdays');
  const advancedSettings = translationService.getMessage('advanced_settings');
  const specificDate = translationService.getMessage('specific_date');
  const specificDateExample = translationService.getMessage('specific_date_example');
  const weekOfMonth = translationService.getMessage('week_of_month');
  const noSelection = translationService.getMessage('no_selection');
  const weekdayOfWeek = translationService.getMessage('weekday_of_week');

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

  const isComplexUnit = $derived(['year', 'half_year', 'quarter', 'month', 'week'].includes(unit));
</script>

<div class="space-y-3">
  <div class="flex items-center gap-4">
    <h3 class="w-32 flex-shrink-0 text-lg font-semibold">{recurrenceInterval()}</h3>
    <div class="flex flex-1 items-center gap-4">
      <input
        type="number"
        value={inputValue}
        onkeydown={handleKeyDown}
        oninput={handleInput}
        min="1"
        step="1"
        class="border-border bg-background text-foreground flex-1 rounded border p-2"
        placeholder="1"
      />
      <select
        bind:value={unit}
        class="border-border bg-background text-foreground w-32 rounded border p-2"
        {onchange}
      >
        {#each unitOptions as option (option.value)}
          <option value={option.value}>{option.label()}</option>
        {/each}
      </select>
    </div>
  </div>

  <!-- 週単位の曜日選択 -->
  {#if unit === 'week'}
    <div class="pl-36">
      <div role="group" aria-labelledby="weekdays-label">
        <span id="weekdays-label" class="text-muted-foreground mb-2 block text-sm">
          {repeatWeekdays()}
        </span>
        <div class="grid grid-cols-7 gap-2">
          {#each dayOfWeekOptions as dayOption (dayOption.value)}
            <button
              type="button"
              class="border-border rounded border p-2 text-sm {daysOfWeek.includes(
                dayOption.value as DayOfWeek
              )
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-foreground hover:bg-accent hover:text-accent-foreground'}"
              onclick={() => ontoggleDayOfWeek?.(dayOption.value as DayOfWeek)}
            >
              {dayOption.label().slice(0, 1)}
            </button>
          {/each}
        </div>
      </div>
    </div>
  {/if}

  <!-- 複雑な単位の詳細設定 -->
  {#if showAdvancedSettings && isComplexUnit}
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
            bind:value={details.specific_date}
            min="1"
            max="31"
            class="border-border bg-background text-foreground w-full rounded border p-2"
            placeholder={specificDateExample()}
            oninput={onchange}
          />
        </div>

        <!-- 第◯週の指定 -->
        <div>
          <label for="week-of-period-select" class="text-muted-foreground text-sm">
            {weekOfMonth()}
          </label>
          <select
            id="week-of-period-select"
            bind:value={details.week_of_period}
            class="border-border bg-background text-foreground w-full rounded border p-2"
            {onchange}
          >
            <option value="">{noSelection()}</option>
            {#each weekOfMonthOptions as option (option.value)}
              <option value={option.value}>{option.label()}</option>
            {/each}
          </select>
        </div>
      </div>

      {#if details.week_of_period}
        <div>
          <label for="weekday-of-week-select" class="text-muted-foreground text-sm">
            {weekdayOfWeek()}
          </label>
          <select
            id="weekday-of-week-select"
            bind:value={details.weekday_of_week}
            class="border-border bg-background text-foreground w-full rounded border p-2"
            {onchange}
          >
            {#each dayOfWeekOptions as option (option.value)}
              <option value={option.value}>{option.label()}</option>
            {/each}
          </select>
        </div>
      {/if}
    </div>
  {/if}
</div>
