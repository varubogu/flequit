<script lang="ts">
  import type { TaskWithSubTasks } from '$lib/types/task';
  import { taskStore } from '$lib/stores/tasks.svelte';
  import { formatDate, getDueDateClass } from '$lib/utils/date-utils';
  import { getStatusIcon, getPriorityColor, calculateSubTaskProgress } from '$lib/utils/task-utils';
  import { TaskService } from '$lib/services/task-service';
  import Badge from '$lib/components/ui/badge.svelte';
  import Button from '$lib/components/ui/button.svelte';

  interface Props {
    task: TaskWithSubTasks;
  }

  let { task }: Props = $props();

  let isSelected = $derived(taskStore.selectedTaskId === task.id);
  let completedSubTasks = $derived(task.sub_tasks.filter(st => st.status === 'completed').length);
  let subTaskProgress = $derived(calculateSubTaskProgress(completedSubTasks, task.sub_tasks.length));

  function handleTaskClick() {
    TaskService.selectTask(task.id);
  }

  function handleStatusToggle(event: Event) {
    event.stopPropagation();
    TaskService.toggleTaskStatus(task.id);
  }
</script>

<Button
  variant="ghost"
  class="task-item-button rounded-lg border bg-card text-card-foreground shadow-sm border-l-4 {getPriorityColor(task.priority)} p-4 h-auto w-full justify-start text-left transition-all {isSelected ? 'selected' : ''}"
  onclick={handleTaskClick}
>
  <div class="flex items-start gap-3 w-full">
    <!-- Status Toggle -->
    <Button
      variant="ghost"
      size="icon"
      class="text-lg mt-1 hover:scale-110 transition h-8 w-8"
      onclick={(e) => e && handleStatusToggle(e)}
      title="Toggle completion status"
    >
      {getStatusIcon(task.status)}
    </Button>

    <!-- Task Content -->
    <div class="flex-1 min-w-0">
      <!-- Title and Due Date Row -->
      <div class="flex justify-between items-start gap-3 w-full">
        <h3 class="truncate font-medium text-base leading-tight"
            class:line-through={task.status === 'completed'}
            class:text-muted-foreground={task.status === 'completed'}
            title={task.title}>
          {task.title}
        </h3>

        {#if task.due_date}
          <span class="text-sm whitespace-nowrap {getDueDateClass(task.due_date, task.status)}">
            {formatDate(task.due_date)}
          </span>
        {/if}
      </div>

      {#if task.description}
        <p class="text-sm text-muted-foreground mt-1 block w-full"
           style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; word-break: break-word;">
          {task.description}
        </p>
      {/if}

      <!-- Sub-tasks preview -->
      {#if task.sub_tasks.length > 0}
        <div class="mt-2">
          <div class="text-xs text-muted-foreground">
            {completedSubTasks} / {task.sub_tasks.length} subtasks completed
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
  </div>
</Button>
