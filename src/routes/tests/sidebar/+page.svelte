<script lang="ts">
  import Sidebar from '$lib/components/sidebar/sidebar.svelte';
  import { taskStore } from '$lib/stores/tasks.svelte';
  import type { ProjectTree, TaskWithSubTasks } from '$lib/types/task';
  import type { ViewType } from '$lib/services/view-service';

  let currentView = $state<ViewType>('all');
  let selectedProjectId = $derived(taskStore.selectedProjectId);
  let selectedListId = $derived(taskStore.selectedListId);

  // Force reactivity update when store changes
  $effect(() => {
    // This effect will run whenever the store state changes
    void taskStore.selectedProjectId;
    void taskStore.selectedListId;
  });

  // Mock data for the store
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const mockProjects: ProjectTree[] = [
    {
      id: 'project-1',
      name: 'Work',
      color: '#ff0000',
      order_index: 0,
      is_archived: false,
      created_at: new Date(),
      updated_at: new Date(),
      task_lists: [
        {
          id: 'list-1',
          project_id: 'project-1',
          name: 'Frontend',
          order_index: 0,
          is_archived: false,
          created_at: new Date(),
          updated_at: new Date(),
          tasks: [
            {
              id: 'task-1',
              list_id: 'list-1',
              title: 'Task 1',
              status: 'not_started',
              priority: 2,
              end_date: today,
              order_index: 0,
              is_archived: false,
              created_at: new Date(),
              updated_at: new Date(),
              sub_tasks: [],
              tags: []
            } as TaskWithSubTasks,
            {
              id: 'task-2',
              list_id: 'list-1',
              title: 'Task 2',
              status: 'in_progress',
              priority: 2,
              end_date: today,
              order_index: 1,
              is_archived: false,
              created_at: new Date(),
              updated_at: new Date(),
              sub_tasks: [],
              tags: []
            } as TaskWithSubTasks
          ]
        }
      ]
    },
    {
      id: 'project-2',
      name: 'Personal',
      color: '#00ff00',
      order_index: 1,
      is_archived: false,
      created_at: new Date(),
      updated_at: new Date(),
      task_lists: []
    }
  ];

  // Set initial store state only once when component mounts
  $effect(() => {
    taskStore.projects = mockProjects;
    taskStore.selectedProjectId = null;
    taskStore.selectedListId = null;
    return () => {
      // Cleanup on unmount - reset to initial state
      taskStore.selectedProjectId = null;
      taskStore.selectedListId = null;
    };
  });

  function handleViewChange(view: ViewType) {
    currentView = view;
  }
</script>

<div class="flex">
  <div class="flex-shrink-0">
    <Sidebar {currentView} onViewChange={handleViewChange} />
  </div>
  <main class="flex-1 p-4">
    <h1 class="text-xl font-bold">Sidebar Test Page</h1>
    <div data-testid="current-view">Current View: {currentView}</div>
    <div data-testid="selected-project">Selected Project ID: {selectedProjectId || 'null'}</div>
    <div data-testid="selected-list">Selected List ID: {selectedListId || 'null'}</div>
  </main>
</div>
