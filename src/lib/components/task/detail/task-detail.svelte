<script lang="ts">
  import { taskStore } from '$lib/stores/tasks.svelte';
  import Card from '$lib/components/ui/card.svelte';
  import { TaskDetailLogic } from './task-detail-logic.svelte';
  import TaskDetailContent from './task-detail-content.svelte';
  import TaskDetailDialogs from '../dialogs/task-detail-dialogs.svelte';

  interface Props {
    isDrawerMode?: boolean;
  }

  let { isDrawerMode = false }: Props = $props();

  const logic = new TaskDetailLogic();
</script>

{#if isDrawerMode}
  <!-- Drawer mode: no Card wrapper, direct content -->
  <div class="flex h-full flex-col">
    <TaskDetailContent
      currentItem={logic.currentItem}
      task={logic.task}
      subTask={logic.subTask}
      isSubTask={logic.isSubTask}
      isNewTaskMode={logic.isNewTaskMode}
      editForm={logic.editForm}
      selectedSubTaskId={taskStore.selectedSubTaskId}
      projectInfo={logic.getProjectInfo()}
      {isDrawerMode}
      onTitleChange={logic.handleTitleChange.bind(logic)}
      onDescriptionChange={logic.handleDescriptionChange.bind(logic)}
      onPriorityChange={logic.handlePriorityChange.bind(logic)}
      onStatusChange={logic.handleStatusChange.bind(logic)}
      onDueDateClick={logic.handleDueDateClick.bind(logic)}
      onFormChange={logic.handleFormChange.bind(logic)}
      onDelete={logic.handleDelete.bind(logic)}
      onSaveNewTask={logic.handleSaveNewTask.bind(logic)}
      onSubTaskClick={logic.handleSubTaskClick.bind(logic)}
      onSubTaskToggle={logic.handleSubTaskToggle.bind(logic)}
      onAddSubTask={logic.handleAddSubTask?.bind(logic)}
      showSubTaskAddForm={logic.showSubTaskAddForm}
      onSubTaskAdded={logic.handleSubTaskAdded?.bind(logic)}
      onSubTaskAddCancel={logic.handleSubTaskAddCancel?.bind(logic)}
      onGoToParentTask={logic.handleGoToParentTask.bind(logic)}
      onProjectTaskListEdit={logic.handleProjectTaskListEdit.bind(logic)}
    />
  </div>
{:else}
  <!-- Desktop mode: Card wrapper -->
  <Card class="flex h-full flex-col">
    <TaskDetailContent
      currentItem={logic.currentItem}
      task={logic.task}
      subTask={logic.subTask}
      isSubTask={logic.isSubTask}
      isNewTaskMode={logic.isNewTaskMode}
      editForm={logic.editForm}
      selectedSubTaskId={taskStore.selectedSubTaskId}
      projectInfo={logic.getProjectInfo()}
      {isDrawerMode}
      onTitleChange={logic.handleTitleChange.bind(logic)}
      onDescriptionChange={logic.handleDescriptionChange.bind(logic)}
      onPriorityChange={logic.handlePriorityChange.bind(logic)}
      onStatusChange={logic.handleStatusChange.bind(logic)}
      onDueDateClick={logic.handleDueDateClick.bind(logic)}
      onFormChange={logic.handleFormChange.bind(logic)}
      onDelete={logic.handleDelete.bind(logic)}
      onSaveNewTask={logic.handleSaveNewTask.bind(logic)}
      onSubTaskClick={logic.handleSubTaskClick.bind(logic)}
      onSubTaskToggle={logic.handleSubTaskToggle.bind(logic)}
      onAddSubTask={logic.handleAddSubTask?.bind(logic)}
      showSubTaskAddForm={logic.showSubTaskAddForm}
      onSubTaskAdded={logic.handleSubTaskAdded?.bind(logic)}
      onSubTaskAddCancel={logic.handleSubTaskAddCancel?.bind(logic)}
      onGoToParentTask={logic.handleGoToParentTask.bind(logic)}
      onProjectTaskListEdit={logic.handleProjectTaskListEdit.bind(logic)}
    />
  </Card>
{/if}

<!-- All Dialogs -->
<TaskDetailDialogs
  currentItem={logic.currentItem}
  editForm={logic.editFormForUI}
  showDatePicker={logic.showDatePicker}
  datePickerPosition={logic.datePickerPosition}
  showConfirmationDialog={logic.showConfirmationDialog}
  showDeleteDialog={logic.showDeleteDialog}
  deleteDialogTitle={logic.deleteDialogTitle}
  deleteDialogMessage={logic.deleteDialogMessage}
  showProjectTaskListDialog={logic.showProjectTaskListDialog}
  showRecurrenceDialog={logic.showRecurrenceDialog}
  projectInfo={logic.getProjectInfo()}
  onDateChange={logic.handleDateChange.bind(logic)}
  onDateClear={logic.handleDateClear.bind(logic)}
  onDatePickerClose={logic.handleDatePickerClose.bind(logic)}
  onConfirmDiscard={logic.handleConfirmDiscard.bind(logic)}
  onCancelDiscard={logic.handleCancelDiscard.bind(logic)}
  onConfirmDelete={logic.handleConfirmDelete.bind(logic)}
  onCancelDelete={logic.handleCancelDelete.bind(logic)}
  onProjectTaskListChange={logic.handleProjectTaskListChange.bind(logic)}
  onProjectTaskListDialogClose={logic.handleProjectTaskListDialogClose.bind(logic)}
  onRecurrenceChange={logic.handleRecurrenceChange.bind(logic)}
  onRecurrenceDialogClose={logic.handleRecurrenceDialogClose.bind(logic)}
/>
