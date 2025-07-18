<script lang="ts">
  import type { TaskWithSubTasks } from '$lib/types/task';
  import { taskStore } from '$lib/stores/tasks.svelte';
  import { formatDate, getDueDateClass } from '$lib/utils/date-utils';
  import { getStatusIcon, getPriorityColor, calculateSubTaskProgress } from '$lib/utils/task-utils';
  import { TaskService } from '$lib/services/task-service';
  
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

<div 
  class="card cursor-pointer transition hover:bg-muted border-l-4 {getPriorityColor(task.priority)}"
  class:bg-muted={isSelected}
  onclick={handleTaskClick}
  role="button"
  tabindex="0"
  onkeydown={(e) => e.key === 'Enter' && handleTaskClick()}
>
  <div class="flex items-start gap-3">
    <!-- Status Toggle -->
    <button 
      class="text-lg mt-1 hover:scale-110 transition"
      onclick={handleStatusToggle}
      title="Toggle completion status"
    >
      {getStatusIcon(task.status)}
    </button>
    
    <!-- Task Content -->
    <div class="flex-1 min-w-0">
      <div class="flex items-start justify-between gap-2">
        <h3 class="font-medium text-base leading-tight"
            class:line-through={task.status === 'completed'}
            class:text-muted-foreground={task.status === 'completed'}>
          {task.title}
        </h3>
        
        {#if task.due_date}
          <span class="text-sm whitespace-nowrap {getDueDateClass(task.due_date, task.status)}">
            {formatDate(task.due_date)}
          </span>
        {/if}
      </div>
      
      {#if task.description}
        <p class="text-sm text-muted-foreground mt-1 line-clamp-2">
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
            <span 
              class="px-2 py-0.5 text-xs rounded-full border"
              style="border-color: {tag.color}; color: {tag.color};"
            >
              {tag.name}
            </span>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>

