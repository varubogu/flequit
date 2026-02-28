<script lang="ts">
  import { useTranslation } from '$lib/hooks/use-translation.svelte';
  import type { TaskBase } from '$lib/types/task';
  import { formatDate, getDueDateClass } from '$lib/utils/datetime/formatting';
  import { generalSettingsStore } from '$lib/stores/settings/general-settings-store.svelte';

  interface Props {
    task: TaskBase;
    handleDueDateClick: (event?: Event) => void;
    variant?: 'compact' | 'full';
    class?: string;
  }

  let { task, handleDueDateClick, variant = 'compact', class: className = '' }: Props = $props();

  const timezone = $derived(generalSettingsStore.effectiveTimezone);

  const translationService = useTranslation();
  // Reactive messages
  const todayLabel = translationService.getMessage('today');
  const tomorrowLabel = translationService.getMessage('tomorrow');
  const yesterdayLabel = translationService.getMessage('yesterday');
  const addDateLabel = translationService.getMessage('add_date');
  const selectDate = translationService.getMessage('select_date');

  // Style classes based on variant（タイムゾーン考慮のリアクティブ計算）
  const baseClasses =
    'text-sm whitespace-nowrap flex-shrink-0 hover:bg-muted rounded px-1 py-0.5 transition-colors';
  const colorClasses = $derived(
    task.planEndDate
      ? getDueDateClass(task.planEndDate, task.status, timezone)
      : 'text-muted-foreground'
  );

  // Today/Tomorrow/Yesterday を i18n ラベルに変換しつつ、タイムゾーン考慮の日付フォーマットを適用する
  function formatDateI18n(date: Date | undefined): string {
    const result = formatDate(date, timezone);
    if (result === 'Today') return todayLabel();
    if (result === 'Tomorrow') return tomorrowLabel();
    if (result === 'Yesterday') return yesterdayLabel();
    return result;
  }
</script>

{#if variant === 'compact'}
  <!-- Compact variant -->
  {#if task.planEndDate}
    <button
      class="{baseClasses} {colorClasses} {className}"
      onclick={handleDueDateClick}
      title="Click to change due date"
    >
      {formatDateI18n(task.planEndDate)}
    </button>
  {:else}
    <button
      class="{baseClasses} {colorClasses} {className}"
      onclick={handleDueDateClick}
      title="Click to set due date"
    >
      + {addDateLabel()}
    </button>
  {/if}
{:else}
  <!-- Full variant -->
  <button class="{baseClasses} {colorClasses} {className}" onclick={handleDueDateClick}>
    {#if task.planEndDate}
      {formatDateI18n(task.planEndDate)}
    {:else}
      {selectDate()}
    {/if}
  </button>
{/if}
