<script lang="ts">
  import { getTranslationService } from '$lib/stores/locale.svelte';
  import type { DayOfWeek, AdjustmentTarget } from '$lib/types/task';
  import * as m from '$paraglide/messages.js';
  import { reactiveMessage } from '$lib/stores/locale.svelte';

  interface Props {
    value: DayOfWeek | AdjustmentTarget;
    onchange?: (value: DayOfWeek | AdjustmentTarget) => void;
    class?: string;
  }

  let { value, onchange, class: className = '' }: Props = $props();

  const translationService = getTranslationService();
  // リアクティブメッセージ
  const monday = translationService.getMessage('monday');
  const tuesday = translationService.getMessage('tuesday');
  const wednesday = translationService.getMessage('wednesday');
  const thursday = translationService.getMessage('thursday');
  const friday = translationService.getMessage('friday');
  const saturday = translationService.getMessage('saturday');
  const sunday = translationService.getMessage('sunday');
  const weekday = translationService.getMessage('weekday');
  const weekend = translationService.getMessage('weekend');
  const holiday = translationService.getMessage('holiday');
  const nonHoliday = translationService.getMessage('non_holiday');
  const weekendOnly = translationService.getMessage('weekend_only');
  const nonWeekend = translationService.getMessage('non_weekend');
  const weekendHoliday = translationService.getMessage('weekend_holiday');
  const nonWeekendHoliday = translationService.getMessage('non_weekend_holiday');

  // 選択肢（曜日 + 平日/休日など）
  const options = [
    { value: 'monday', label: monday },
    { value: 'tuesday', label: tuesday },
    { value: 'wednesday', label: wednesday },
    { value: 'thursday', label: thursday },
    { value: 'friday', label: friday },
    { value: 'saturday', label: saturday },
    { value: 'sunday', label: sunday },
    { value: 'weekday', label: weekday },
    { value: 'weekend', label: weekend },
    { value: 'weekend_only', label: weekendOnly },
    { value: 'non_weekend', label: nonWeekend },
    { value: 'holiday', label: holiday },
    { value: 'non_holiday', label: nonHoliday },
    { value: 'weekend_holiday', label: weekendHoliday },
    { value: 'non_weekend_holiday', label: nonWeekendHoliday }
  ];

  function handleChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    onchange?.(target.value as DayOfWeek | AdjustmentTarget);
  }
</script>

<select 
  {value}
  onchange={handleChange}
  class="p-1 border border-border rounded bg-background text-foreground {className}"
>
  {#each options as option}
    <option value={option.value}>{option.label()}</option>
  {/each}
</select>