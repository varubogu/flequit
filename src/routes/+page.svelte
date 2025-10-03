<script lang="ts">
  import CollapsibleSidebar from '$lib/components/sidebar/collapsible-sidebar.svelte';
  import TaskList from '$lib/components/task/core/task-list.svelte';
  import TaskDetail from '$lib/components/task/detail/task-detail.svelte';
  import TaskDetailDrawer from '$lib/components/task/detail/task-detail-drawer.svelte';
  import * as Resizable from '$lib/components/ui/resizable/index.js';
  import * as Sidebar from '$lib/components/ui/sidebar';
  import { IsMobile } from '$lib/hooks/is-mobile.svelte';
  import { viewStore } from '$lib/stores/view-store.svelte';
  import { TaskDetailService } from '$lib/services/ui/task-detail';
  import type { ViewType } from '$lib/services/ui/view';

  // Use IsMobile directly instead of useSidebar
  const isMobile = new IsMobile();

  // Set the mobile instance in TaskDetailService
  TaskDetailService.setMobileInstance(isMobile);

  // Reactive state for TaskDetailService
  let drawerOpen = $state(false);

  // Subscribe to TaskDetailService state changes
  TaskDetailService.subscribe(() => {
    drawerOpen = TaskDetailService.drawerState.open;
  });

  function handleViewChange(view: ViewType) {
    viewStore.changeView(view);
  }

  function handleTaskSelectionRequested() {
    // This will be handled by TaskDetail component's confirmation dialog
    // The event is triggered when a task selection is requested but blocked due to new task mode
  }

  function handleSubTaskSelectionRequested() {
    // This will be handled by TaskDetail component's confirmation dialog
    // The event is triggered when a subtask selection is requested but blocked due to new task mode
  }

  function handleTaskClick(taskId: string) {
    TaskDetailService.openTaskDetail(taskId);
  }

  function handleSubTaskClick(subTaskId: string) {
    TaskDetailService.openSubTaskDetail(subTaskId);
  }

  function handleCloseTaskDetailDrawer() {
    TaskDetailService.closeTaskDetail();
  }
</script>

<Sidebar.Provider class="bg-background flex h-screen" style="--sidebar-width-icon: 4rem;">
  <!-- Collapsible Sidebar -->
  <CollapsibleSidebar currentView={viewStore.currentView} onViewChange={handleViewChange} />

  <!-- Main Content with Responsive Layout -->
  {#if isMobile.current}
    <!-- モバイル: タスクリストのみ表示 -->
    <div class="min-w-0 flex-1 overflow-hidden">
      <TaskList
        title={viewStore.viewTitle}
        tasks={viewStore.tasks}
        showAddButton={viewStore.showAddButton}
        onTaskClick={handleTaskClick}
        onSubTaskClick={handleSubTaskClick}
        on:taskSelectionRequested={handleTaskSelectionRequested}
        on:subTaskSelectionRequested={handleSubTaskSelectionRequested}
      />
    </div>

    <!-- モバイル: Drawerでタスク詳細表示 -->
    <TaskDetailDrawer open={drawerOpen} onClose={handleCloseTaskDetailDrawer} />
  {:else}
    <!-- デスクトップ: リサイズ可能なパネル構成 -->
    <Resizable.PaneGroup direction="horizontal">
      <Resizable.Pane defaultSize={50} minSize={20}>
        <TaskList
          title={viewStore.viewTitle}
          tasks={viewStore.tasks}
          showAddButton={viewStore.showAddButton}
          onTaskClick={handleTaskClick}
          onSubTaskClick={handleSubTaskClick}
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
