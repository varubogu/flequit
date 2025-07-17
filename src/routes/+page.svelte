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
  <PaneGroup direction="horizontal" class="flex-1">
    <Pane defaultSize={30} minSize={20} maxSize={50}>
      <TaskList 
        title={viewStore.viewTitle}
        tasks={viewStore.tasks}
        showAddButton={viewStore.showAddButton}
      />
    </Pane>
    
    <PaneResizer class="w-1 bg-border hover:bg-primary cursor-col-resize transition-colors" />
    
    <Pane defaultSize={70} minSize={50}>
      <TaskDetail />
    </Pane>
  </PaneGroup>
</div>
