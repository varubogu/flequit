<script lang="ts">
  import { getTranslationService } from '$lib/stores/locale.svelte';
  import type { TaskWithSubTasks } from '$lib/types/task';
  import TagDisplay from '$lib/components/tag/tag-display.svelte';
  import DueDate from '$lib/components/datetime/due-date.svelte';
  import { taskStore } from '$lib/stores/tasks.svelte';

  interface Props {
    task: TaskWithSubTasks;
    completedSubTasks: number;
    subTaskProgress: number;
    datePickerPosition: { x: number; y: number };
    showDatePicker: boolean;
    handleDueDateClick: (event: MouseEvent) => void;
  }

  let {
    task,
    completedSubTasks,
    subTaskProgress,
    datePickerPosition,
    showDatePicker,
    handleDueDateClick
  }: Props = $props();

  const translationService = getTranslationService();
  // Reactive messages
  const subtasksCompleted = $derived(
    translationService.getMessage('subtasks_completed', {
      completed: completedSubTasks,
      total: task.sub_tasks.length
    })
  );

  function handleTagRemoveFromTask(tagId: string) {
    taskStore.removeTagFromTask(task.id, tagId);
  }
</script>

<div class="min-w-0 flex-1 overflow-hidden">
  <!-- Title and Due Date Row -->
  <div class="flex w-full min-w-0 items-start gap-3">
    <h3
      class="min-w-0 flex-1 truncate overflow-hidden text-base leading-tight font-medium"
      class:line-through={task.status === 'completed'}
      class:text-muted-foreground={task.status === 'completed'}
      title={task.title}
      style="text-overflow: ellipsis; white-space: nowrap;"
    >
      {task.title}
    </h3>
    <DueDate {task} handleDueDateClick={(e) => handleDueDateClick(e as MouseEvent)} />
  </div>

  {#if task.description}
    <p
      class="text-muted-foreground mt-1 block w-full min-w-0 text-sm"
      style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; word-break: break-word;"
    >
      {task.description}
    </p>
  {/if}

  <!-- Sub-tasks preview -->
  {#if task.sub_tasks.length > 0}
    <div class="mt-2">
      <div class="text-muted-foreground text-xs">
        {subtasksCompleted()}
      </div>
      <div class="bg-muted mt-1 h-1.5 w-full rounded-full">
        <div
          class="bg-primary h-1.5 rounded-full transition-all duration-300"
          style="width: {subTaskProgress}%"
        ></div>
      </div>
    </div>
  {/if}

  <!-- Tags -->
  {#if task.tags.length > 0}
    <div class="mt-2 flex flex-wrap gap-1">
      {#each task.tags as tag}
        <TagDisplay {tag} onTagRemoveFromItem={handleTagRemoveFromTask} />
      {/each}
    </div>
  {/if}
</div>
