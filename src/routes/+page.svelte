<script lang="ts">
  import Sidebar from '$lib/components/Sidebar.svelte';
  import TaskList from '$lib/components/TaskList.svelte';
  import TaskDetail from '$lib/components/TaskDetail.svelte';
  import ResizableLayout from '$lib/components/ResizableLayout.svelte';
  import { viewStore } from '$lib/stores/view-store.svelte';
  import type { ViewType } from '$lib/services/view-service';
  
  function handleViewChange(view: ViewType) {
    viewStore.changeView(view);
  }
</script>

{#snippet taskListSnippet()}
  <TaskList 
    title={viewStore.viewTitle}
    tasks={viewStore.tasks}
    showAddButton={viewStore.showAddButton}
  />
{/snippet}

{#snippet taskDetailSnippet()}
  <TaskDetail />
{/snippet}

<div class="h-screen flex">
  <!-- Sidebar -->
  <Sidebar currentView={viewStore.currentView} onViewChange={handleViewChange} />
  
  <!-- Main Content with Resizable Layout -->
  <ResizableLayout leftPane={taskListSnippet} rightPane={taskDetailSnippet} />
</div>
