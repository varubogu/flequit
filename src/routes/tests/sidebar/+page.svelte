<script lang="ts">
  import Sidebar from '$lib/components/sidebar/sidebar.svelte';
  import { taskStore } from '$lib/stores/tasks.svelte';
  import type { TaskWithSubTasks } from '$lib/types/task';
  import type { ProjectTree } from '$lib/types/project';
  import type { ViewType } from '$lib/services/ui/view';

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
  const today = $state(new Date());
  today.setHours(0, 0, 0, 0);

  const mockProjects: ProjectTree[] = [
    {
      id: 'project-1',
      name: 'Work',
      color: '#ff0000',
      orderIndex: 0,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      taskLists: [
        {
          id: 'list-1',
          projectId: 'project-1',
          name: 'Frontend',
          orderIndex: 0,
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          tasks: [
            {
              id: 'task-1',
              listId: 'list-1',
              projectId: 'project-1',
              title: 'Task 1',
              status: 'not_started',
              priority: 2,
              end_date: today,
              assignedUserIds: [],
              tagIds: [],
              orderIndex: 0,
              isArchived: false,
              createdAt: new Date(),
              updatedAt: new Date(),
              subTasks: [],
              tags: []
            } as TaskWithSubTasks,
            {
              id: 'task-2',
              projectId: 'project-1',
              listId: 'list-1',
              title: 'Task 2',
              status: 'in_progress',
              priority: 2,
              end_date: today,
              assignedUserIds: [],
              tagIds: [],
              orderIndex: 1,
              isArchived: false,
              createdAt: new Date(),
              updatedAt: new Date(),
              subTasks: [],
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
      orderIndex: 1,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      taskLists: []
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
