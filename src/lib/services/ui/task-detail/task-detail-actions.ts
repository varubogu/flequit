import type {
  DateChangePayload,
  ProjectTaskListChangePayload,
  TaskDetailDomainActions,
  TaskDetailRecurrenceActions
} from '$lib/stores/task-detail/task-detail-types';
import type { TaskDetailViewStore } from '$lib/stores/task-detail-view-store.svelte';
import type { TaskStatus } from '$lib/types/task';
import type { TaskInteractionsService } from '$lib/services/ui/task/task-interactions';
import { isSubTask } from './task-detail-guards';
import {
  handleRecurrenceDialogCloseImpl,
  handleRecurrenceDialogOpenImpl,
  handleRecurrenceChangeImpl
} from './task-detail-recurrence-handlers';
import {
  handleDueDateClickImpl,
  handleDateChangeImpl,
  handleDateClearImpl,
  handleDatePickerCloseImpl
} from './task-detail-date-handlers';
import {
  handleSubTaskToggleImpl,
  handleSubTaskClickImpl,
  handleAddSubTaskImpl,
  handleSubTaskAddedImpl,
  handleSubTaskAddCancelImpl
} from './task-detail-subtask-handlers';

export type TaskDetailActionsDependencies = {
  store: TaskDetailViewStore;
  domain: TaskDetailDomainActions;
  recurrence: TaskDetailRecurrenceActions;
  interactions: Pick<
    TaskInteractionsService,
    'cancelNewTaskMode' | 'saveNewTask' | 'updateNewTaskData'
  >;
};

export class TaskDetailActionsService {
  #store: TaskDetailViewStore;
  #domain: TaskDetailDomainActions;
  #recurrence: TaskDetailRecurrenceActions;
  #interactions: TaskDetailActionsDependencies['interactions'];

  constructor({ store, domain, recurrence, interactions }: TaskDetailActionsDependencies) {
    this.#store = store;
    this.#domain = domain;
    this.#recurrence = recurrence;
    this.#interactions = interactions;
  }

  handleFormChange = () => {
    this.#store.form.queueSave();
  };

  handleTitleChange = (title: string) => {
    this.#store.form.handleTitleChange(title);
  };

  handleDescriptionChange = (description: string) => {
    this.#store.form.handleDescriptionChange(description);
  };

  handlePriorityChange = (priority: number) => {
    this.#store.form.handlePriorityChange(priority);
  };

  handleStatusChange = (event: Event) => {
    const current = this.#store.currentItem;
    if (!current) return;

    const target = event.target as HTMLSelectElement;
    const status = target.value as TaskStatus;

    if (this.#store.isNewTaskMode) {
      this.#interactions.updateNewTaskData({ status });
      return;
    }

    if (isSubTask(current)) {
      this.#domain.changeSubTaskStatus(current.id, status);
      return;
    }

    this.#domain.changeTaskStatus(current.id, status);
  };

  handleDueDateClick = (event?: Event) => handleDueDateClickImpl(this.#store, event);

  handleDateChange = async (data: DateChangePayload) =>
    handleDateChangeImpl(this.#store, data, this.handleRecurrenceChange);

  handleDateClear = () => handleDateClearImpl(this.#store);

  handleDatePickerClose = () => handleDatePickerCloseImpl(this.#store);

  handleDelete = () => {
    const current = this.#store.currentItem;
    if (!current) {
      return;
    }

    if (this.#store.isNewTaskMode) {
      this.#interactions.cancelNewTaskMode();
      return;
    }

    this.#store.dialogs.openDeleteDialog(this.#store.isSubTask, current.id);
  };

  handleSaveNewTask = async () => {
    if (!this.#store.isNewTaskMode) return;
    const newTaskId = await this.#interactions.saveNewTask();
    if (newTaskId) {
      this.#domain.selectTask(newTaskId);
    }
  };

  handleSubTaskToggle = (subTaskId: string) =>
    handleSubTaskToggleImpl(this.#store, this.#domain, subTaskId);

  handleSubTaskClick = (subTaskId: string) => handleSubTaskClickImpl(this.#domain, subTaskId);

  handleAddSubTask = () => handleAddSubTaskImpl(this.#store);

  handleSubTaskAdded = async (title: string) =>
    handleSubTaskAddedImpl(this.#store, this.#domain, title);

  handleSubTaskAddCancel = () => handleSubTaskAddCancelImpl(this.#store);

  handleGoToParentTask = () => {
    const current = this.#store.currentItem;
    if (isSubTask(current)) {
      const parentTaskId = current.taskId;

      // Note: In the current data model, tasks cannot be nested as subtasks of other tasks.
      // If this changes in the future, we would need to check if the parent task is itself
      // a subtask and expand its parent task accordingly.

      // Select parent task - this will automatically show it in the task detail view
      this.#domain.selectTask(parentTaskId);
    }
  };

  handleProjectTaskListEdit = () => {
    this.#store.dialogs.openProjectTaskListDialog();
  };

  handleProjectTaskListChange = async (data: ProjectTaskListChangePayload) => {
    const current = this.#store.currentItem;
    if (!current || this.#store.isNewTaskMode) return;

    if (isSubTask(current)) {
      await this.#domain.moveTaskToList(current.taskId, data.taskListId);
    } else {
      await this.#domain.moveTaskToList(current.id, data.taskListId);
    }

    this.#store.dialogs.closeProjectTaskListDialog();
  };

  handleProjectTaskListDialogClose = () => {
    this.#store.dialogs.closeProjectTaskListDialog();
  };

  handleConfirmDiscard = () => {
    this.#store.dialogs.confirmDiscard();
  };

  handleCancelDiscard = () => {
    this.#store.dialogs.cancelDiscard();
  };

  handleConfirmDelete = () => {
    this.#store.dialogs.confirmDelete();
  };

  handleCancelDelete = () => {
    this.#store.dialogs.cancelDelete();
  };

  handleRecurrenceDialogClose = (open?: boolean) =>
    handleRecurrenceDialogCloseImpl(this.#store, open);

  handleRecurrenceDialogOpen = () => handleRecurrenceDialogOpenImpl(this.#store);

  handleRecurrenceChange = async (
    rule: Parameters<TaskDetailRecurrenceActions['save']>[0]['rule']
  ) => handleRecurrenceChangeImpl(this.#store, this.#recurrence, rule);
}

export function createTaskDetailActions(deps: TaskDetailActionsDependencies) {
  return new TaskDetailActionsService(deps);
}
