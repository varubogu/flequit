<script lang="ts">
  import type { TaskWithSubTasks } from "$lib/types/task";
  import { taskStore } from "$lib/stores/tasks.svelte";
  import {
    getPriorityColor,
    calculateSubTaskProgress,
  } from "$lib/utils/task-utils";
  import { TaskService } from "$lib/services/task-service";
  import Button from "$lib/components/ui/button.svelte";
  import TaskStatusToggle from './task-status-toggle.svelte';
  import TaskContent from './task-content.svelte';
  import SubTaskList from './sub-task-list.svelte';
  import TaskAccordionToggle from './task-accordion-toggle.svelte';
  import TaskDatePicker from './task-date-picker.svelte';
  import TaskContextMenu from './task-context-menu.svelte';

  interface Props {
    task: TaskWithSubTasks;
  }

  let { task }: Props = $props();

  let isSelected = $derived(taskStore.selectedTaskId === task.id);
  let hasSelectedSubTask = $derived(
    task.sub_tasks.some((st) => st.id === taskStore.selectedSubTaskId),
  );
  let isActiveTask = $derived(isSelected || hasSelectedSubTask);
  let completedSubTasks = $derived(
    task.sub_tasks.filter((st) => st.status === "completed").length,
  );
  let subTaskProgress = $derived(
    calculateSubTaskProgress(completedSubTasks, task.sub_tasks.length),
  );
  let showSubTasks = $state(false);

  // Get handlers from child components
  let taskDatePicker: TaskDatePicker;
  let taskContextMenu: TaskContextMenu;

  function handleTaskClick() {
    TaskService.selectTask(task.id);
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
    TaskService.selectSubTask(subTaskId);
  }

  function toggleSubTasksAccordion(event?: Event) {
    event?.stopPropagation();
    showSubTasks = !showSubTasks;
  }



</script>

<div class="flex items-start gap-1 w-full">
  <TaskAccordionToggle 
    hasSubTasks={task.sub_tasks.length > 0}
    isExpanded={showSubTasks}
    onToggle={toggleSubTasksAccordion}
  />

  <!-- Main Task Button -->
  <div
    class="flex-1"
    role="button"
    tabindex="0"
    oncontextmenu={(e) => taskContextMenu && taskContextMenu.handleTaskContextMenu(e)}
  >
    <Button
      variant="ghost"
      class="task-item-button rounded-lg border bg-card text-card-foreground shadow-sm border-l-4 {getPriorityColor(
        task.priority,
      )} p-4 h-auto flex-1 justify-start text-left transition-all {isActiveTask
        ? 'selected'
        : ''} min-w-0 w-full"
      onclick={handleTaskClick}
    >
      <div class="flex items-start gap-3 w-full min-w-0 overflow-hidden">
        <TaskStatusToggle status={task.status} ontoggle={handleStatusToggle} />
        <TaskContent
          {task}
          {completedSubTasks}
          {subTaskProgress}
          datePickerPosition={taskDatePicker ? taskDatePicker.datePickerPosition : { x: 0, y: 0 }}
          showDatePicker={taskDatePicker ? taskDatePicker.showDatePicker : false}
          handleDueDateClick={(e) => taskDatePicker && taskDatePicker.handleDueDateClick(e)}
        />
      </div>
    </Button>
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
    handleSubTaskContextMenu={(e, st) => taskContextMenu && taskContextMenu.handleSubTaskContextMenu(e, st)}
    handleSubTaskDueDateClick={(e, st) => taskDatePicker && taskDatePicker.handleSubTaskDueDateClick(e, st)}
  />
{/if}

<TaskDatePicker bind:this={taskDatePicker} {task} />
<TaskContextMenu bind:this={taskContextMenu} {task} />
