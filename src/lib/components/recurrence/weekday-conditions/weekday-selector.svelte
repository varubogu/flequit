<script lang="ts">
  import { getTranslationService } from '$lib/stores/locale.svelte';
  import type { DayOfWeek } from "$lib/types/datetime-calendar";

  type Props = {
    selectedDays: DayOfWeek[];
    ontoggleDayOfWeek?: (day: DayOfWeek) => void;
  };

  let {
    selectedDays,
    ontoggleDayOfWeek
  }: Props = $props();

  const translationService = getTranslationService();
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

<div class="pl-36">
  <div role="group" aria-labelledby="weekdays-label">
    <span id="weekdays-label" class="text-muted-foreground mb-2 block text-sm">
      {repeatWeekdays()}
    </span>
    <div class="grid grid-cols-7 gap-2">
      {#each dayOfWeekOptions as dayOption (dayOption.value)}
        <button
          type="button"
          class="border-border rounded border p-2 text-sm {selectedDays.includes(
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