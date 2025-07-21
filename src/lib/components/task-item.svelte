<script lang="ts">
  import type { TaskWithSubTasks, SubTask } from "$lib/types/task";
  import { taskStore } from "$lib/stores/tasks.svelte";
  import {
    getPriorityColor,
    calculateSubTaskProgress,
  } from "$lib/utils/task-utils";
  import { TaskService } from "$lib/services/task-service";
  import Button from "$lib/components/ui/button.svelte";
  import { contextMenuStore } from "$lib/stores/context-menu.svelte";
  import InlineDatePicker from "$lib/components/inline-date-picker.svelte";
  import { ChevronDown, ChevronRight } from "lucide-svelte";
  import TaskStatusToggle from './task-status-toggle.svelte';
  import TaskContent from './task-content.svelte';
  import SubTaskList from './sub-task-list.svelte';

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

  // Date picker state
  let showDatePicker = $state(false);
  let datePickerPosition = $state({ x: 0, y: 0 });

  function handleTaskClick() {
    TaskService.selectTask(task.id);
  }

  function handleStatusToggle() {
    TaskService.toggleTaskStatus(task.id);
  }

  function handleSubTaskToggle(event: MouseEvent, subTaskId: string) {
    event.stopPropagation();
    TaskService.toggleSubTaskStatus(task, subTaskId);
  }

  function handleSubTaskClick(event: MouseEvent, subTaskId: string) {
    event.stopPropagation();
    TaskService.selectSubTask(subTaskId);
  }

  function toggleSubTasksAccordion(event?: Event) {
    event?.stopPropagation();
    showSubTasks = !showSubTasks;
  }

  function handleEdit() {
    console.log(`Editing task: ${task.title}`);
  }

  function handleDelete() {
    TaskService.deleteTask(task.id);
  }

  function setPriority(priority: 'low' | 'medium' | 'high' | 'urgent') {
    console.log(`Setting priority to ${priority} for task: ${task.title}`);
    // TODO: Implement priority change logic
    taskStore.updateTask(task.id, { ...task, priority });
  }

  function handleTaskContextMenu(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    contextMenuStore.open(event.clientX, event.clientY, [
      {
        label: 'Edit Task',
        action: handleEdit
      },
      {
        label: 'Set Priority',
        action: () => setPriority
      },
      {
        label: '',
        action: () => console.log('Priority submenu would open'),
        separator: true
      },
      {
        label: 'Delete Task',
        action: handleDelete
      }
    ]);
  }

  function handleSubTaskContextMenu(event: MouseEvent, subTask: SubTask) {
    event.preventDefault();
    event.stopPropagation();

    contextMenuStore.open(event.clientX, event.clientY, [
      {
        label: 'Edit Subtask',
        action: () => console.log('Edit subtask:', subTask.title)
      },
      {
        label: '',
        action: () => console.log('Priority submenu would open'),
        separator: true
      },
      {
        label: 'Delete Subtask',
        action: () => console.log('Delete subtask:', subTask.title)
      }
    ]);
  }

  // Date picker handlers
  function handleDueDateClick(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    datePickerPosition = {
      x: Math.min(rect.left, window.innerWidth - 300), // Ensure it fits on screen
      y: rect.bottom + 8
    };
    showDatePicker = true;
  }

  function handleDateChange(data: { date: string; dateTime: string; range?: { start: string; end: string }; isRangeDate: boolean }) {
    const { dateTime, range, isRangeDate } = data;

    if (isRangeDate) {
      if (range) {
        // Range mode with both start and end dates
        taskStore.updateTask(task.id, {
          ...task,
          start_date: new Date(range.start),
          end_date: new Date(range.end),
          is_range_date: true
        });
      } else {
        // Range mode switched on, but no range data yet - keep current end_date as both start and end
        const currentEndDate = task.end_date || new Date(dateTime);
        taskStore.updateTask(task.id, {
          ...task,
          start_date: currentEndDate,
          end_date: currentEndDate,
          is_range_date: true
        });
      }
    } else {
      // Single mode
      taskStore.updateTask(task.id, {
        ...task,
        end_date: new Date(dateTime),
        start_date: undefined,
        is_range_date: false
      });
    }
  }

  function handleDateClear() {
    taskStore.updateTask(task.id, {
      ...task,
      start_date: undefined,
      end_date: undefined,
      is_range_date: false
    });
  }

  function handleDatePickerClose() {
    showDatePicker = false;
  }

  // SubTask date picker
  let showSubTaskDatePicker = $state(false);
  let subTaskDatePickerPosition = $state({ x: 0, y: 0 });
  let editingSubTaskId = $state<string | null>(null);

  function handleSubTaskDueDateClick(event: MouseEvent, subTask: SubTask) {
    event.preventDefault();
    event.stopPropagation();

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    subTaskDatePickerPosition = {
      x: Math.min(rect.left, window.innerWidth - 300),
      y: rect.bottom + 8
    };
    editingSubTaskId = subTask.id;
    showSubTaskDatePicker = true;
  }

  function handleSubTaskDateChange(data: { date: string; dateTime: string; range?: { start: string; end: string }; isRangeDate: boolean }) {
    if (!editingSubTaskId) return;

    const { dateTime, range, isRangeDate } = data;
    const subTaskIndex = task.sub_tasks.findIndex(st => st.id === editingSubTaskId);
    if (subTaskIndex === -1) return;

    if (isRangeDate) {
      if (range) {
        // Range mode with both start and end dates
        taskStore.updateSubTask(editingSubTaskId, {
          start_date: new Date(range.start),
          end_date: new Date(range.end),
          is_range_date: true
        });
      } else {
        // Range mode switched on, but no range data yet - keep current end_date as both start and end
        const subTask = task.sub_tasks[subTaskIndex];
        const currentEndDate = subTask.end_date || new Date(dateTime);
        taskStore.updateSubTask(editingSubTaskId, {
          start_date: currentEndDate,
          end_date: currentEndDate,
          is_range_date: true
        });
      }
    } else {
      // Single mode
      taskStore.updateSubTask(editingSubTaskId, {
        end_date: new Date(dateTime),
        start_date: undefined,
        is_range_date: false
      });
    }
  }

  function handleSubTaskDateClear() {
    if (!editingSubTaskId) return;

    taskStore.updateSubTask(editingSubTaskId, {
      start_date: undefined,
      end_date: undefined,
      is_range_date: false
    });
  }

  function handleSubTaskDatePickerClose() {
    showSubTaskDatePicker = false;
    editingSubTaskId = null;
  }
