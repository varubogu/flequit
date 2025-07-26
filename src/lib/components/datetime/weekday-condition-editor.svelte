<script lang="ts">
  import { X } from "lucide-svelte";
  import DayTargetSelector from './day-target-selector.svelte';
  import type { WeekdayCondition, DayOfWeek, AdjustmentDirection, AdjustmentTarget } from '$lib/types/task';
  import { LanguageOrderUtils } from '$lib/utils/language-order';
  import * as m from '$paraglide/messages.js';
  import { reactiveMessage } from '$lib/stores/locale.svelte';
  import { getLocale } from '$paraglide/runtime';

  interface Props {
    condition: WeekdayCondition;
    onUpdate: (updates: Partial<WeekdayCondition>) => void;
    onRemove: () => void;
  }

  let { condition, onUpdate, onRemove }: Props = $props();

  // リアクティブメッセージ
  const previous = reactiveMessage(m.previous);
  const next = reactiveMessage(m.next);
  const ifCondition = reactiveMessage(m.if_condition);
  const moveTo = reactiveMessage(m.move_to);

  // 方向選択肢
  const directionOptions = [
    { value: 'previous', label: previous },
    { value: 'next', label: next }
  ];

  // 現在の言語を取得
  const currentLanguage = $derived(getLocale());
  const isJapanese = $derived(currentLanguage.startsWith('ja'));

  // 条件値を文字列として取得
  const conditionText = $derived(() => {
    // DayTargetSelectorで表示される内容を取得するためのダミー関数
    const dayLabels: Record<string, () => string> = {
      monday: () => '月曜日',
      tuesday: () => '火曜日',
      wednesday: () => '水曜日',
      thursday: () => '木曜日',
      friday: () => '金曜日',
      saturday: () => '土曜日',
      sunday: () => '日曜日',
      weekday: () => '平日',
      weekend: () => '休日',
      holiday: () => '祝日',
      non_holiday: () => '非祝日'
    };
    return dayLabels[condition.if_weekday]?.() || condition.if_weekday;
  });

  const directionText = $derived(() => {
    return condition.then_direction === 'previous' ? previous() : next();
  });

  const targetText = $derived(() => {
    const dayLabels: Record<string, () => string> = {
      monday: () => '月曜日',
      tuesday: () => '火曜日',
      wednesday: () => '水曜日',
      thursday: () => '木曜日',
      friday: () => '金曜日',
      saturday: () => '土曜日',
      sunday: () => '日曜日',
      weekday: () => '平日',
      weekend: () => '休日',
      holiday: () => '祝日',
      non_holiday: () => '非祝日'
    };

    if (condition.then_target === 'specific_weekday' && condition.then_weekday) {
      return dayLabels[condition.then_weekday]?.() || condition.then_weekday;
    }
    return dayLabels[condition.then_target]?.() || condition.then_target;
  });

  function handleConditionChange(value: DayOfWeek | AdjustmentTarget) {
    onUpdate({ if_weekday: value as DayOfWeek });
  }

  function handleDirectionChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    onUpdate({ then_direction: target.value as AdjustmentDirection });
  }

  function handleTargetChange(value: DayOfWeek | AdjustmentTarget) {
    if (['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].includes(value)) {
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

<div class="flex items-center gap-2 p-3 border border-border rounded bg-card flex-wrap">
  {#if isJapanese}
    <!-- 日本語順：{条件}なら{方向}の{対象}にずらす -->
    <DayTargetSelector
      value={condition.if_weekday}
      onchange={handleConditionChange}
    />
    <span class="text-sm">なら</span>

    <select
      value={condition.then_direction}
      onchange={handleDirectionChange}
      class="p-1 border border-border rounded bg-background text-foreground"
    >
      {#each directionOptions as option}
        <option value={option.value}>{option.label()}</option>
      {/each}
    </select>
    <span class="text-sm">の</span>

    <DayTargetSelector
      value={condition.then_target === 'specific_weekday' && condition.then_weekday ? condition.then_weekday : condition.then_target}
      onchange={handleTargetChange}
    />
    <span class="text-sm">にずらす</span>
  {:else}
    <!-- 英語順：If {条件}, move to {方向} {対象} -->
    <span class="text-sm">If</span>
    <DayTargetSelector
      value={condition.if_weekday}
      onchange={handleConditionChange}
    />
    <span class="text-sm">, move to</span>

    <select
      value={condition.then_direction}
      onchange={handleDirectionChange}
      class="p-1 border border-border rounded bg-background text-foreground"
    >
      {#each directionOptions as option}
        <option value={option.value}>{option.label()}</option>
      {/each}
    </select>

    <DayTargetSelector
      value={condition.then_target === 'specific_weekday' && condition.then_weekday ? condition.then_weekday : condition.then_target}
      onchange={handleTargetChange}
    />
  {/if}

  <button
    type="button"
    onclick={onRemove}
    class="p-1 text-destructive hover:bg-destructive/10 rounded ml-auto"
    aria-label="Remove condition"
  >
    <X class="h-4 w-4" />
  </button>
</div>
