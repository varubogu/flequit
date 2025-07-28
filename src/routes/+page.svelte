<script lang="ts">
  import CollapsibleSidebar from '$lib/components/sidebar/collapsible-sidebar.svelte';
  import TaskList from '$lib/components/task/task-list.svelte';
  import TaskDetail from '$lib/components/task/task-detail.svelte';
  import TaskDetailDrawer from '$lib/components/task/task-detail-drawer.svelte';
  import * as Resizable from '$lib/components/ui/resizable/index.js';
  import * as Sidebar from '$lib/components/ui/sidebar';
  import { IsMobile } from '$lib/hooks/is-mobile.svelte';
  import { viewStore } from '$lib/stores/view-store.svelte';
  import { taskStore } from '$lib/stores/tasks.svelte';
  import { TaskService } from '$lib/services/task-service';
  import type { ViewType } from '$lib/services/view-service';

  // Use IsMobile directly instead of useSidebar
  const isMobile = new IsMobile();
  
  // State for mobile task detail drawer
  let showTaskDetailDrawer = $state(false);

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

  function handleTaskClick(taskId: string) {
    // モバイル時はタスクを選択してからDrawerを開く
    if (isMobile.current) {
      // タスクを選択
      TaskService.selectTask(taskId);
      // Drawerを表示
      showTaskDetailDrawer = true;
    }
  }

  function handleCloseTaskDetailDrawer() {
    showTaskDetailDrawer = false;
  }
</script>

<Sidebar.Provider class="h-screen flex bg-background" style="--sidebar-width-icon: 4rem;">
  <!-- Collapsible Sidebar -->
  <CollapsibleSidebar currentView={viewStore.currentView} onViewChange={handleViewChange} />

  <!-- Main Content with Responsive Layout -->
  {#if isMobile.current}
    <!-- モバイル: タスクリストのみ表示 -->
    <div class="flex-1">
      <TaskList
        title={viewStore.viewTitle}
        tasks={viewStore.tasks}
        showAddButton={viewStore.showAddButton}
        onTaskClick={handleTaskClick}
        on:taskSelectionRequested={handleTaskSelectionRequested}
        on:subTaskSelectionRequested={handleSubTaskSelectionRequested}
      />
    </div>
    
    <!-- モバイル: Drawerでタスク詳細表示 -->
    <TaskDetailDrawer 
      open={showTaskDetailDrawer} 
      onClose={handleCloseTaskDetailDrawer}
    />
  {:else}
    <!-- デスクトップ: リサイズ可能なパネル構成 -->
    <Resizable.PaneGroup direction="horizontal">
      <Resizable.Pane defaultSize={50} minSize={20}>
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
  {/if}
</Sidebar.Provider>
