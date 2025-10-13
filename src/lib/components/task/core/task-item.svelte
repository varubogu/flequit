<script lang="ts">
  import { getTranslationService } from '$lib/stores/locale.svelte';
  import type { TaskWithSubTasks } from '$lib/types/task';
  import type { SubTask } from '$lib/types/sub-task';
  import { taskStore } from '$lib/stores/tasks.svelte';
  import { calculateSubTaskProgress } from '$lib/utils/task-utils';
  import { TaskMutations } from '$lib/services/domain/task';
  import { SubTaskMutations } from '$lib/services/domain/subtask';
  import { selectionStore } from '$lib/stores/selection-store.svelte';

  const taskMutations = new TaskMutations();
  const subTaskMutations = new SubTaskMutations();
  import { useTaskDetailUiStore } from '$lib/services/ui/task-detail-ui-store.svelte';
  import { DragDropManager, type DragData, type DropTarget } from '$lib/utils/drag-drop';
  import { createEventDispatcher } from 'svelte';
  import { Edit, Trash2 } from 'lucide-svelte';
  import type { ContextMenuList } from '$lib/types/context-menu';
  import { createContextMenu, createSeparator } from '$lib/types/context-menu';
  import TaskDatePicker from '../forms/task-date-picker.svelte';
  import TaskItemContent from './task-item-content.svelte';

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
  const translationService = getTranslationService();

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

  // Translation messages
  const editTask = translationService.getMessage('edit_task');
  const deleteTask = translationService.getMessage('delete_task');
  const editSubtask = translationService.getMessage('edit_subtask');
  const deleteSubtask = translationService.getMessage('delete_subtask');

  // Task handlers
  function handleEditTask() {
    // タスク詳細画面を開いて編集モードにする
    taskDetailUiStore?.openTaskDetail(task.id);
  }

  function handleDeleteTask() {
    void taskMutations.deleteTask(task.id);
  }

  function handleEditSubTask(subTask: SubTask) {
    // サブタスク詳細画面を開いて編集モードにする
    taskDetailUiStore?.openSubTaskDetail(subTask.id);
  }

  function handleDeleteSubTask(subTask: SubTask) {
    // サブタスクを削除
    void subTaskMutations.deleteSubTask(subTask.id);
  }

  // Context menus
  const taskContextMenuItems = $derived(
    createContextMenu([
      {
        id: 'edit-task',
        label: editTask,
        action: handleEditTask,
        icon: Edit
      },
      createSeparator(),
      {
        id: 'delete-task',
        label: deleteTask,
        action: handleDeleteTask,
        icon: Trash2,
        destructive: true
      }
    ])
  );

  function createSubTaskContextMenu(subTask: SubTask): ContextMenuList {
    return createContextMenu([
      {
        id: 'edit-subtask',
        label: editSubtask,
        action: () => handleEditSubTask(subTask),
        icon: Edit
      },
      createSeparator(),
      {
        id: 'delete-subtask',
        label: deleteSubtask,
        action: () => handleDeleteSubTask(subTask),
        icon: Trash2,
        destructive: true
      }
    ]);
  }

  function handleTaskClick() {
    // モバイル時のカスタムハンドラーがある場合は優先
    if (onTaskClick) {
      onTaskClick(task.id);
      return;
    }

    // Try to select task, but if blocked due to new task mode, dispatch event for confirmation
    if (taskStore.isNewTaskMode) {
      dispatch('taskSelectionRequested', { taskId: task.id });
    } else {
      selectionStore.selectTask(task.id);
    }
  }

  function handleStatusToggle() {
    void taskMutations.toggleTaskStatus(task.id);
  }

  function handleSubTaskToggle(event: Event | undefined, subTaskId: string) {
    event?.stopPropagation();
    subTaskMutations.toggleSubTaskStatus(task, subTaskId);
  }

  function handleSubTaskClick(event: Event | undefined, subTaskId: string) {
    event?.stopPropagation();

    if (onSubTaskClick) {
      onSubTaskClick(subTaskId);
    } else {
      // フォールバック: 統一的なアプローチを使わない場合
      if (taskStore.isNewTaskMode) {
        dispatch('subTaskSelectionRequested', { subTaskId });
      } else {
        selectionStore.selectSubTask(subTaskId);
      }
    }
  }

  function toggleSubTasksAccordion(event?: Event) {
    event?.stopPropagation();
    showSubTasks = !showSubTasks;
  }

  // Drag & Drop handlers
  function handleDragStart(event: DragEvent) {
    const dragData: DragData = {
      type: 'task',
      id: task.id
    };
    DragDropManager.startDrag(event, dragData);
  }

  function handleDragOver(event: DragEvent) {
    const target: DropTarget = {
      type: 'task',
      id: task.id
    };
    DragDropManager.handleDragOver(event, target);
  }

  function handleDrop(event: DragEvent) {
    const target: DropTarget = {
      type: 'task',
      id: task.id
    };

    const dragData = DragDropManager.handleDrop(event, target);
    if (!dragData) return;

    if (dragData.type === 'tag') {
      // タグをタスクにドロップした場合、タグを付与
      void taskMutations.addTagToTask(task.id, dragData.id);
    }
  }

  function handleDragEnd(event: DragEvent) {
    DragDropManager.handleDragEnd(event);
  }

  function handleDragEnter(event: DragEvent, element: HTMLElement) {
    DragDropManager.handleDragEnter(event, element);
  }

  function handleDragLeave(event: DragEvent, element: HTMLElement) {
    DragDropManager.handleDragLeave(event, element);
  }

  // Create logic object for TaskItemContent (using $derived.by for reactive references)
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
    handleTaskClick,
    handleStatusToggle,
    handleSubTaskToggle,
    handleSubTaskClick,
    toggleSubTasksAccordion,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    handleDragEnter,
    handleDragLeave
  }));
</script>

<TaskItemContent {logic} {task} {taskDatePicker} />

<TaskDatePicker bind:this={taskDatePicker} {task} />
