<script lang="ts">
  import Sidebar from '$lib/components/sidebar.svelte';
  import { taskStore } from '$lib/stores/tasks.svelte';
  import type { ProjectTree, TaskWithSubTasks } from '$lib/types/task';
  import type { ViewType } from '$lib/services/view-service';

  let currentView = $state<ViewType>('all');
  let selectedProjectId = $derived(taskStore.selectedProjectId);

  // Mock data for the store
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
          tasks: [{ id: 'task-1' } as TaskWithSubTasks, { id: 'task-2' } as TaskWithSubTasks]
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

  const mockTasks = [
    { id: 'task-1', list_id: 'list-1', title: 'Task 1', status: 'not_started', end_date: new Date() },
    { id: 'task-2', list_id: 'list-1', title: 'Task 2', status: 'in_progress', end_date: new Date() },
    { id: 'task-3', list_id: 'list-1', title: 'Task 3', status: 'completed' },
  ];

  // Set initial store state
  $effect(() => {
    taskStore.projects = mockProjects;
    taskStore.selectedProjectId = null;
    taskStore.selectedListId = null;
  });

  function handleViewChange(view: ViewType) {
    currentView = view;
  }
</script>

<div class="flex">
  <Sidebar {currentView} onViewChange={handleViewChange} />
  <main class="p-4">
    <h1 class="text-xl font-bold">Sidebar Test Page</h1>
    <div data-testid="current-view">Current View: {currentView}</div>
    <div data-testid="selected-project">Selected Project ID: {selectedProjectId || 'none'}</div>
  </main>
</div>
