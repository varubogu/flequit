<script lang="ts">
  import { getTranslationService } from '$lib/stores/locale.svelte';
  import type { TaskBase } from '$lib/types/task';
  import { getDueDateClass } from '$lib/utils/datetime-utils';

  interface Props {
    task: TaskBase;
    handleDueDateClick: (event?: Event) => void;
    variant?: 'compact' | 'full';
    class?: string;
  }

  let { task, handleDueDateClick, variant = 'compact', class: className = '' }: Props = $props();

  const translationService = getTranslationService();
  // Reactive messages
  const todayLabel = translationService.getMessage('today');
  const tomorrowLabel = translationService.getMessage('tomorrow');
  const yesterdayLabel = translationService.getMessage('yesterday');
  const addDateLabel = translationService.getMessage('add_date');
  const selectDate = translationService.getMessage('select_date');

  // Style classes based on variant
  const baseClasses =
    'text-sm whitespace-nowrap flex-shrink-0 hover:bg-muted rounded px-1 py-0.5 transition-colors';
  const colorClasses = task.planEndDate
    ? getDueDateClass(task.planEndDate, task.status)
    : 'text-muted-foreground';

  function formatDateI18n(date: Date | undefined): string {
    if (!date) return '';

    const now = new Date();
    const taskDate = new Date(date);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const taskDay = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());

    if (taskDay.getTime() === today.getTime()) {
      return todayLabel();
    } else if (taskDay.getTime() === today.getTime() + 24 * 60 * 60 * 1000) {
      return tomorrowLabel();
    } else if (taskDay.getTime() === today.getTime() - 24 * 60 * 60 * 1000) {
      return yesterdayLabel();
    } else {
      return taskDate.toLocaleDateString();
    }
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
