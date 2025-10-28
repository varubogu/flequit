<script lang="ts">
  import { useTranslation } from '$lib/hooks/use-translation.svelte';
  import { X } from 'lucide-svelte';
  import DayTargetSelector from '$lib/components/datetime/calendar/day-target-selector.svelte';
  import type { WeekdayCondition } from '$lib/types/datetime-calendar';
  import type { AdjustmentTarget } from '$lib/types/datetime-calendar';
  import type { AdjustmentDirection } from '$lib/types/datetime-calendar';
  import type { DayOfWeek } from '$lib/types/datetime-calendar';

  interface Props {
    condition: WeekdayCondition;
    onUpdate: (updates: Partial<WeekdayCondition>) => void;
    onRemove: () => void;
  }

  let { condition, onUpdate, onRemove }: Props = $props();

  const translationService = useTranslation();
  // リアクティブメッセージ
  const previous = translationService.getMessage('previous');
  const next = translationService.getMessage('next');

  // 方向選択肢
  const directionOptions = [
    { value: 'previous', label: previous },
    { value: 'next', label: next }
  ];

  // 現在の言語を取得
  const currentLanguage = $derived(translationService.getCurrentLocale());
  const isJapanese = $derived(currentLanguage.startsWith('ja'));

  function handleConditionChange(value: DayOfWeek | AdjustmentTarget) {
    onUpdate({ ifWeekday: value });
  }

  function handleDirectionChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    onUpdate({ thenDirection: target.value as AdjustmentDirection });
  }

  function handleTargetChange(value: DayOfWeek | AdjustmentTarget) {
    if (
      ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].includes(value)
    ) {
      onUpdate({
        thenTarget: 'specific_weekday',
        thenWeekday: value as DayOfWeek
      });
    } else {
      onUpdate({
        thenTarget: value as AdjustmentTarget,
        thenWeekday: undefined
      });
    }
  }
</script>

<div class="border-border bg-card flex flex-wrap items-center gap-2 rounded border p-3">
  {#if isJapanese}
    <!-- 日本語順：{条件}なら{方向}の{対象}にずらす -->
    <DayTargetSelector value={condition.ifWeekday} onchange={handleConditionChange} />
    <span class="text-sm">なら</span>

    <select
      value={condition.thenDirection}
      onchange={handleDirectionChange}
      class="border-border bg-background text-foreground rounded border p-1"
    >
      {#each directionOptions as option (option.value)}
        <option value={option.value}>{option.label()}</option>
      {/each}
    </select>
    <span class="text-sm">の</span>

    <DayTargetSelector
      value={condition.thenTarget === 'specific_weekday' && condition.thenWeekday
        ? condition.thenWeekday
        : condition.thenTarget}
      onchange={handleTargetChange}
    />
    <span class="text-sm">にずらす</span>
  {:else}
    <!-- 英語順：If {条件}, move to {方向} {対象} -->
    <span class="text-sm">If</span>
    <DayTargetSelector value={condition.ifWeekday} onchange={handleConditionChange} />
    <span class="text-sm">, move to</span>

    <select
      value={condition.thenDirection}
      onchange={handleDirectionChange}
      class="border-border bg-background text-foreground rounded border p-1"
    >
      {#each directionOptions as option (option.value)}
        <option value={option.value}>{option.label()}</option>
      {/each}
    </select>

    <DayTargetSelector
      value={condition.thenTarget === 'specific_weekday' && condition.thenWeekday
        ? condition.thenWeekday
        : condition.thenTarget}
      onchange={handleTargetChange}
    />
  {/if}

  <button
    type="button"
    onclick={onRemove}
    class="text-destructive hover:bg-destructive/10 ml-auto rounded p-1"
    aria-label="Remove condition"
  >
    <X class="h-4 w-4" />
  </button>
</div>
