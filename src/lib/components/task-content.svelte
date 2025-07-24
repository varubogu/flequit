<script lang="ts">
  import type { TaskWithSubTasks } from '$lib/types/task';
  import Badge from '$lib/components/ui/badge.svelte';
  import DueDate from './due-date.svelte';
  import * as m from '$paraglide/messages.js';
  import { reactiveMessage } from '$lib/stores/locale.svelte';

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

  // Reactive messages
  const subtasksCompleted = reactiveMessage(m.subtasks_completed);
</script>

<div class="flex-1 min-w-0 overflow-hidden">
  <!-- Title and Due Date Row -->
  <div class="flex items-start gap-3 w-full min-w-0">
    <h3
      class="truncate font-medium text-base leading-tight flex-1 min-w-0 overflow-hidden"
      class:line-through={task.status === 'completed'}
      class:text-muted-foreground={task.status === 'completed'}
      title={task.title}
      style="text-overflow: ellipsis; white-space: nowrap;"
    >
      {task.title}
    </h3>
    <DueDate
      {task}
      {datePickerPosition}
      {showDatePicker}
      {handleDueDateClick}
    />
  </div>

  {#if task.description}
    <p
      class="text-sm text-muted-foreground mt-1 block w-full min-w-0"
      style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; word-break: break-word;"
    >
      {task.description}
    </p>
  {/if}

  <!-- Sub-tasks preview -->
  {#if task.sub_tasks.length > 0}
    <div class="mt-2">
      <div class="text-xs text-muted-foreground">
        {subtasksCompleted({ completed: completedSubTasks, total: task.sub_tasks.length })}
      </div>
      <div class="w-full bg-muted rounded-full h-1.5 mt-1">
        <div
          class="bg-primary h-1.5 rounded-full transition-all duration-300"
          style="width: {subTaskProgress}%"
        ></div>
      </div>
    </div>
  {/if}

  <!-- Tags -->
  {#if task.tags.length > 0}
    <div class="flex flex-wrap gap-1 mt-2">
      {#each task.tags as tag}
        <Badge
          variant="outline"
          class="text-xs"
          style="border-color: {tag.color}; color: {tag.color};"
        >
          {tag.name}
        </Badge>
      {/each}
    </div>
  {/if}
</div>
