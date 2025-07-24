<script lang="ts">
  import type { TaskBase } from "$lib/types/task";
  import { getDueDateClass } from "$lib/utils/date-utils";
  import * as m from '$paraglide/messages.js';
  import { reactiveMessage } from '$lib/stores/locale.svelte';

  interface Props {
    task: TaskBase;
    datePickerPosition: { x: number; y: number };
    showDatePicker: boolean;
    handleDueDateClick: (event: MouseEvent) => void;
  }

  let {
    task,
    datePickerPosition,
    showDatePicker,
    handleDueDateClick
  }: Props = $props();

  // Reactive messages
  const todayLabel = reactiveMessage(m.today);
  const tomorrowLabel = reactiveMessage(m.tomorrow);
  const yesterdayLabel = reactiveMessage(m.yesterday);
  const addDateLabel = reactiveMessage(m.add_date);

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

{#if task.end_date}
  <button
    class="text-sm whitespace-nowrap flex-shrink-0 {getDueDateClass(
      task.end_date,
      task.status,
    )} hover:bg-muted rounded px-1 py-0.5 transition-colors"
    onclick={handleDueDateClick}
    title="Click to change due date"
  >
    {formatDateI18n(task.end_date)}
  </button>
{:else}
  <button
    class="text-sm whitespace-nowrap flex-shrink-0 text-muted-foreground hover:bg-muted rounded px-1 py-0.5 transition-colors"
    onclick={handleDueDateClick}
    title="Click to set due date"
  >
    + {addDateLabel()}
  </button>
{/if}
