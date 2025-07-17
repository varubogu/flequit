<script lang="ts">
  import Sidebar from '$lib/components/Sidebar.svelte';
  import TaskList from '$lib/components/TaskList.svelte';
  import TaskDetail from '$lib/components/TaskDetail.svelte';
  import { viewStore } from '$lib/stores/view-store.svelte';
  import type { ViewType } from '$lib/services/view-service';
  
  function handleViewChange(view: ViewType) {
    viewStore.changeView(view);
  }
</script>

<div class="h-screen flex">
  <!-- Sidebar -->
  <Sidebar currentView={viewStore.currentView} onViewChange={handleViewChange} />
  
  <!-- Main Content -->
  <div class="flex-1 flex">
    <!-- Task List -->
    <div class="w-96 border-r">
      <TaskList 
        title={viewStore.viewTitle}
        tasks={viewStore.tasks}
        showAddButton={viewStore.showAddButton}
      />
    </div>
    
    <!-- Task Detail -->
    <div class="flex-1">
      <TaskDetail />
    </div>
  </div>
</div>
