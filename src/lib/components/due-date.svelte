<script lang="ts">
  import type { TaskBase } from "$lib/types/task";
  import { getDueDateClass } from "$lib/utils/date-utils";
  import * as m from '$paraglide/messages.js';
  import { reactiveMessage } from '$lib/stores/locale.svelte';

  interface Props {
    task: TaskBase;
    handleDueDateClick: (event?: Event) => void;
    variant?: 'compact' | 'full';
    class?: string;
  }

  let {
    task,
    handleDueDateClick,
    variant = 'compact',
    class: className = ''
  }: Props = $props();

  // Reactive messages
  const todayLabel = reactiveMessage(m.today);
  const tomorrowLabel = reactiveMessage(m.tomorrow);
  const yesterdayLabel = reactiveMessage(m.yesterday);
  const addDateLabel = reactiveMessage(m.add_date);
  const selectDate = reactiveMessage(m.select_date);

  // Style classes based on variant
  const baseClasses = 'text-sm whitespace-nowrap flex-shrink-0 hover:bg-muted rounded px-1 py-0.5 transition-colors';
  const colorClasses = task.end_date ? getDueDateClass(task.end_date, task.status) : 'text-muted-foreground';

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
  {#if task.end_date}
    <button
      class="{baseClasses} {colorClasses} {className}"
      onclick={handleDueDateClick}
      title="Click to change due date"
    >
      {formatDateI18n(task.end_date)}
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
  <button
    class="text-left p-0 border-0 bg-transparent {className} {task.end_date ? getDueDateClass(task.end_date, task.status) : 'text-muted-foreground'}"
    onclick={handleDueDateClick}
  >
    {#if task.end_date}
      {formatDateI18n(task.end_date)}
    {:else}
      {selectDate()}
    {/if}
  </button>
{/if}
