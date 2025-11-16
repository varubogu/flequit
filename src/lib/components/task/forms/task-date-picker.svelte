<script lang="ts">
  import type { TaskWithSubTasks } from '$lib/types/task';
  import type { SubTask } from '$lib/types/sub-task';
  import InlineDatePicker from '$lib/components/datetime/inline-picker/inline-date-picker.svelte';
  import { useTaskDatePickerController } from '$lib/components/task/forms/task-date-picker/controller.svelte';

  interface Props {
    task: TaskWithSubTasks;
  }

  let { task }: Props = $props();

  const controller = useTaskDatePickerController(task);

  // Export handlers for parent component
  export function handleDueDateClick(event: MouseEvent) {
    controller.handleDueDateClick(event);
  }

  export function handleSubTaskDueDateClick(event: MouseEvent, subTask: SubTask) {
    controller.handleSubTaskDueDateClick(event, subTask.id);
  }

  // Re-export state for parent component access
  export function getDatePickerPosition() {
    return controller.datePickerPosition;
  }

  export function getShowDatePicker() {
    return controller.showDatePicker;
  }
</script>

<!-- Main Task Date Picker -->
<InlineDatePicker
  show={controller.showDatePicker}
  currentDate={controller.currentTask.planEndDate ? controller.currentTask.planEndDate.toISOString() : ''}
  currentStartDate={controller.currentTask.planStartDate ? controller.currentTask.planStartDate.toISOString() : ''}
  position={controller.datePickerPosition}
  isRangeDate={controller.currentTask.isRangeDate || false}
  recurrenceRule={controller.currentTask.recurrenceRule}
  onchange={controller.handleDateChange}
  onclear={controller.handleDateClear}
  onclose={controller.handleDatePickerClose}
/>

<!-- SubTask Date Picker -->
{#if controller.editingSubTaskId}
  {@const editingSubTask = controller.getEditingSubTask()}
  <InlineDatePicker
    show={controller.showSubTaskDatePicker}
    currentDate={editingSubTask?.planEndDate?.toISOString() || ''}
    currentStartDate={editingSubTask?.planStartDate?.toISOString() || ''}
    position={controller.subTaskDatePickerPosition}
    isRangeDate={editingSubTask?.isRangeDate || false}
    recurrenceRule={editingSubTask?.recurrenceRule}
    onchange={controller.handleSubTaskDateChange}
    onclear={controller.handleSubTaskDateClear}
    onclose={controller.handleSubTaskDatePickerClose}
  />
{/if}
