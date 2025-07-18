<script lang="ts">
  import TaskItem from './task-item.svelte';
  import TaskAddForm from './task-add-form.svelte';
  import type { TaskWithSubTasks } from '$lib/types/task';
  import { TaskListService } from '$lib/services/task-list-service';
  import Button from '$lib/components/ui/button.svelte';
  
  interface Props {
    title?: string;
    tasks?: TaskWithSubTasks[];
    showAddButton?: boolean;
  }
  
  let { 
    title = 'Tasks', 
    tasks = [],
    showAddButton = false 
  }: Props = $props();
  
  let showAddForm = $state(false);
  let taskCountText = $derived(TaskListService.getTaskCountText(tasks.length));
  
  function toggleAddForm() {
    showAddForm = !showAddForm;
  }
  
  function handleTaskAdded() {
    showAddForm = false;
  }
  
  function handleCancel() {
    showAddForm = false;
  }
</script>

<div class="flex flex-col h-full">
  <!-- Header -->
  <div class="p-4 border-b bg-card">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold">{title}</h2>
      <div class="flex items-center gap-2">
        <span class="text-sm text-muted-foreground">
          {taskCountText}
        </span>
        {#if showAddButton}
          <Button 
            size="sm"
            onclick={toggleAddForm}
          >
            + Add Task
          </Button>
        {/if}
      </div>
    </div>
    
    <!-- Add Task Form -->
    {#if showAddForm}
      <TaskAddForm
        onTaskAdded={handleTaskAdded}
        onCancel={handleCancel}
      />
    {/if}
  </div>
  
  <!-- Task List -->
  <div class="flex-1 overflow-auto p-4">
    {#if tasks.length === 0}
      <div class="text-center text-muted-foreground py-8">
        <div class="text-4xl mb-2">📝</div>
        <p class="text-lg">No tasks found</p>
        <p class="text-sm">
          {#if showAddButton}
            Click "Add Task" to create your first task
          {:else}
            Add some tasks to get started
          {/if}
        </p>
      </div>
    {:else}
      <div class="space-y-3">
        {#each tasks as task (task.id)}
          <TaskItem {task} />
        {/each}
      </div>
    {/if}
  </div>
</div>