<script lang="ts">
  import type { TaskWithSubTasks } from '$lib/types/task';
  import type { SubTask } from '$lib/types/sub-task';
  import { taskStore } from '$lib/stores/tasks.svelte';
  import InlineDatePicker from '$lib/components/datetime/inline-picker/inline-date-picker.svelte';

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
  }) {
    const { dateTime, range, isRangeDate } = data;

    if (isRangeDate) {
      if (range) {
        taskStore.updateTask(task.id, {
          ...task,
          start_date: new Date(range.start),
          end_date: new Date(range.end),
          is_range_date: true
        });
      } else {
        const currentEndDate = task.end_date || new Date(dateTime);
        taskStore.updateTask(task.id, {
          ...task,
          start_date: currentEndDate,
          end_date: currentEndDate,
          is_range_date: true
        });
      }
    } else {
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
  }) {
    if (!editingSubTaskId) return;

    const { dateTime, range, isRangeDate } = data;
    const subTaskIndex = task.sub_tasks.findIndex((st) => st.id === editingSubTaskId);
    if (subTaskIndex === -1) return;

    if (isRangeDate) {
      if (range) {
        taskStore.updateSubTask(editingSubTaskId, {
          start_date: new Date(range.start),
          end_date: new Date(range.end),
          is_range_date: true
        });
      } else {
        const subTask = task.sub_tasks[subTaskIndex];
        const currentEndDate = subTask.end_date || new Date(dateTime);
        taskStore.updateSubTask(editingSubTaskId, {
          start_date: currentEndDate,
          end_date: currentEndDate,
          is_range_date: true
        });
      }
    } else {
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

  // Export handlers for parent component
  export { handleDueDateClick, handleSubTaskDueDateClick, datePickerPosition, showDatePicker };
</script>

<!-- Main Task Date Picker -->
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
  currentDate={editingSubTaskId
    ? task.sub_tasks.find((st) => st.id === editingSubTaskId)?.end_date?.toISOString() || ''
    : ''}
  currentStartDate={editingSubTaskId
    ? task.sub_tasks.find((st) => st.id === editingSubTaskId)?.start_date?.toISOString() || ''
    : ''}
  position={subTaskDatePickerPosition}
  isRangeDate={editingSubTaskId
    ? task.sub_tasks.find((st) => st.id === editingSubTaskId)?.is_range_date || false
    : false}
  onchange={handleSubTaskDateChange}
  onclear={handleSubTaskDateClear}
  onclose={handleSubTaskDatePickerClose}
/>
