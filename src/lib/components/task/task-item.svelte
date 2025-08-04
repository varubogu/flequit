<script lang="ts">
  import { getTranslationService } from '$lib/stores/locale.svelte';
  import type { TaskWithSubTasks } from '$lib/types/task';
  import { taskStore } from '$lib/stores/tasks.svelte';
  import { getPriorityColor, calculateSubTaskProgress } from '$lib/utils/task-utils';
  import { TaskService } from '$lib/services/task-service';
  import Button from '$lib/components/shared/button.svelte';
  import TaskStatusToggle from '$lib/components/task/task-status-toggle.svelte';
  import TaskContent from '$lib/components/task/task-content.svelte';
  import SubTaskList from '$lib/components/task/sub-task-list.svelte';
  import TaskAccordionToggle from './task-accordion-toggle.svelte';
  import TaskDatePicker from './task-date-picker.svelte';
  import ContextMenuWrapper from '$lib/components/shared/context-menu-wrapper.svelte';
  import { DragDropManager, type DragData, type DropTarget } from '$lib/utils/drag-drop';
  import { createEventDispatcher } from 'svelte';
  import { Edit, Trash2 } from 'lucide-svelte';
  import type { ContextMenuList } from '$lib/types/context-menu';
  import { createContextMenu, createSeparator } from '$lib/types/context-menu';
  import type { SubTask } from '$lib/types/task';

  interface Props {
    task: TaskWithSubTasks;
    onTaskClick?: (taskId: string) => void;
    onSubTaskClick?: (subTaskId: string) => void;
  }

  let { task, onTaskClick, onSubTaskClick }: Props = $props();

  const translationService = getTranslationService();
  const dispatch = createEventDispatcher<{
    taskSelectionRequested: { taskId: string };
    subTaskSelectionRequested: { subTaskId: string };
  }>();

  let isSelected = $derived(taskStore.selectedTaskId === task.id);
  let hasSelectedSubTask = $derived(
    task.sub_tasks.some((st) => st.id === taskStore.selectedSubTaskId)
  );
  let isActiveTask = $derived(isSelected || hasSelectedSubTask);
  let completedSubTasks = $derived(task.sub_tasks.filter((st) => st.status === 'completed').length);
  let subTaskProgress = $derived(
    calculateSubTaskProgress(completedSubTasks, task.sub_tasks.length)
  );
  let showSubTasks = $state(false);

  // Get handlers from child components
  let taskDatePicker: TaskDatePicker | undefined = $state();

  // Reactive messages
  const editTask = translationService.getMessage('edit_task');
  const deleteTask = translationService.getMessage('delete_task');
  const editSubtask = translationService.getMessage('edit_subtask');
  const deleteSubtask = translationService.getMessage('delete_subtask');

  function handleEditTask() {
    // TODO: タスク編集の実装
  }

  function handleDeleteTask() {
    TaskService.deleteTask(task.id);
  }

  function handleEditSubTask(subTask: SubTask) {
    // TODO: サブタスク編集の実装
    console.log('Edit subtask:', subTask.title);
  }

  function handleDeleteSubTask(subTask: SubTask) {
    // TODO: サブタスク削除の実装
    console.log('Delete subtask:', subTask.title);
  }

  // タスク用のコンテキストメニューリストを作成
  const taskContextMenuItems: ContextMenuList = $derived(
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

  // サブタスク用のコンテキストメニューリストを作成
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
    const success = TaskService.selectTask(task.id);
    if (!success) {
      dispatch('taskSelectionRequested', { taskId: task.id });
    }
  }

  function handleStatusToggle() {
    TaskService.toggleTaskStatus(task.id);
  }

  function handleSubTaskToggle(event: Event | undefined, subTaskId: string) {
    event?.stopPropagation();
    TaskService.toggleSubTaskStatus(task, subTaskId);
  }

  function handleSubTaskClick(event: Event | undefined, subTaskId: string) {
    event?.stopPropagation();

    if (onSubTaskClick) {
      onSubTaskClick(subTaskId);
    } else {
      // フォールバック: 統一的なアプローチを使わない場合
      const success = TaskService.selectSubTask(subTaskId);
      if (!success) {
        dispatch('subTaskSelectionRequested', { subTaskId });
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
      TaskService.addTagToTask(task.id, dragData.id);
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
</script>

<div class="flex w-full items-start gap-1 min-w-0 overflow-hidden">
  <div class="flex-shrink-0">
    <TaskAccordionToggle
      hasSubTasks={task.sub_tasks.length > 0}
      isExpanded={showSubTasks}
      onToggle={toggleSubTasksAccordion}
    />
  </div>

  <!-- Main Task Button -->
  <div
    role="button"
    tabindex="0"
    class="flex-1 min-w-0 overflow-hidden"
    draggable="true"
    ondragstart={handleDragStart}
    ondragover={handleDragOver}
    ondrop={handleDrop}
    ondragend={handleDragEnd}
    ondragenter={(e) => handleDragEnter(e, e.currentTarget as HTMLElement)}
    ondragleave={(e) => handleDragLeave(e, e.currentTarget as HTMLElement)}
  >
    <ContextMenuWrapper items={taskContextMenuItems}>
      <Button
        variant="ghost"
        class="task-item-button bg-card text-card-foreground rounded-lg border border-l-4 shadow-sm {getPriorityColor(
          task.priority
        )} h-auto flex-1 justify-start p-4 text-left transition-all {isActiveTask
          ? 'selected'
          : ''} w-full min-w-0"
        onclick={handleTaskClick}
        data-testid="task-{task.id}"
      >
        <div class="flex w-full min-w-0 items-start gap-3 overflow-hidden">
          <div class="flex-shrink-0">
            <TaskStatusToggle status={task.status} ontoggle={handleStatusToggle} />
          </div>
          <TaskContent
            {task}
            {completedSubTasks}
            {subTaskProgress}
            handleDueDateClick={(e) => taskDatePicker && taskDatePicker.handleDueDateClick(e)}
          />
        </div>
      </Button>
    </ContextMenuWrapper>
  </div>
</div>

<!-- Sub-tasks Accordion -->
{#if task.sub_tasks.length > 0 && showSubTasks}
  <SubTaskList
    {task}
    subTaskDatePickerPosition={{ x: 0, y: 0 }}
    showSubTaskDatePicker={false}
    {handleSubTaskClick}
    {handleSubTaskToggle}
    handleSubTaskDueDateClick={(e, st) =>
      taskDatePicker && taskDatePicker.handleSubTaskDueDateClick(e, st)}
    {createSubTaskContextMenu}
  />
{/if}

<TaskDatePicker bind:this={taskDatePicker} {task} />
