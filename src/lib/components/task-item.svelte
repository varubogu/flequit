<script lang="ts">
  import type { TaskWithSubTasks } from "$lib/types/task";
  import { taskStore } from "$lib/stores/tasks.svelte";
  import { formatDate, getDueDateClass } from "$lib/utils/date-utils";
  import {
    getStatusIcon,
    getPriorityColor,
    calculateSubTaskProgress,
  } from "$lib/utils/task-utils";
  import { TaskService } from "$lib/services/task-service";
  import Badge from "$lib/components/ui/badge.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import { contextMenuStore } from "$lib/stores/context-menu.svelte";
  import InlineDatePicker from "$lib/components/inline-date-picker.svelte";
  import { ChevronDown, ChevronRight, Pencil, Trash2, Flag } from "lucide-svelte";

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

  function handleStatusToggle(event: Event) {
    event.stopPropagation();
    TaskService.toggleTaskStatus(task.id);
  }

  function handleSubTaskToggle(event: Event, subTaskId: string) {
    event.stopPropagation();
    TaskService.toggleSubTaskStatus(task, subTaskId);
  }

  function handleSubTaskClick(event: Event, subTaskId: string) {
    event.stopPropagation();
    TaskService.selectSubTask(subTaskId);
  }

  function toggleSubTasksAccordion(event: Event) {
    event.stopPropagation();
    showSubTasks = !showSubTasks;
  }

  // --- Context Menu Actions ---
  function handleEdit() {
    console.log(`Editing task: ${task.title}`);
    // TODO: Implement edit logic
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
        action: handleEdit,
        icon: Pencil
      },
      {
        label: 'Set Priority',
        action: () => console.log('Priority submenu would open'),
        icon: Flag
      },
      { separator: true },
      {
        label: 'Delete Task',
        action: handleDelete,
        icon: Trash2
      }
    ]);
  }

  function handleSubTaskContextMenu(event: MouseEvent, subTask: any) {
    event.preventDefault();
    event.stopPropagation();
    
    contextMenuStore.open(event.clientX, event.clientY, [
      {
        label: 'Edit Subtask',
        action: () => console.log('Edit subtask:', subTask.title),
        icon: Pencil
      },
      { separator: true },
      {
        label: 'Delete Subtask',
        action: () => console.log('Delete subtask:', subTask.title),
        icon: Trash2
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

  function handleDateChange(event: CustomEvent<{ date: string; dateTime: string; range?: { start: string; end: string }; isRangeDate: boolean }>) {
    const { date, range, isRangeDate } = event.detail;
    
    if (isRangeDate && range) {
      taskStore.updateTask(task.id, { 
        ...task, 
        start_date: new Date(range.start),
        end_date: new Date(range.end),
        due_date: new Date(range.end),
        is_range_date: true
      });
    } else {
      taskStore.updateTask(task.id, { 
        ...task, 
        due_date: new Date(date),
        start_date: undefined,
        end_date: undefined,
        is_range_date: false
      });
    }
  }

  function handleDateClear() {
    taskStore.updateTask(task.id, { 
      ...task, 
      due_date: null,
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

  function handleSubTaskDueDateClick(event: MouseEvent, subTask: any) {
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

  function handleSubTaskDateChange(event: CustomEvent<{ date: string; dateTime: string; range?: { start: string; end: string }; isRangeDate: boolean }>) {
    if (!editingSubTaskId) return;
    
    const { date, range, isRangeDate } = event.detail;
    const subTaskIndex = task.sub_tasks.findIndex(st => st.id === editingSubTaskId);
    if (subTaskIndex === -1) return;

    const updatedSubTasks = [...task.sub_tasks];
    if (isRangeDate && range) {
      updatedSubTasks[subTaskIndex] = {
        ...updatedSubTasks[subTaskIndex],
        start_date: new Date(range.start),
        end_date: new Date(range.end),
        due_date: new Date(range.end),
        is_range_date: true
      };
    } else {
      updatedSubTasks[subTaskIndex] = {
        ...updatedSubTasks[subTaskIndex],
        due_date: new Date(date),
        start_date: undefined,
        end_date: undefined,
        is_range_date: false
      };
    }
    
    taskStore.updateTask(task.id, { ...task, sub_tasks: updatedSubTasks });
  }

  function handleSubTaskDateClear() {
    if (!editingSubTaskId) return;
    
    const subTaskIndex = task.sub_tasks.findIndex(st => st.id === editingSubTaskId);
    if (subTaskIndex === -1) return;

    const updatedSubTasks = [...task.sub_tasks];
    updatedSubTasks[subTaskIndex] = {
      ...updatedSubTasks[subTaskIndex],
      due_date: undefined,
      start_date: undefined,
      end_date: undefined,
      is_range_date: false
    };
    
    taskStore.updateTask(task.id, { ...task, sub_tasks: updatedSubTasks });
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
  <Button
    variant="ghost"
    class="task-item-button rounded-lg border bg-card text-card-foreground shadow-sm border-l-4 {getPriorityColor(
      task.priority,
    )} p-4 h-auto flex-1 justify-start text-left transition-all {isActiveTask
      ? 'selected'
      : ''} min-w-0"
    onclick={handleTaskClick}
    oncontextmenu={handleTaskContextMenu}
  >
    <div class="flex items-start gap-3 w-full min-w-0 overflow-hidden">
      <!-- Status Toggle -->
      <Button
        variant="ghost"
        size="icon"
        class="text-3xl hover:scale-110 transition h-12 w-12 min-h-[48px] min-w-[48px] "
        onclick={(e) => e && handleStatusToggle(e)}
        title="Toggle completion status"
      >
        {getStatusIcon(task.status)}
      </Button>

      <!-- Task Content -->
      <div class="flex-1 min-w-0 overflow-hidden">
        <!-- Title and Due Date Row -->
        <div class="flex items-start gap-3 w-full min-w-0">
          <h3
            class="truncate font-medium text-base leading-tight flex-1 min-w-0 overflow-hidden"
            class:line-through={task.status === "completed"}
            class:text-muted-foreground={task.status === "completed"}
            title={task.title}
            style="text-overflow: ellipsis; white-space: nowrap;"
          >
            {task.title}
          </h3>

          {#if task.due_date}
            <button
              class="text-sm whitespace-nowrap flex-shrink-0 {getDueDateClass(
                task.due_date,
                task.status,
              )} hover:bg-muted rounded px-1 py-0.5 transition-colors"
              onclick={handleDueDateClick}
              title="Click to change due date"
            >
              {formatDate(task.due_date)}
            </button>
          {:else}
            <button
              class="text-sm whitespace-nowrap flex-shrink-0 text-muted-foreground hover:bg-muted rounded px-1 py-0.5 transition-colors"
              onclick={handleDueDateClick}
              title="Click to set due date"
            >
              + Add date
            </button>
          {/if}
        </div>

        {#if task.description}
          <p
            class="text-sm text-muted-foreground mt-1 block w-full min-w-0"
            style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; word-break: break-word;"
          >
            {task.description}
          </p>
        {/if}

        <!-- Sub-tasks preview -->
        {#if task.sub_tasks.length > 0}
          <div class="mt-2">
            <div class="text-xs text-muted-foreground">
              {completedSubTasks} / {task.sub_tasks.length} subtasks completed
            </div>
            <div class="w-full bg-muted rounded-full h-1.5 mt-1">
              <div
                class="bg-primary h-1.5 rounded-full transition-all duration-300"
                style="width: {subTaskProgress}%"
              ></div>
            </div>
          </div>
        {/if}

        <!-- Tags -->
        {#if task.tags.length > 0}
          <div class="flex flex-wrap gap-1 mt-2">
            {#each task.tags as tag}
              <Badge
                variant="outline"
                class="text-xs"
                style="border-color: {tag.color}; color: {tag.color};"
              >
                {tag.name}
              </Badge>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </Button>
</div>

<!-- Sub-tasks Accordion -->
{#if task.sub_tasks.length > 0 && showSubTasks}
  <div class="ml-10 mt-2 space-y-2">
    {#each task.sub_tasks as subTask (subTask.id)}
      <Button
        variant="ghost"
        class="flex items-center gap-2 p-2 rounded border w-full justify-start h-auto bg-card text-card-foreground {taskStore.selectedSubTaskId ===
        subTask.id
          ? 'bg-primary/10 border-primary'
          : ''}"
        onclick={(e) => e && handleSubTaskClick(e, subTask.id)}
        oncontextmenu={(e) => handleSubTaskContextMenu(e, subTask)}
      >
        <Button
          variant="ghost"
          size="icon"
          class="text-lg h-6 w-6 min-h-[24px] min-w-[24px]"
          onclick={(e) => e && handleSubTaskToggle(e, subTask.id)}
          title="Toggle subtask completion"
        >
          {subTask.status === "completed" ? "✅" : "⚪"}
        </Button>
        <div class="flex items-center justify-between gap-2 flex-1 min-w-0">
          <span
            class="text-sm font-medium truncate"
            class:line-through={subTask.status === "completed"}
            class:text-muted-foreground={subTask.status === "completed"}
          >
            {subTask.title}
          </span>
          {#if subTask.due_date}
            <button
              class="text-xs text-muted-foreground whitespace-nowrap hover:bg-muted rounded px-1 py-0.5 transition-colors"
              onclick={(e) => handleSubTaskDueDateClick(e, subTask)}
              title="Click to change due date"
            >
              {formatDate(subTask.due_date)}
            </button>
          {:else}
            <button
              class="text-xs text-muted-foreground whitespace-nowrap hover:bg-muted rounded px-1 py-0.5 transition-colors"
              onclick={(e) => handleSubTaskDueDateClick(e, subTask)}
              title="Click to set due date"
            >
              + Add date
            </button>
          {/if}
        </div>
      </Button>
    {/each}
  </div>
{/if}

<!-- Inline Date Picker -->
<InlineDatePicker
  show={showDatePicker}
  currentDate={task.due_date}
  position={datePickerPosition}
  isRangeDate={task.is_range_date || false}
  onchange={handleDateChange}
  onclear={handleDateClear}
  onclose={handleDatePickerClose}
/>

<!-- SubTask Date Picker -->
<InlineDatePicker
  show={showSubTaskDatePicker}
  currentDate={editingSubTaskId ? task.sub_tasks.find(st => st.id === editingSubTaskId)?.due_date : ''}
  position={subTaskDatePickerPosition}
  isRangeDate={editingSubTaskId ? task.sub_tasks.find(st => st.id === editingSubTaskId)?.is_range_date || false : false}
  onchange={handleSubTaskDateChange}
  onclear={handleSubTaskDateClear}
  onclose={handleSubTaskDatePickerClose}
/>
