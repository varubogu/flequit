<script lang="ts">
  import type { TaskWithSubTasks } from '$lib/types/task';
  import type { SubTask } from '$lib/types/sub-task';
  import { taskStore } from '$lib/stores/tasks.svelte';
  import InlineDatePicker from '$lib/components/datetime/inline-picker/inline-date-picker.svelte';
  import type { RecurrenceRule } from '$lib/types/datetime-calendar';
  interface Props {
    task: TaskWithSubTasks;
  }

  let { task }: Props = $props();

  // Main task date picker state
  let showDatePicker = $state(false);
  let datePickerPosition = $state({ x: 0, y: 0 });

  // SubTask date picker state
  let showSubTaskDatePicker = $state(false);
  let subTaskDatePickerPosition = $state({ x: 0, y: 0 });
  let editingSubTaskId = $state<string | null>(null);

  // Main task date picker handlers
  function handleDueDateClick(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    datePickerPosition = {
      x: Math.min(rect.left, window.innerWidth - 300),
      y: rect.bottom + 8
    };
    showDatePicker = true;
  }

  function handleDateChange(data: {
    date: string;
    dateTime: string;
    range?: { start: string; end: string };
    isRangeDate: boolean;
    recurrenceRule?: RecurrenceRule | null;
  }) {
    const { dateTime, range, isRangeDate, recurrenceRule } = data;

    if (isRangeDate) {
      if (range) {
        taskStore.updateTask(task.id, {
          ...task,
          planStartDate: new Date(range.start),
          planEndDate: new Date(range.end),
          isRangeDate: true,
          recurrenceRule: recurrenceRule ?? undefined
        });
      } else {
        const currentEndDate = task.planEndDate || new Date(dateTime);
        taskStore.updateTask(task.id, {
          ...task,
          planStartDate: currentEndDate,
          planEndDate: currentEndDate,
          isRangeDate: true,
          recurrenceRule: recurrenceRule ?? undefined
        });
      }
    } else {
      taskStore.updateTask(task.id, {
        ...task,
        planEndDate: new Date(dateTime),
        planStartDate: undefined,
        isRangeDate: false,
        recurrenceRule: recurrenceRule ?? undefined
      });
    }
  }

  function handleDateClear() {
    taskStore.updateTask(task.id, {
      ...task,
      planStartDate: undefined,
      planEndDate: undefined,
      isRangeDate: false
    });
  }

  function handleDatePickerClose() {
    showDatePicker = false;
  }

  // SubTask date picker handlers
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

  function handleSubTaskDateChange(data: {
    date: string;
    dateTime: string;
    range?: { start: string; end: string };
    isRangeDate: boolean;
    recurrenceRule?: RecurrenceRule | null;
  }) {
    if (!editingSubTaskId) return;

    const { dateTime, range, isRangeDate, recurrenceRule } = data;
    const subTaskIndex = task.subTasks.findIndex((st) => st.id === editingSubTaskId);
    if (subTaskIndex === -1) return;

    if (isRangeDate) {
      if (range) {
        taskStore.updateSubTask(editingSubTaskId, {
          planStartDate: new Date(range.start),
          planEndDate: new Date(range.end),
          isRangeDate: true,
          recurrenceRule: recurrenceRule ?? undefined
        });
      } else {
        const subTask = task.subTasks[subTaskIndex];
        const currentEndDate = subTask.planEndDate || new Date(dateTime);
        taskStore.updateSubTask(editingSubTaskId, {
          planStartDate: currentEndDate,
          planEndDate: currentEndDate,
          isRangeDate: true,
          recurrenceRule: recurrenceRule ?? undefined
        });
      }
    } else {
      taskStore.updateSubTask(editingSubTaskId, {
        planEndDate: new Date(dateTime),
        planStartDate: undefined,
        isRangeDate: false,
        recurrenceRule: recurrenceRule ?? undefined
      });
    }
  }

  function handleSubTaskDateClear() {
    if (!editingSubTaskId) return;

    taskStore.updateSubTask(editingSubTaskId, {
      planStartDate: undefined,
      planEndDate: undefined,
      isRangeDate: false
    });
  }

  function handleSubTaskDatePickerClose() {
    showSubTaskDatePicker = false;
    editingSubTaskId = null;
  }

  // Export handlers for parent component
  export { handleDueDateClick, handleSubTaskDueDateClick, datePickerPosition, showDatePicker };
</script>

<!-- Main Task Date Picker -->
<InlineDatePicker
  show={showDatePicker}
  currentDate={task.planEndDate ? task.planEndDate.toISOString() : ''}
  currentStartDate={task.planStartDate ? task.planStartDate.toISOString() : ''}
  position={datePickerPosition}
  isRangeDate={task.isRangeDate || false}
  recurrenceRule={task.recurrenceRule}
  onchange={handleDateChange}
  onclear={handleDateClear}
  onclose={handleDatePickerClose}
/>

<!-- SubTask Date Picker -->
<InlineDatePicker
  show={showSubTaskDatePicker}
  currentDate={editingSubTaskId
    ? task.subTasks.find((st) => st.id === editingSubTaskId)?.planEndDate?.toISOString() || ''
    : ''}
  currentStartDate={editingSubTaskId
    ? task.subTasks.find((st) => st.id === editingSubTaskId)?.planStartDate?.toISOString() || ''
    : ''}
  position={subTaskDatePickerPosition}
  isRangeDate={editingSubTaskId
    ? task.subTasks.find((st) => st.id === editingSubTaskId)?.isRangeDate || false
    : false}
  recurrenceRule={editingSubTaskId
    ? task.subTasks.find((st) => st.id === editingSubTaskId)?.recurrenceRule
    : null}
  onchange={handleSubTaskDateChange}
  onclear={handleSubTaskDateClear}
  onclose={handleSubTaskDatePickerClose}
/>
