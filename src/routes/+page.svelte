<script lang="ts">
  import Sidebar from '$lib/components/Sidebar.svelte';
  import TaskList from '$lib/components/TaskList.svelte';
  import TaskDetail from '$lib/components/TaskDetail.svelte';
  import { PaneGroup, Pane, PaneResizer } from 'paneforge';
  import { viewStore } from '$lib/stores/view-store.svelte';
  import type { ViewType } from '$lib/services/view-service';

  function handleViewChange(view: ViewType) {
    viewStore.changeView(view);
  }
</script>

<div class="h-screen flex">
  <!-- Sidebar -->
  <Sidebar currentView={viewStore.currentView} onViewChange={handleViewChange} />

  <!-- Main Content with Resizable Panels -->
  <PaneGroup direction="horizontal">
    <Pane defaultSize={30} minSize={30} maxSize={50} order={1}>
      <TaskList
        title={viewStore.viewTitle}
        tasks={viewStore.tasks}
        showAddButton={viewStore.showAddButton}
      />
    </Pane>

    <PaneResizer />

    <Pane defaultSize={50} minSize={30} order={2}>
      <TaskDetail />
    </Pane>
  </PaneGroup>
</div>

<style>
  /* PaneResizer styling using data attributes */
  :global([data-pane-resizer]) {
    background-color: var(--color-border);
    width: 10px;
    cursor: col-resize;
    transition: background-color 0.2s ease;
    position: relative;
  }

  :global([data-pane-resizer]:hover) {
    background-color: var(--color-primary);
  }

  :global([data-pane-resizer][data-active="pointer"]) {
    background-color: var(--color-primary);
  }

  /* Add visual indicator */
  :global([data-pane-resizer]:before) {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 5px;
    height: 32px;
    background-color: var(--color-muted-foreground);
    border-radius: 5px;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  :global([data-pane-resizer]:hover:before),
  :global([data-pane-resizer][data-active="pointer"]:before) {
    opacity: 1;
    background-color: var(--color-primary-foreground);
  }
</style>
