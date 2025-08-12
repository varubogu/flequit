<script lang="ts">
  import type { TaskWithSubTasks } from '$lib/types/task';
  import type { SubTask } from "$lib/types/sub-task";
  import DueDate from '$lib/components/datetime/due-date.svelte';
  import { getTranslationService } from '$lib/stores/locale.svelte';

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

  const translationService = getTranslationService();
  // Reactive messages
  const due_date = translationService.getMessage('due_date');
  const optional = translationService.getMessage('optional');
</script>

<div class="min-w-[140px] flex-1">
  <label for="task-due-date" class="mb-2 block text-sm font-medium">
    {due_date()}
    {#if isSubTask}<span class="text-muted-foreground text-xs">{optional()}</span>{/if}
  </label>
  <DueDate
    task={{ ...currentItem, end_date: formData.end_date }}
    variant="full"
    handleDueDateClick={onDueDateClick}
  />
</div>
