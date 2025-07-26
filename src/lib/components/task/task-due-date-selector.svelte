<script lang="ts">
  import type { TaskWithSubTasks, SubTask } from '$lib/types/task';
  import DueDate from '$lib/components/datetime/due-date.svelte';
  import { reactiveMessage } from '$lib/stores/locale.svelte';
  import * as m from '$paraglide/messages';

  interface Props {
    currentItem: TaskWithSubTasks | SubTask;
    isSubTask: boolean;
    formData: {
      title: string;
      description: string;
      start_date: Date | undefined;
      end_date: Date | undefined;
      is_range_date: boolean;
      priority: number;
    };
    onDueDateClick: (event?: Event) => void;
  }

  let { currentItem, isSubTask, formData, onDueDateClick }: Props = $props();

  // Reactive messages
  const due_date = reactiveMessage(m.due_date);
  const optional = reactiveMessage(m.optional);
</script>

<div class="min-w-[140px] flex-1">
  <label for="task-due-date" class="block text-sm font-medium mb-2">
    {due_date()} {#if isSubTask}<span class="text-xs text-muted-foreground">{optional()}</span>{/if}
  </label>
  <DueDate
    task={{ ...currentItem, end_date: formData.end_date }}
    variant="full"
    handleDueDateClick={onDueDateClick}
  />
</div>
