<script lang="ts">
  import { useTranslation } from '$lib/hooks/use-translation.svelte';
  import type { TaskWithSubTasks } from '$lib/types/task';
  import { taskStore } from '$lib/stores/tasks.svelte';
  import { calculateSubTaskProgress } from '$lib/utils/task-utils';
  import { useTaskDetailUiStore } from '$lib/services/ui/task-detail-ui-store.svelte';
  import { createEventDispatcher } from 'svelte';
  import TaskDatePicker from '$lib/components/task/forms/task-date-picker.svelte';
  import TaskItemContent from '$lib/components/task/core/task-item-content.svelte';
  import { TaskItemHandlers } from '$lib/components/task/core/task-item-handlers.svelte';
  import { TaskItemDragDrop } from '$lib/components/task/core/task-item-drag-drop.svelte';
  import { TaskItemContextMenu } from '$lib/components/task/core/task-item-context-menu.svelte';

  interface Props {
    task: TaskWithSubTasks;
    onTaskClick?: (taskId: string) => void;
    onSubTaskClick?: (subTaskId: string) => void;
  }

  let { task, onTaskClick, onSubTaskClick }: Props = $props();

  const taskDetailUiStore = useTaskDetailUiStore();

  const dispatch = createEventDispatcher<{
    taskSelectionRequested: { taskId: string };
    subTaskSelectionRequested: { subTaskId: string };
  }>();

  // Get handlers from child components
  let taskDatePicker: TaskDatePicker | undefined = $state();

  // State
  let showSubTasks = $state(false);

  // Translation service
  const translationService = useTranslation();

  // Derived states
  const isSelected = $derived(taskStore.selectedTaskId === task.id);
  const hasSelectedSubTask = $derived(
    task.subTasks.some((st) => st.id === taskStore.selectedSubTaskId)
  );
  const isActiveTask = $derived(isSelected || hasSelectedSubTask);
  const completedSubTasks = $derived(
    task.subTasks.filter((st) => st.status === 'completed').length
  );
  const subTaskProgress = $derived(
    calculateSubTaskProgress(completedSubTasks, task.subTasks.length)
  );

  // Create handler classes
  const handlers = $derived.by(() => new TaskItemHandlers(
    task,
    taskDetailUiStore,
    dispatch,
    { onTaskClick, onSubTaskClick }
  ));

  const dragDrop = $derived.by(() => new TaskItemDragDrop(task));

  const contextMenu = $derived.by(() => new TaskItemContextMenu(
    translationService,
    {
      handleEditTask: handlers.handleEditTask,
      handleDeleteTask: handlers.handleDeleteTask,
      handleEditSubTask: handlers.handleEditSubTask,
      handleDeleteSubTask: handlers.handleDeleteSubTask
    }
  ));

  // Context menu items
  const taskContextMenuItems = $derived(contextMenu.createTaskContextMenu());

  function createSubTaskContextMenu(subTask: Parameters<typeof contextMenu.createSubTaskContextMenu>[0]) {
    return contextMenu.createSubTaskContextMenu(subTask);
  }

  function toggleSubTasksAccordion(event?: Event) {
    event?.stopPropagation();
    showSubTasks = !showSubTasks;
  }

  // Create logic object for TaskItemContent
  const logic = $derived.by(() => ({
    task,
    showSubTasks,
    isSelected,
    hasSelectedSubTask,
    isActiveTask,
    completedSubTasks,
    subTaskProgress,
    taskContextMenuItems,
    createSubTaskContextMenu,
    handleTaskClick: handlers.handleTaskClick,
    handleStatusToggle: handlers.handleStatusToggle,
    handleSubTaskToggle: handlers.handleSubTaskToggle,
    handleSubTaskClick: handlers.handleSubTaskClick,
    toggleSubTasksAccordion,
    handleDragStart: dragDrop.handleDragStart,
    handleDragOver: dragDrop.handleDragOver,
    handleDrop: dragDrop.handleDrop,
    handleDragEnd: dragDrop.handleDragEnd,
    handleDragEnter: dragDrop.handleDragEnter,
    handleDragLeave: dragDrop.handleDragLeave
  }));
</script>

<TaskItemContent {logic} {task} {taskDatePicker} />

<TaskDatePicker bind:this={taskDatePicker} {task} />
