<script lang="ts">
  import { taskOperations } from '$lib/services/domain/task';
  import { useTranslation } from '$lib/hooks/use-translation.svelte';
  import type { ViewType } from '$lib/stores/view-store.svelte';
  import { useViewsVisibilityStore } from '$lib/hooks/use-views-visibility-store.svelte';
  import { taskStore } from '$lib/stores/tasks.svelte';
  import SidebarButton from '$lib/components/sidebar/sidebar-button.svelte';
  import { subTaskOperations } from '$lib/services/domain/subtask';

  const subTaskMutations = subTaskOperations;
  import { SvelteDate } from 'svelte/reactivity';
  import type { DragData } from '$lib/utils/drag-drop';
  import { useSidebar } from '$lib/components/ui/sidebar/context.svelte.js';

  interface Props {
    currentView?: ViewType;
    onViewChange?: (view: ViewType) => void;
  }

  let { currentView = 'all', onViewChange }: Props = $props();

  const translationService = useTranslation();
  const viewsVisibilityStore = useViewsVisibilityStore();
  let visibleViews = $derived(viewsVisibilityStore.visibleViews);
  let todayTasksCount = $derived(taskStore.todayTasks.length);
  let overdueTasksCount = $derived(taskStore.overdueTasks.length);

  // Reactive messages
  const viewsTitle = translationService.getMessage('views_title');

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
        return taskStore.allTasks.filter((t) => t.status === 'completed').length;
      case 'tomorrow':
        return taskStore.allTasks.filter((t) => {
          if (t.status === 'completed' || !t.planEndDate) return false;
          const tomorrow = new SvelteDate();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const tomorrowStart = new SvelteDate(
            tomorrow.getFullYear(),
            tomorrow.getMonth(),
            tomorrow.getDate()
          );
          const tomorrowEnd = new SvelteDate(
            tomorrow.getFullYear(),
            tomorrow.getMonth(),
            tomorrow.getDate() + 1
          );
          const dueDate = new Date(t.planEndDate);
          return dueDate >= tomorrowStart && dueDate < tomorrowEnd;
        }).length;
      case 'next3days':
        return taskStore.allTasks.filter((t) => {
          if (t.status === 'completed' || !t.planEndDate) return false;
          const today = new SvelteDate();
          const threeDaysLater = new SvelteDate();
          threeDaysLater.setDate(today.getDate() + 3);
          const dueDate = new Date(t.planEndDate);
          return dueDate > today && dueDate <= threeDaysLater;
        }).length;
      case 'nextweek':
        return taskStore.allTasks.filter((t) => {
          if (t.status === 'completed' || !t.planEndDate) return false;
          const today = new SvelteDate();
          const oneWeekLater = new SvelteDate();
          oneWeekLater.setDate(today.getDate() + 7);
          const dueDate = new Date(t.planEndDate);
          return dueDate > today && dueDate <= oneWeekLater;
        }).length;
      case 'thismonth':
        return taskStore.allTasks.filter((t) => {
          if (t.status === 'completed' || !t.planEndDate) return false;
          const today = new SvelteDate();
          const endOfMonth = new SvelteDate(today.getFullYear(), today.getMonth() + 1, 0);
          const dueDate = new Date(t.planEndDate);
          return dueDate >= today && dueDate <= endOfMonth;
        }).length;
      default:
        return 0;
    }
  }

  function handleViewChange(view: ViewType) {
    onViewChange?.(view);
  }

  function handleViewDrop(viewId: string, dragData: DragData) {
    if (dragData.type === 'task') {
      // タスクをビューにドロップした場合、期日を更新
      void taskOperations.updateTaskDueDateForView(dragData.id, viewId);
    } else if (dragData.type === 'subtask' && dragData.taskId) {
      // サブタスクをビューにドロップした場合、サブタスクの期日を更新
      subTaskMutations.updateSubTaskDueDateForView(dragData.id, dragData.taskId, viewId);
    }
  }
</script>

<div class="mb-4">
  {#if sidebar.state !== 'collapsed'}
    <h3 class="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
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
      onDrop={(dragData: unknown) => handleViewDrop(view.id, dragData as DragData)}
      testId="view-{view.id}"
    />
  {/each}
</div>
