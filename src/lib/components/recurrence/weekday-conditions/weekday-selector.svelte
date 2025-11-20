<script lang="ts">
  import { useTranslation } from '$lib/hooks/use-translation.svelte';
  import type { DayOfWeek } from '$lib/types/datetime-calendar';

  type Props = {
    selectedDays: DayOfWeek[];
    ontoggleDayOfWeek?: (day: DayOfWeek) => void;
  };

  let { selectedDays, ontoggleDayOfWeek }: Props = $props();

  const translationService = useTranslation();
  const repeatWeekdays = translationService.getMessage('repeat_weekdays');

  const dayOfWeekOptions = [
    { value: 'sunday', label: translationService.getMessage('sunday') },
    { value: 'monday', label: translationService.getMessage('monday') },
    { value: 'tuesday', label: translationService.getMessage('tuesday') },
    { value: 'wednesday', label: translationService.getMessage('wednesday') },
    { value: 'thursday', label: translationService.getMessage('thursday') },
    { value: 'friday', label: translationService.getMessage('friday') },
    { value: 'saturday', label: translationService.getMessage('saturday') }
  ];
</script>

<div class="pl-36" data-testid="weekday-selector">
  <div role="group" aria-labelledby="weekdays-label">
    <span id="weekdays-label" class="text-muted-foreground mb-2 block text-sm">
      {repeatWeekdays()}
    </span>
    <div class="grid grid-cols-7 gap-2">
      {#each dayOfWeekOptions as dayOption (dayOption.value)}
        {@const isSelected = selectedDays?.includes(dayOption.value as DayOfWeek) ?? false}
        <button
          type="button"
          class="border-border rounded border p-2 text-sm transition-colors"
          class:bg-primary={isSelected}
          class:text-primary-foreground={isSelected}
          class:bg-background={!isSelected}
          class:text-foreground={!isSelected}
          class:hover:bg-accent={!isSelected}
          class:hover:text-accent-foreground={!isSelected}
          onclick={() => ontoggleDayOfWeek?.(dayOption.value as DayOfWeek)}
        >
          {dayOption.label().slice(0, 1)}
        </button>
      {/each}
    </div>
  </div>
</div>
