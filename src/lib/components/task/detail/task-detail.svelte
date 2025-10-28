<script lang="ts">
  import { onDestroy } from 'svelte';
  import Card from '$lib/components/ui/card.svelte';
  import TaskDetailContent from '$lib/components/task/detail/task-detail-content.svelte';
  import TaskDetailDialogs from '$lib/components/task/dialogs/task-detail-dialogs.svelte';
  import {
    TaskDetailViewStore,
    type TaskDetailDomainActions
  } from '$lib/stores/task-detail-view-store.svelte';
  import { taskMutations } from '$lib/services/domain/task/task-mutations-instance';
  import { taskInteractions } from '$lib/services/ui/task';
  import type { TaskStatus, TaskWithSubTasks } from '$lib/types/task';
  import { SubTaskMutations } from '$lib/services/domain/subtask';
  import { selectionStore } from '$lib/stores/selection-store.svelte';
  import { createTaskDetailActions } from '$lib/services/ui/task-detail/task-detail-actions';

  const subTaskMutations = new SubTaskMutations();
  import { RecurrenceSyncService } from '$lib/services/domain/recurrence-sync';
  import { taskStore } from '$lib/stores/tasks.svelte';

  interface Props {
    isDrawerMode?: boolean;
  }

  let { isDrawerMode = false }: Props = $props();

  // Components層でUI状態とビジネスロジックを統合
  function forceSelectTask(taskId: string): void {
    if (taskStore.isNewTaskMode) {
      taskInteractions.cancelNewTaskMode();
    }
    selectionStore.selectTask(taskId);
  }

  function forceSelectSubTask(subTaskId: string): void {
    if (taskStore.isNewTaskMode) {
      taskInteractions.cancelNewTaskMode();
    }
    selectionStore.selectSubTask(subTaskId);
  }

  const domainActions: TaskDetailDomainActions = {
    selectTask: selectionStore.selectTask,
    selectSubTask: selectionStore.selectSubTask,
    forceSelectTask,
    forceSelectSubTask,
    changeTaskStatus: (taskId: string, status: TaskStatus) =>
      taskMutations.changeTaskStatus(taskId, status),
    changeSubTaskStatus: (subTaskId: string, status: TaskStatus) =>
      subTaskMutations.changeSubTaskStatus(subTaskId, status),
    deleteTask: (taskId: string) => taskMutations.deleteTask(taskId),
    deleteSubTask: (subTaskId: string) => subTaskMutations.deleteSubTask(subTaskId),
    toggleSubTaskStatus: (task: TaskWithSubTasks, subTaskId: string) =>
      subTaskMutations.toggleSubTaskStatus(task, subTaskId),
    addSubTask: (taskId: string, data: { title: string }) =>
      subTaskMutations.addSubTask(taskId, data),
    moveTaskToList: (taskId: string, taskListId: string) =>
      taskMutations.moveTaskToList(taskId, taskListId)
  };

  const detailStore = new TaskDetailViewStore({ actions: domainActions });

  const detailActions = createTaskDetailActions({
    store: detailStore,
    domain: domainActions,
    recurrence: {
      save: RecurrenceSyncService.save
    },
    interactions: {
      cancelNewTaskMode: taskInteractions.cancelNewTaskMode,
      saveNewTask: taskInteractions.saveNewTask,
      updateNewTaskData: taskInteractions.updateNewTaskData
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
      onTitleChange={detailActions.handleTitleChange}
      onDescriptionChange={detailActions.handleDescriptionChange}
      onPriorityChange={detailActions.handlePriorityChange}
      onStatusChange={detailActions.handleStatusChange}
      onDueDateClick={detailActions.handleDueDateClick}
      onFormChange={detailActions.handleFormChange}
      onDelete={detailActions.handleDelete}
      onSaveNewTask={detailActions.handleSaveNewTask}
      onSubTaskClick={detailActions.handleSubTaskClick}
      onSubTaskToggle={detailActions.handleSubTaskToggle}
      onAddSubTask={detailActions.handleAddSubTask}
      showSubTaskAddForm={detailStore.showSubTaskAddForm}
      onSubTaskAdded={detailActions.handleSubTaskAdded}
      onSubTaskAddCancel={detailActions.handleSubTaskAddCancel}
      onGoToParentTask={detailActions.handleGoToParentTask}
      onProjectTaskListEdit={detailActions.handleProjectTaskListEdit}
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
      onTitleChange={detailActions.handleTitleChange}
      onDescriptionChange={detailActions.handleDescriptionChange}
      onPriorityChange={detailActions.handlePriorityChange}
      onStatusChange={detailActions.handleStatusChange}
      onDueDateClick={detailActions.handleDueDateClick}
      onFormChange={detailActions.handleFormChange}
      onDelete={detailActions.handleDelete}
      onSaveNewTask={detailActions.handleSaveNewTask}
      onSubTaskClick={detailActions.handleSubTaskClick}
      onSubTaskToggle={detailActions.handleSubTaskToggle}
      onAddSubTask={detailActions.handleAddSubTask}
      showSubTaskAddForm={detailStore.showSubTaskAddForm}
      onSubTaskAdded={detailActions.handleSubTaskAdded}
      onSubTaskAddCancel={detailActions.handleSubTaskAddCancel}
      onGoToParentTask={detailActions.handleGoToParentTask}
      onProjectTaskListEdit={detailActions.handleProjectTaskListEdit}
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
  onDateChange={detailActions.handleDateChange}
  onDateClear={detailActions.handleDateClear}
  onDatePickerClose={detailActions.handleDatePickerClose}
  onConfirmDiscard={detailActions.handleConfirmDiscard}
  onCancelDiscard={detailActions.handleCancelDiscard}
  onConfirmDelete={detailActions.handleConfirmDelete}
  onCancelDelete={detailActions.handleCancelDelete}
  onProjectTaskListChange={detailActions.handleProjectTaskListChange}
  onProjectTaskListDialogClose={detailActions.handleProjectTaskListDialogClose}
  onRecurrenceChange={detailActions.handleRecurrenceChange}
  onRecurrenceDialogClose={detailActions.handleRecurrenceDialogClose}
/>
