<script lang="ts">
  import { onDestroy } from 'svelte';
  import Card from '$lib/components/ui/card.svelte';
  import TaskDetailContent from './task-detail-content.svelte';
  import TaskDetailDialogs from '../dialogs/task-detail-dialogs.svelte';
  import { TaskDetailViewStore } from '$lib/stores/task-detail-view-store.svelte';
  import { TaskMutations } from '$lib/services/domain/task';
  import { SubTaskMutations } from '$lib/services/domain/subtask';
  import { selectionStore } from '$lib/stores/selection-store.svelte';

  const taskMutations = new TaskMutations();
  const subTaskMutations = new SubTaskMutations();
  import { RecurrenceSyncService } from '$lib/services/domain/recurrence-sync';
  import { taskStore } from '$lib/stores/tasks.svelte';

  interface Props {
    isDrawerMode?: boolean;
  }

  let { isDrawerMode = false }: Props = $props();

  // Components層でUI状態とビジネスロジックを統合
  function forceSelectTask(taskId: string | null): void {
    if (taskStore.isNewTaskMode) {
      taskStore.cancelNewTaskMode();
    }
    selectionStore.selectTask(taskId);
  }

  function forceSelectSubTask(subTaskId: string | null): void {
    if (taskStore.isNewTaskMode) {
      taskStore.cancelNewTaskMode();
    }
    selectionStore.selectSubTask(subTaskId);
  }

  const detailStore = new TaskDetailViewStore({
    actions: {
      selectTask: selectionStore.selectTask,
      selectSubTask: selectionStore.selectSubTask,
      forceSelectTask: forceSelectTask,
      forceSelectSubTask: forceSelectSubTask,
      changeTaskStatus: taskMutations.changeTaskStatus,
      changeSubTaskStatus: subTaskMutations.changeSubTaskStatus,
      deleteTask: taskMutations.deleteTask,
      deleteSubTask: subTaskMutations.deleteSubTask,
      toggleSubTaskStatus: subTaskMutations.toggleSubTaskStatus,
      addSubTask: subTaskMutations.addSubTask
    },
    recurrence: {
      save: RecurrenceSyncService.save
    }
  });

  onDestroy(() => {
    detailStore.dispose();
  });
</script>

{#if isDrawerMode}
  <!-- Drawer mode: no Card wrapper, direct content -->
  <div class="flex h-full flex-col">
    <TaskDetailContent
      currentItem={detailStore.currentItem}
      task={detailStore.task}
      subTask={detailStore.subTask}
      isSubTask={detailStore.isSubTask}
      isNewTaskMode={detailStore.isNewTaskMode}
      editForm={detailStore.editForm}
      selectedSubTaskId={detailStore.selectedSubTaskId}
      projectInfo={detailStore.projectInfo}
      {isDrawerMode}
      onTitleChange={detailStore.handleTitleChange}
      onDescriptionChange={detailStore.handleDescriptionChange}
      onPriorityChange={detailStore.handlePriorityChange}
      onStatusChange={detailStore.handleStatusChange}
      onDueDateClick={detailStore.handleDueDateClick}
      onFormChange={detailStore.handleFormChange}
      onDelete={detailStore.handleDelete}
      onSaveNewTask={detailStore.handleSaveNewTask}
      onSubTaskClick={detailStore.handleSubTaskClick}
      onSubTaskToggle={detailStore.handleSubTaskToggle}
      onAddSubTask={detailStore.handleAddSubTask}
      showSubTaskAddForm={detailStore.showSubTaskAddForm}
      onSubTaskAdded={detailStore.handleSubTaskAdded}
      onSubTaskAddCancel={detailStore.handleSubTaskAddCancel}
      onGoToParentTask={detailStore.handleGoToParentTask}
      onProjectTaskListEdit={detailStore.handleProjectTaskListEdit}
    />
  </div>
{:else}
  <!-- Desktop mode: Card wrapper -->
  <Card class="flex h-full flex-col">
    <TaskDetailContent
      currentItem={detailStore.currentItem}
      task={detailStore.task}
      subTask={detailStore.subTask}
      isSubTask={detailStore.isSubTask}
      isNewTaskMode={detailStore.isNewTaskMode}
      editForm={detailStore.editForm}
      selectedSubTaskId={detailStore.selectedSubTaskId}
      projectInfo={detailStore.projectInfo}
      {isDrawerMode}
      onTitleChange={detailStore.handleTitleChange}
      onDescriptionChange={detailStore.handleDescriptionChange}
      onPriorityChange={detailStore.handlePriorityChange}
      onStatusChange={detailStore.handleStatusChange}
      onDueDateClick={detailStore.handleDueDateClick}
      onFormChange={detailStore.handleFormChange}
      onDelete={detailStore.handleDelete}
      onSaveNewTask={detailStore.handleSaveNewTask}
      onSubTaskClick={detailStore.handleSubTaskClick}
      onSubTaskToggle={detailStore.handleSubTaskToggle}
      onAddSubTask={detailStore.handleAddSubTask}
      showSubTaskAddForm={detailStore.showSubTaskAddForm}
      onSubTaskAdded={detailStore.handleSubTaskAdded}
      onSubTaskAddCancel={detailStore.handleSubTaskAddCancel}
      onGoToParentTask={detailStore.handleGoToParentTask}
      onProjectTaskListEdit={detailStore.handleProjectTaskListEdit}
    />
  </Card>
{/if}

<!-- All Dialogs -->
<TaskDetailDialogs
  currentItem={detailStore.currentItem}
  editForm={detailStore.editFormForUI}
  showDatePicker={detailStore.showDatePicker}
  datePickerPosition={detailStore.datePickerPosition}
  showConfirmationDialog={detailStore.showConfirmationDialog}
  showDeleteDialog={detailStore.showDeleteDialog}
  deleteDialogTitle={detailStore.deleteDialogTitle}
  deleteDialogMessage={detailStore.deleteDialogMessage}
  showProjectTaskListDialog={detailStore.showProjectTaskListDialog}
  showRecurrenceDialog={detailStore.showRecurrenceDialog}
  projectInfo={detailStore.projectInfo}
  onDateChange={detailStore.handleDateChange}
  onDateClear={detailStore.handleDateClear}
  onDatePickerClose={detailStore.handleDatePickerClose}
  onConfirmDiscard={detailStore.handleConfirmDiscard}
  onCancelDiscard={detailStore.handleCancelDiscard}
  onConfirmDelete={detailStore.handleConfirmDelete}
  onCancelDelete={detailStore.handleCancelDelete}
  onProjectTaskListChange={detailStore.handleProjectTaskListChange}
  onProjectTaskListDialogClose={detailStore.handleProjectTaskListDialogClose}
  onRecurrenceChange={detailStore.handleRecurrenceChange}
  onRecurrenceDialogClose={detailStore.handleRecurrenceDialogClose}
/>
