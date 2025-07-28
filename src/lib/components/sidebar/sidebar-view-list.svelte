<script lang="ts">
  import type { ViewType } from '$lib/services/view-service';
  import { viewsVisibilityStore } from '$lib/stores/views-visibility.svelte';
  import { taskStore } from '$lib/stores/tasks.svelte';
  import SidebarButton from '$lib/components/sidebar/sidebar-button.svelte';
  import { DragDropManager, type DropTarget } from '$lib/utils/drag-drop';
  import { TaskService } from '$lib/services/task-service';
  import * as m from '$paraglide/messages.js';
  import { reactiveMessage } from '$lib/stores/locale.svelte';
  import { useSidebar } from '$lib/components/ui/sidebar/context.svelte.js';

  interface Props {
    currentView?: ViewType;
    onViewChange?: (view: ViewType) => void;
  }

  let { currentView = 'all', onViewChange }: Props = $props();

  let visibleViews = $derived(viewsVisibilityStore.visibleViews);
  let todayTasksCount = $derived(taskStore.todayTasks.length);
  let overdueTasksCount = $derived(taskStore.overdueTasks.length);

  // Reactive messages
  const viewsTitle = reactiveMessage(m.views_title);
  
  // Get sidebar state
  const sidebar = useSidebar();

  function getTaskCountForView(viewId: string): number {
    switch (viewId) {
      case 'allTasks':
        return taskStore.allTasks.length;
      case 'today':
        return todayTasksCount;
      case 'overdue':
        return overdueTasksCount;
      case 'completed':
        return taskStore.allTasks.filter(t => t.status === 'completed').length;
      case 'tomorrow':
        return taskStore.allTasks.filter(t => {
          if (t.status === 'completed' || !t.end_date) return false;
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const tomorrowStart = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
          const tomorrowEnd = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate() + 1);
          const dueDate = new Date(t.end_date);
          return dueDate >= tomorrowStart && dueDate < tomorrowEnd;
        }).length;
      case 'next3days':
        return taskStore.allTasks.filter(t => {
          if (t.status === 'completed' || !t.end_date) return false;
          const today = new Date();
          const threeDaysLater = new Date();
          threeDaysLater.setDate(today.getDate() + 3);
          const dueDate = new Date(t.end_date);
          return dueDate > today && dueDate <= threeDaysLater;
        }).length;
      case 'nextweek':
        return taskStore.allTasks.filter(t => {
          if (t.status === 'completed' || !t.end_date) return false;
          const today = new Date();
          const oneWeekLater = new Date();
          oneWeekLater.setDate(today.getDate() + 7);
          const dueDate = new Date(t.end_date);
          return dueDate > today && dueDate <= oneWeekLater;
        }).length;
      case 'thismonth':
        return taskStore.allTasks.filter(t => {
          if (t.status === 'completed' || !t.end_date) return false;
          const today = new Date();
          const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          const dueDate = new Date(t.end_date);
          return dueDate >= today && dueDate <= endOfMonth;
        }).length;
      default:
        return 0;
    }
  }

  function handleViewChange(view: ViewType) {
    onViewChange?.(view);
  }

  function handleViewDrop(viewId: string, dragData: any) {
    if (dragData.type === 'task') {
      // タスクをビューにドロップした場合、期日を更新
      TaskService.updateTaskDueDateForView(dragData.id, viewId);
    } else if (dragData.type === 'subtask' && dragData.taskId) {
      // サブタスクをビューにドロップした場合、サブタスクの期日を更新
      TaskService.updateSubTaskDueDateForView(dragData.id, dragData.taskId, viewId);
    }
  }
</script>

<div class="mb-4">
  {#if sidebar.state !== 'collapsed'}
    <h3 class="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
      {viewsTitle()}
    </h3>
  {/if}

  {#each visibleViews as view (view.id)}
    <SidebarButton
      icon={view.icon}
      label={view.label}
      count={getTaskCountForView(view.id)}
      isActive={currentView === view.id}
      isCollapsed={sidebar.state === 'collapsed'}
      onclick={() => handleViewChange(view.id as ViewType)}
      dropTarget={{ type: 'view', id: view.id }}
      onDrop={(dragData) => handleViewDrop(view.id, dragData)}
      testId="view-{view.id}"
    />
  {/each}
</div>
