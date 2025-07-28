<script lang="ts">
  import type { DayOfWeek, AdjustmentTarget } from '$lib/types/task';
  import * as m from '$paraglide/messages.js';
  import { reactiveMessage } from '$lib/stores/locale.svelte';

  interface Props {
    value: DayOfWeek | AdjustmentTarget;
    onchange?: (value: DayOfWeek | AdjustmentTarget) => void;
    class?: string;
  }

  let { value, onchange, class: className = '' }: Props = $props();

  // リアクティブメッセージ
  const monday = reactiveMessage(m.monday);
  const tuesday = reactiveMessage(m.tuesday);
  const wednesday = reactiveMessage(m.wednesday);
  const thursday = reactiveMessage(m.thursday);
  const friday = reactiveMessage(m.friday);
  const saturday = reactiveMessage(m.saturday);
  const sunday = reactiveMessage(m.sunday);
  const weekday = reactiveMessage(m.weekday);
  const weekend = reactiveMessage(m.weekend);
  const holiday = reactiveMessage(m.holiday);
  const nonHoliday = reactiveMessage(m.non_holiday);
  
  // 新しい選択肢のラベル（直接定義）
  const weekendOnly = () => '土日';
  const nonWeekend = () => '土日以外';
  const weekendHoliday = () => '土日祝日';
  const nonWeekendHoliday = () => '土日祝日以外';

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