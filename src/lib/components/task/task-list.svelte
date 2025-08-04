<script lang="ts">
  import { getTranslationService } from '$lib/stores/locale.svelte';
  import TaskItem from './task-item.svelte';
  import TaskAddForm from './task-add-form.svelte';
  import type { TaskWithSubTasks } from '$lib/types/task';
  import { TaskListService } from '$lib/services/task-list-service';
  import Button from '$lib/components/shared/button.svelte';
  import { Plus, PanelLeft } from 'lucide-svelte';
  import { createEventDispatcher } from 'svelte';
  import { useSidebar } from '$lib/components/ui/sidebar/context.svelte.js';

  interface Props {
    title?: string;
    tasks?: TaskWithSubTasks[];
    showAddButton?: boolean;
    onTaskClick?: (taskId: string) => void;
    onSubTaskClick?: (subTaskId: string) => void;
  }

  const dispatch = createEventDispatcher<{
    taskSelectionRequested: { taskId: string };
    subTaskSelectionRequested: { subTaskId: string };
  }>();

  let {
    title = 'Tasks',
    tasks = [],
    showAddButton = false,
    onTaskClick,
    onSubTaskClick
  }: Props = $props();

  const translationService = getTranslationService();
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
  const addTask = translationService.getMessage('add_task');
  const noSearchResults = translationService.getMessage('no_search_results');
  const noTasksFound = translationService.getMessage('no_tasks_found');
  const tryDifferentSearch = translationService.getMessage('try_different_search');
  const clickAddTask = translationService.getMessage('click_add_task');
  const addSomeTasks = translationService.getMessage('add_some_tasks');
</script>

<div class="flex h-full w-full flex-col overflow-hidden" data-testid="task-list">
  <!-- Header -->
  <div class="bg-card w-full min-w-0 border-b p-4">
    <div class="flex min-w-0 items-center justify-between">
      <div class="flex min-w-0 flex-1 items-center gap-2">
        <!-- レスポンシブ折りたたみボタン（モバイル時のみ表示） -->
        {#if sidebar.isMobile}
          <Button
            size="icon"
            variant="ghost"
            onclick={sidebar.toggle}
            title="Toggle Sidebar"
            class="flex-shrink-0 md:hidden"
            data-testid="mobile-sidebar-toggle"
          >
            <PanelLeft class="h-4 w-4" />
          </Button>
        {/if}
        <h2 class="truncate text-xl font-semibold">{title}</h2>
      </div>
      <div class="flex flex-shrink-0 items-center gap-2">
        <span class="text-muted-foreground text-sm">
          {taskCountText}
        </span>
        {#if showAddButton}
          <Button size="icon" onclick={toggleAddForm} title={addTask()} data-testid="add-task">
            <Plus class="h-4 w-4" />
          </Button>
        {/if}
      </div>
    </div>

    <!-- Add Task Form -->
    {#if showAddForm}
      <TaskAddForm onTaskAdded={handleTaskAdded} onCancel={handleCancel} />
    {/if}
  </div>

  <!-- Task List -->
  <div class="w-full min-w-0 flex-1 overflow-auto p-4">
    {#if tasks.length === 0}
      <div class="text-muted-foreground py-8 text-center">
        <div class="mb-2 text-4xl">{isSearchView ? '🔍' : '📝'}</div>
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
      <div class="min-w-0 space-y-3" data-testid="task-items">
        {#each tasks as task (task.id)}
          <TaskItem
            {task}
            {onTaskClick}
            {onSubTaskClick}
            on:taskSelectionRequested={(event) => dispatch('taskSelectionRequested', event.detail)}
            on:subTaskSelectionRequested={(event) =>
              dispatch('subTaskSelectionRequested', event.detail)}
          />
        {/each}
      </div>
    {/if}
  </div>
</div>
