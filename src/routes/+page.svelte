<script lang="ts">
  import Sidebar from '$lib/components/sidebar.svelte';
  import TaskList from '$lib/components/task-list.svelte';
  import TaskDetail from '$lib/components/task-detail.svelte';
  import * as Resizable from '$lib/components/ui/resizable/index.js';
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
  <Resizable.PaneGroup direction="horizontal">
    <Resizable.Pane defaultSize={30} minSize={30} maxSize={50}>
      <TaskList
        title={viewStore.viewTitle}
        tasks={viewStore.tasks}
        showAddButton={viewStore.showAddButton}
      />
    </Resizable.Pane>

    <Resizable.Handle />

    <Resizable.Pane defaultSize={50} minSize={30}>
      <TaskDetail />
    </Resizable.Pane>
  </Resizable.PaneGroup>
</div>
