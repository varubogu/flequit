<script lang="ts">
  import TaskItem from './task-item.svelte';
  import TaskAddForm from './task-add-form.svelte';
  import type { TaskWithSubTasks } from '$lib/types/task';
  import { TaskListService } from '$lib/services/task-list-service';
  import Button from '$lib/components/shared/button.svelte';
  import { Plus, PanelLeft } from 'lucide-svelte';
  import * as m from '$paraglide/messages.js';
  import { reactiveMessage } from '$lib/stores/locale.svelte';
  import { createEventDispatcher } from 'svelte';
  import { useSidebar } from '$lib/components/ui/sidebar/context.svelte.js';

  interface Props {
    title?: string;
    tasks?: TaskWithSubTasks[];
    showAddButton?: boolean;
    onTaskClick?: (taskId: string) => void;
  }

  const dispatch = createEventDispatcher<{
    taskSelectionRequested: { taskId: string };
    subTaskSelectionRequested: { subTaskId: string };
  }>();

  let {
    title = 'Tasks',
    tasks = [],
    showAddButton = false,
    onTaskClick
  }: Props = $props();

  let showAddForm = $state(false);
  let taskCountText = $derived(TaskListService.getTaskCountText(tasks.length));
  let isSearchView = $derived(title?.startsWith('Search:') || title === 'Search Results');
  
  // Get sidebar state for responsive toggle button
  const sidebar = useSidebar();

  function toggleAddForm() {
    showAddForm = !showAddForm;
  }

  function handleTaskAdded() {
    showAddForm = false;
  }

  function handleCancel() {
    showAddForm = false;
  }

  // Reactive messages
  const addTask = reactiveMessage(m.add_task);
  const noSearchResults = reactiveMessage(m.no_search_results);
  const noTasksFound = reactiveMessage(m.no_tasks_found);
  const tryDifferentSearch = reactiveMessage(m.try_different_search);
  const clickAddTask = reactiveMessage(m.click_add_task);
  const addSomeTasks = reactiveMessage(m.add_some_tasks);
</script>

<div class="flex flex-col h-full" data-testid="task-list">
  <!-- Header -->
  <div class="p-4 border-b bg-card">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <!-- レスポンシブ折りたたみボタン（モバイル時のみ表示） -->
        {#if sidebar.isMobile}
          <Button
            size="icon"
            variant="ghost"
            onclick={sidebar.toggle}
            title="Toggle Sidebar"
            class="md:hidden"
            data-testid="mobile-sidebar-toggle"
          >
            <PanelLeft class="h-4 w-4" />
          </Button>
        {/if}
        <h2 class="text-xl font-semibold">{title}</h2>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm text-muted-foreground">
          {taskCountText}
        </span>
        {#if showAddButton}
          <Button
            size="icon"
            onclick={toggleAddForm}
            title={addTask()}
            data-testid="add-task"
          >
            <Plus class="h-4 w-4" />
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
  <div class="flex-1 overflow-auto p-4 min-w-0">
    {#if tasks.length === 0}
      <div class="text-center text-muted-foreground py-8">
        <div class="text-4xl mb-2">{isSearchView ? '🔍' : '📝'}</div>
        <p class="text-lg">{isSearchView ? noSearchResults() : noTasksFound()}</p>
        <p class="text-sm">
          {#if isSearchView}
            {tryDifferentSearch()}
          {:else if showAddButton}
            {clickAddTask()}
          {:else}
            {addSomeTasks()}
          {/if}
        </p>
      </div>
    {:else}
      <div class="space-y-3 min-w-0" data-testid="task-items">
        {#each tasks as task (task.id)}
          <TaskItem
            {task}
            {onTaskClick}
            on:taskSelectionRequested={(event) => dispatch('taskSelectionRequested', event.detail)}
            on:subTaskSelectionRequested={(event) => dispatch('subTaskSelectionRequested', event.detail)}
          />
        {/each}
      </div>
    {/if}
  </div>
</div>
