<script lang="ts">
  import { getTranslationService } from '$lib/stores/locale.svelte';
  import { X } from 'lucide-svelte';
  import DayTargetSelector from './day-target-selector.svelte';
  import type {
    WeekdayCondition,
    DayOfWeek,
    AdjustmentDirection,
    AdjustmentTarget
  } from '$lib/types/task';

  interface Props {
    condition: WeekdayCondition;
    onUpdate: (updates: Partial<WeekdayCondition>) => void;
    onRemove: () => void;
  }

  let { condition, onUpdate, onRemove }: Props = $props();

  const translationService = getTranslationService();
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
    onUpdate({ if_weekday: value });
  }

  function handleDirectionChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    onUpdate({ then_direction: target.value as AdjustmentDirection });
  }

  function handleTargetChange(value: DayOfWeek | AdjustmentTarget) {
    if (
      ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].includes(value)
    ) {
      onUpdate({
        then_target: 'specific_weekday',
        then_weekday: value as DayOfWeek
      });
    } else {
      onUpdate({
        then_target: value as AdjustmentTarget,
        then_weekday: undefined
      });
    }
  }
</script>

<div class="border-border bg-card flex flex-wrap items-center gap-2 rounded border p-3">
  {#if isJapanese}
    <!-- 日本語順：{条件}なら{方向}の{対象}にずらす -->
    <DayTargetSelector value={condition.if_weekday} onchange={handleConditionChange} />
    <span class="text-sm">なら</span>

    <select
      value={condition.then_direction}
      onchange={handleDirectionChange}
      class="border-border bg-background text-foreground rounded border p-1"
    >
      {#each directionOptions as option (option.value)}
        <option value={option.value}>{option.label()}</option>
      {/each}
    </select>
    <span class="text-sm">の</span>

    <DayTargetSelector
      value={condition.then_target === 'specific_weekday' && condition.then_weekday
        ? condition.then_weekday
        : condition.then_target}
      onchange={handleTargetChange}
    />
    <span class="text-sm">にずらす</span>
  {:else}
    <!-- 英語順：If {条件}, move to {方向} {対象} -->
    <span class="text-sm">If</span>
    <DayTargetSelector value={condition.if_weekday} onchange={handleConditionChange} />
    <span class="text-sm">, move to</span>

    <select
      value={condition.then_direction}
      onchange={handleDirectionChange}
      class="border-border bg-background text-foreground rounded border p-1"
    >
      {#each directionOptions as option (option.value)}
        <option value={option.value}>{option.label()}</option>
      {/each}
    </select>

    <DayTargetSelector
      value={condition.then_target === 'specific_weekday' && condition.then_weekday
        ? condition.then_weekday
        : condition.then_target}
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
