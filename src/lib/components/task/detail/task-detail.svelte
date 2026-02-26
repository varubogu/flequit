<script lang="ts">
  import { onDestroy } from 'svelte';
  import Card from '$lib/components/ui/card.svelte';
  import TaskDetailContent from '$lib/components/task/detail/task-detail-content.svelte';
  import TaskDetailDialogs from '$lib/components/task/dialogs/task-detail-dialogs.svelte';
  import {
    TaskDetailViewStore,
    type TaskDetailDomainActions
  } from '$lib/stores/task-detail-view-store.svelte';
  import { taskOperations } from '$lib/services/domain/task';
  import { taskInteractions } from '$lib/services/ui/task';
  import type { TaskStatus, TaskWithSubTasks } from '$lib/types/task';
  import { subTaskOperations } from '$lib/services/domain/subtask';
  import { selectionStore } from '$lib/stores/selection-store.svelte';
  import { createTaskDetailActions } from '$lib/services/ui/task-detail/task-detail-actions';

  const subTaskMutations = subTaskOperations;
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
    selectTask: (taskId: string | null) => selectionStore.selectTask(taskId),
    selectSubTask: (subTaskId: string | null) => selectionStore.selectSubTask(subTaskId),
    forceSelectTask,
    forceSelectSubTask,
    changeTaskStatus: (taskId: string, status: TaskStatus) =>
      taskOperations.changeTaskStatus(taskId, status),
    changeSubTaskStatus: (subTaskId: string, status: TaskStatus) =>
      subTaskMutations.changeSubTaskStatus(subTaskId, status),
    deleteTask: (taskId: string) => taskOperations.deleteTask(taskId),
    deleteSubTask: (subTaskId: string) => subTaskMutations.deleteSubTask(subTaskId),
    toggleSubTaskStatus: (task: TaskWithSubTasks, subTaskId: string) =>
      subTaskMutations.toggleSubTaskStatus(task, subTaskId),
    addSubTask: (taskId: string, data: { title: string }) =>
      subTaskMutations.addSubTask(taskId, data),
    moveTaskToList: (taskId: string, taskListId: string) =>
      taskOperations.moveTaskToList(taskId, taskListId)
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
      onTitleChange={(title) => detailActions.handleTitleChange(title)}
      onDescriptionChange={(description) => detailActions.handleDescriptionChange(description)}
      onPriorityChange={(priority) => detailActions.handlePriorityChange(priority)}
      onStatusChange={(event) => detailActions.handleStatusChange(event)}
      onDueDateClick={(event) => detailActions.handleDueDateClick(event)}
      onFormChange={() => detailActions.handleFormChange()}
      onDelete={() => detailActions.handleDelete()}
      onSaveNewTask={() => detailActions.handleSaveNewTask()}
      onSubTaskClick={(subTaskId) => detailActions.handleSubTaskClick(subTaskId)}
      onSubTaskToggle={(subTaskId) => detailActions.handleSubTaskToggle(subTaskId)}
      onAddSubTask={() => detailActions.handleAddSubTask()}
      showSubTaskAddForm={detailStore.showSubTaskAddForm}
      onSubTaskAdded={(title) => detailActions.handleSubTaskAdded(title)}
      onSubTaskAddCancel={() => detailActions.handleSubTaskAddCancel()}
      onGoToParentTask={() => detailActions.handleGoToParentTask()}
      onProjectTaskListEdit={() => detailActions.handleProjectTaskListEdit()}
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
      onTitleChange={(title) => detailActions.handleTitleChange(title)}
      onDescriptionChange={(description) => detailActions.handleDescriptionChange(description)}
      onPriorityChange={(priority) => detailActions.handlePriorityChange(priority)}
      onStatusChange={(event) => detailActions.handleStatusChange(event)}
      onDueDateClick={(event) => detailActions.handleDueDateClick(event)}
      onFormChange={() => detailActions.handleFormChange()}
      onDelete={() => detailActions.handleDelete()}
      onSaveNewTask={() => detailActions.handleSaveNewTask()}
      onSubTaskClick={(subTaskId) => detailActions.handleSubTaskClick(subTaskId)}
      onSubTaskToggle={(subTaskId) => detailActions.handleSubTaskToggle(subTaskId)}
      onAddSubTask={() => detailActions.handleAddSubTask()}
      showSubTaskAddForm={detailStore.showSubTaskAddForm}
      onSubTaskAdded={(title) => detailActions.handleSubTaskAdded(title)}
      onSubTaskAddCancel={() => detailActions.handleSubTaskAddCancel()}
      onGoToParentTask={() => detailActions.handleGoToParentTask()}
      onProjectTaskListEdit={() => detailActions.handleProjectTaskListEdit()}
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
  onDateChange={(data) => detailActions.handleDateChange(data)}
  onDateClear={() => detailActions.handleDateClear()}
  onDatePickerClose={() => detailActions.handleDatePickerClose()}
  onConfirmDiscard={() => detailActions.handleConfirmDiscard()}
  onCancelDiscard={() => detailActions.handleCancelDiscard()}
  onConfirmDelete={() => detailActions.handleConfirmDelete()}
  onCancelDelete={() => detailActions.handleCancelDelete()}
  onProjectTaskListChange={(data) => detailActions.handleProjectTaskListChange(data)}
  onProjectTaskListDialogClose={() => detailActions.handleProjectTaskListDialogClose()}
  onRecurrenceChange={(rule) => detailActions.handleRecurrenceChange(rule)}
  onRecurrenceDialogClose={(open) => detailActions.handleRecurrenceDialogClose(open)}
/>
