<script lang="ts">
  import { getTranslationService } from '$lib/stores/locale.svelte';
  import type { TaskWithSubTasks } from '$lib/types/task';
  import TagDisplay from '$lib/components/tag/display/tag-display.svelte';
  import DueDate from '$lib/components/datetime/date-inputs/due-date.svelte';
  import { taskMutations } from '$lib/services/domain/task/task-mutations-instance';
  import { SubTaskMutations } from '$lib/services/domain/subtask';
  import { selectionStore } from '$lib/stores/selection-store.svelte';

  const subTaskMutations = new SubTaskMutations();

  interface Props {
    task: TaskWithSubTasks;
    completedSubTasks: number;
    subTaskProgress: number;
    handleDueDateClick: (event: MouseEvent) => void;
  }

  let { task, completedSubTasks, subTaskProgress, handleDueDateClick }: Props = $props();

  const translationService = getTranslationService();

  // Reactive messages
  const subtasksCompleted = $derived(
    translationService.getMessage('subtasks_completed', {
      completed: completedSubTasks,
      total: task.subTasks.length
    })
  );

  function handleTagRemoveFromTask(tagId: string) {
    void taskMutations.removeTagFromTask(task.id, tagId);
  }
</script>

<div class="w-full min-w-0 flex-1 overflow-hidden">
  <!-- Title and Due Date Row -->
  <div class="flex w-full min-w-0 items-start gap-3 overflow-hidden">
    <h3
      class="min-w-0 flex-1 truncate text-base leading-tight font-medium"
      class:line-through={task.status === 'completed'}
      class:text-muted-foreground={task.status === 'completed'}
      title={task.title}
    >
      {task.title}
    </h3>
    <div class="flex-shrink-0">
      <DueDate {task} handleDueDateClick={(e) => handleDueDateClick(e as MouseEvent)} />
    </div>
  </div>

  {#if task.description}
    <p
      class="text-muted-foreground mt-1 w-full min-w-0 overflow-hidden text-sm"
      style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; word-break: break-word;"
      title={task.description}
    >
      {task.description}
    </p>
  {/if}

  <!-- Sub-tasks preview -->
  {#if task.subTasks.length > 0}
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
  {#if task.tags && task.tags.length > 0}
    <div class="mt-2 flex w-full min-w-0 flex-wrap gap-1 overflow-hidden">
      {#each task.tags as tag (tag.id)}
        <TagDisplay {tag} onTagRemoveFromItem={handleTagRemoveFromTask} />
      {/each}
    </div>
  {/if}
</div>
