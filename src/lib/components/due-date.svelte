<script lang="ts">
  import type { TaskBase } from "$lib/types/task";
  import { formatDate, getDueDateClass } from "$lib/utils/date-utils";

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
    {formatDate(task.end_date)}
  </button>
{:else}
  <button
    class="text-sm whitespace-nowrap flex-shrink-0 text-muted-foreground hover:bg-muted rounded px-1 py-0.5 transition-colors"
    onclick={handleDueDateClick}
    title="Click to set due date"
  >
    + Add date
  </button>
{/if}
