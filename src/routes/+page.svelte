<script lang="ts">
  import Sidebar from '$lib/components/sidebar/sidebar.svelte';
  import TaskList from '$lib/components/task/task-list.svelte';
  import TaskDetail from '$lib/components/task/task-detail.svelte';
  import * as Resizable from '$lib/components/ui/resizable/index.js';
  import { viewStore } from '$lib/stores/view-store.svelte';
  import type { ViewType } from '$lib/services/view-service';

  function handleViewChange(view: ViewType) {
    viewStore.changeView(view);
  }

  function handleTaskSelectionRequested(event: CustomEvent<{ taskId: string }>) {
    // This will be handled by TaskDetail component's confirmation dialog
    // The event is triggered when a task selection is requested but blocked due to new task mode
  }

  function handleSubTaskSelectionRequested(event: CustomEvent<{ subTaskId: string }>) {
    // This will be handled by TaskDetail component's confirmation dialog
    // The event is triggered when a subtask selection is requested but blocked due to new task mode
  }
</script>

<div class="h-screen flex bg-background">
  <!-- Sidebar -->
  <Sidebar currentView={viewStore.currentView} onViewChange={handleViewChange} />

  <!-- Main Content with Resizable Panels -->
  <Resizable.PaneGroup direction="horizontal">
    <Resizable.Pane defaultSize={30} minSize={20}>
      <TaskList
        title={viewStore.viewTitle}
        tasks={viewStore.tasks}
        showAddButton={viewStore.showAddButton}
        on:taskSelectionRequested={handleTaskSelectionRequested}
        on:subTaskSelectionRequested={handleSubTaskSelectionRequested}
      />
    </Resizable.Pane>

    <Resizable.Handle />

    <Resizable.Pane defaultSize={50} minSize={20}>
      <TaskDetail />
    </Resizable.Pane>
  </Resizable.PaneGroup>
</div>
