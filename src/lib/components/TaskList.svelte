<script lang="ts">
  import TaskItem from './TaskItem.svelte';
  import type { TaskWithSubTasks } from '$lib/types/task';
  import { TaskListService } from '$lib/services/task-list-service';
  
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
  
  let newTaskTitle = $state('');
  let showAddForm = $state(false);
  let taskCountText = $derived(TaskListService.getTaskCountText(tasks.length));
  
  function handleAddTask() {
    if (TaskListService.addNewTask(newTaskTitle)) {
      newTaskTitle = '';
      showAddForm = false;
    }
  }
  
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      handleAddTask();
    } else if (event.key === 'Escape') {
      showAddForm = false;
      newTaskTitle = '';
    }
  }
  
  function toggleAddForm() {
    showAddForm = !showAddForm;
    if (!showAddForm) {
      newTaskTitle = '';
    }
  }
  
  function cancelAddForm() {
    showAddForm = false;
    newTaskTitle = '';
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
          <button 
            class="btn btn-primary text-sm"
            onclick={toggleAddForm}
          >
            + Add Task
          </button>
        {/if}
      </div>
    </div>
    
    <!-- Add Task Form -->
    {#if showAddForm}
      <div class="mt-3">
        <div class="flex gap-2">
          <input
            type="text"
            class="input flex-1"
            placeholder="Enter task title..."
            bind:value={newTaskTitle}
            onkeydown={handleKeydown}
            autofocus
          />
          <button 
            class="btn btn-primary"
            onclick={handleAddTask}
            disabled={!newTaskTitle.trim()}
          >
            Add
          </button>
          <button 
            class="btn btn-secondary"
            onclick={cancelAddForm}
          >
            Cancel
          </button>
        </div>
      </div>
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