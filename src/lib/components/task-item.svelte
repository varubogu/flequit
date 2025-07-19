<script lang="ts">
  import type { TaskWithSubTasks } from '$lib/types/task';
  import { taskStore } from '$lib/stores/tasks.svelte';
  import { formatDate, getDueDateClass } from '$lib/utils/date-utils';
  import { getStatusIcon, getPriorityColor, calculateSubTaskProgress } from '$lib/utils/task-utils';
  import { TaskService } from '$lib/services/task-service';
  import Badge from '$lib/components/ui/badge.svelte';
  import Button from '$lib/components/ui/button.svelte';
  import { ChevronDown, ChevronRight } from 'lucide-svelte';

  interface Props {
    task: TaskWithSubTasks;
  }

  let { task }: Props = $props();

  let isSelected = $derived(taskStore.selectedTaskId === task.id);
  let completedSubTasks = $derived(task.sub_tasks.filter(st => st.status === 'completed').length);
  let subTaskProgress = $derived(calculateSubTaskProgress(completedSubTasks, task.sub_tasks.length));
  let showSubTasks = $state(false);

  function handleTaskClick() {
    TaskService.selectTask(task.id);
  }

  function handleStatusToggle(event: Event) {
    event.stopPropagation();
    TaskService.toggleTaskStatus(task.id);
  }

  function handleSubTaskToggle(event: Event, subTaskId: string) {
    event.stopPropagation();
    TaskService.toggleSubTaskStatus(task, subTaskId);
  }

  function toggleSubTasksAccordion(event: Event) {
    event.stopPropagation();
    showSubTasks = !showSubTasks;
  }
</script>

<div class="flex items-start gap-1 w-full">
  <!-- Accordion Toggle Button -->
  {#if task.sub_tasks.length > 0}
    <Button
      variant="ghost"
      size="icon"
      class="h-8 w-8 min-h-[32px] min-w-[32px] text-muted-foreground hover:text-foreground mt-1"
      onclick={toggleSubTasksAccordion}
      title="Toggle subtasks"
    >
      {#if showSubTasks}
        <ChevronDown class="h-4 w-4" />
      {:else}
        <ChevronRight class="h-4 w-4" />
      {/if}
    </Button>
  {:else}
    <div class="h-8 w-8 min-h-[32px] min-w-[32px] mt-1"></div>
  {/if}

  <!-- Main Task Button -->
  <Button
    variant="ghost"
    class="task-item-button rounded-lg border bg-card text-card-foreground shadow-sm border-l-4 {getPriorityColor(task.priority)} p-4 h-auto flex-1 justify-start text-left transition-all {isSelected ? 'selected' : ''} min-w-0"
    onclick={handleTaskClick}
  >
    <div class="flex items-start gap-3 w-full min-w-0 overflow-hidden">
    <!-- Status Toggle -->
    <Button
      variant="ghost"
      size="icon"
      class="text-3xl hover:scale-110 transition h-12 w-12 min-h-[48px] min-w-[48px] "
      onclick={(e) => e && handleStatusToggle(e)}
      title="Toggle completion status"
    >
      {getStatusIcon(task.status)}
    </Button>

    <!-- Task Content -->
    <div class="flex-1 min-w-0 overflow-hidden">
      <!-- Title and Due Date Row -->
      <div class="flex items-start gap-3 w-full min-w-0">
        <h3 class="truncate font-medium text-base leading-tight flex-1 min-w-0 overflow-hidden"
            class:line-through={task.status === 'completed'}
            class:text-muted-foreground={task.status === 'completed'}
            title={task.title}
            style="text-overflow: ellipsis; white-space: nowrap;">
          {task.title}
        </h3>

        {#if task.due_date}
          <span class="text-sm whitespace-nowrap flex-shrink-0 {getDueDateClass(task.due_date, task.status)}">
            {formatDate(task.due_date)}
          </span>
        {/if}
      </div>

      {#if task.description}
        <p class="text-sm text-muted-foreground mt-1 block w-full min-w-0"
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
  </Button>
</div>

<!-- Sub-tasks Accordion -->
{#if task.sub_tasks.length > 0 && showSubTasks}
  <div class="ml-10 mt-2 space-y-2">
    {#each task.sub_tasks as subTask (subTask.id)}
      <div class="flex items-center gap-2 p-2 rounded border bg-muted/30">
        <Button
          variant="ghost"
          size="icon"
          class="text-lg h-6 w-6 min-h-[24px] min-w-[24px]"
          onclick={(e) => e && handleSubTaskToggle(e, subTask.id)}
          title="Toggle subtask completion"
        >
          {subTask.status === 'completed' ? '✅' : '⚪'}
        </Button>
        <span
          class="flex-1 text-sm"
          class:line-through={subTask.status === 'completed'}
          class:text-muted-foreground={subTask.status === 'completed'}
        >
          {subTask.title}
        </span>
      </div>
    {/each}
  </div>
{/if}
