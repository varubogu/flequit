<script lang="ts">
  import type { TaskWithSubTasks } from '$lib/types/task';
  import type { SubTask } from '$lib/types/sub-task';
  import type { RecurrenceRule } from '$lib/types/datetime-calendar';
  import InlineDatePicker from '$lib/components/datetime/inline-picker/inline-date-picker.svelte';
  import NewTaskConfirmationDialog from './new-task-confirmation-dialog.svelte';
  import DeleteConfirmationDialog from '$lib/components/dialog/delete-confirmation-dialog.svelte';
  import ProjectTaskListSelectorDialog from '$lib/components/project/project-task-list-selector-dialog.svelte';
  import RecurrenceDialog from '$lib/components/recurrence/recurrence-dialog.svelte';

  interface Props {
    currentItem: TaskWithSubTasks | SubTask | null;
    editForm: {
      title: string;
      description: string;
      start_date: Date | undefined;
      end_date: Date | undefined;
      is_range_date: boolean;
      priority: number;
    };
    showDatePicker: boolean;
    datePickerPosition: { x: number; y: number };
    showConfirmationDialog: boolean;
    showDeleteDialog: boolean;
    deleteDialogTitle: string;
    deleteDialogMessage: string;
    showProjectTaskListDialog: boolean;
    showRecurrenceDialog: boolean;
    projectInfo: {
      project: { id: string; name: string };
      taskList: { id: string; name: string };
    } | null;
    onDateChange: (data: {
      date: string;
      dateTime: string;
      range?: { start: string; end: string };
      isRangeDate: boolean;
    }) => void;
    onDateClear: () => void;
    onDatePickerClose: () => void;
    onConfirmDiscard: () => void;
    onCancelDiscard: () => void;
    onConfirmDelete: () => void;
    onCancelDelete: () => void;
    onProjectTaskListChange: (data: { projectId: string; taskListId: string }) => void;
    onProjectTaskListDialogClose: () => void;
    onRecurrenceChange: (rule: RecurrenceRule | null) => void;
    onRecurrenceDialogClose: () => void;
  }

  let {
    currentItem,
    editForm,
    showDatePicker,
    datePickerPosition,
    showConfirmationDialog,
    showDeleteDialog,
    deleteDialogTitle,
    deleteDialogMessage,
    showProjectTaskListDialog,
    showRecurrenceDialog,
    projectInfo,
    onDateChange,
    onDateClear,
    onDatePickerClose,
    onConfirmDiscard,
    onCancelDiscard,
    onConfirmDelete,
    onCancelDelete,
    onProjectTaskListChange,
    onProjectTaskListDialogClose,
    onRecurrenceChange,
    onRecurrenceDialogClose
  }: Props = $props();
</script>

<!-- Inline Date Picker -->
<InlineDatePicker
  show={showDatePicker}
  currentDate={currentItem?.end_date ? currentItem.end_date.toISOString() : ''}
  currentStartDate={currentItem?.start_date ? currentItem.start_date.toISOString() : ''}
  position={datePickerPosition}
  isRangeDate={editForm.is_range_date}
  recurrenceRule={currentItem?.recurrence_rule}
  onchange={onDateChange}
  onclear={onDateClear}
  onclose={onDatePickerClose}
/>

<!-- Confirmation dialog for new task mode -->
<NewTaskConfirmationDialog
  open={showConfirmationDialog}
  onConfirm={onConfirmDiscard}
  onCancel={onCancelDiscard}
/>

<!-- Delete confirmation dialog -->
<DeleteConfirmationDialog
  open={showDeleteDialog}
  title={deleteDialogTitle}
  message={deleteDialogMessage}
  onConfirm={onConfirmDelete}
  onCancel={onCancelDelete}
/>

<!-- プロジェクト・タスクリスト選択モーダル -->
<ProjectTaskListSelectorDialog
  open={showProjectTaskListDialog}
  currentProjectId={projectInfo?.project.id || ''}
  currentTaskListId={projectInfo?.taskList.id || ''}
  onSave={onProjectTaskListChange}
  onClose={onProjectTaskListDialogClose}
/>

<!-- 繰り返し設定ダイアログ -->
<RecurrenceDialog
  open={showRecurrenceDialog}
  recurrenceRule={currentItem?.recurrence_rule}
  startDateTime={currentItem?.start_date}
  endDateTime={currentItem?.end_date}
  isRangeDate={currentItem?.is_range_date}
  onSave={onRecurrenceChange}
  onOpenChange={onRecurrenceDialogClose}
/>