</script>

<div class="flex items-start gap-1 w-full">
  <!-- Accordion Toggle Button -->
  {#if task.sub_tasks.length > 0}
    <Button
      variant="ghost"
      size="icon"
      class="h-8 w-8 min-h-[32px] min-w-[32px] text-muted-foreground hover:text-foreground mt-1"
      onclick={toggleSubTasksAccordion}
      title="Toggle subtasks"
    >
      {#if showSubTasks}
        <ChevronDown class="h-4 w-4" />
      {:else}
        <ChevronRight class="h-4 w-4" />
      {/if}
    </Button>
  {:else}
    <div class="h-8 w-8 min-h-[32px] min-w-[32px] mt-1"></div>
  {/if}

  <!-- Main Task Button -->
  <div
    class="flex-1"
    role="button"
    tabindex="0"
    oncontextmenu={handleTaskContextMenu}
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
          {datePickerPosition}
          {showDatePicker}
          {handleDueDateClick}
        />
      </div>
    </Button>
  </div>
</div>

<!-- Sub-tasks Accordion -->
{#if task.sub_tasks.length > 0 && showSubTasks}
  <SubTaskList
    {task}
    {subTaskDatePickerPosition}
    {showSubTaskDatePicker}
    {handleSubTaskClick}
    {handleSubTaskToggle}
    {handleSubTaskContextMenu}
    {handleSubTaskDueDateClick}
  />
{/if}

<!-- Inline Date Picker -->
<InlineDatePicker
  show={showDatePicker}
  currentDate={task.end_date ? task.end_date.toISOString() : ''}
  currentStartDate={task.start_date ? task.start_date.toISOString() : ''}
  position={datePickerPosition}
  isRangeDate={task.is_range_date || false}
  onchange={handleDateChange}
  onclear={handleDateClear}
  onclose={handleDatePickerClose}
/>

<!-- SubTask Date Picker -->
<InlineDatePicker
  show={showSubTaskDatePicker}
  currentDate={editingSubTaskId ? (task.sub_tasks.find(st => st.id === editingSubTaskId)?.end_date?.toISOString() || '') : ''}
  currentStartDate={editingSubTaskId ? (task.sub_tasks.find(st => st.id === editingSubTaskId)?.start_date?.toISOString() || '') : ''}
  position={subTaskDatePickerPosition}
  isRangeDate={editingSubTaskId ? task.sub_tasks.find(st => st.id === editingSubTaskId)?.is_range_date || false : false}
  onchange={handleSubTaskDateChange}
  onclear={handleSubTaskDateClear}
  onclose={handleSubTaskDatePickerClose}
/>
