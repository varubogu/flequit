import { TaskDetailDialogsStore } from '$lib/stores/task-detail/task-detail-dialogs-store.svelte';
import { TaskDetailViewState } from '$lib/stores/task-detail/task-detail-view-state.svelte';
import { TaskEditFormStore } from '$lib/stores/task-detail/task-edit-form-store.svelte';
import type { TaskDetailDomainActions } from './task-detail/task-detail-types';

export type TaskDetailViewStoreOptions = {
  actions: TaskDetailDomainActions;
};

export class TaskDetailViewStore {
  readonly state: TaskDetailViewState;
  readonly form: TaskEditFormStore;
  readonly dialogs: TaskDetailDialogsStore;

  constructor(options: TaskDetailViewStoreOptions) {
    this.state = new TaskDetailViewState();
    this.form = new TaskEditFormStore(this.state);
    this.dialogs = new TaskDetailDialogsStore(this.state, options.actions);
  }

  get task() {
    return this.state.task;
  }

  get subTask() {
    return this.state.subTask;
  }

  get isSubTask() {
    return this.state.isSubTask;
  }

  get isNewTaskMode() {
    return this.state.isNewTaskMode;
  }

  get currentItem() {
    return this.state.currentItem;
  }

  get selectedSubTaskId() {
    return this.state.selectedSubTaskId;
  }

  get projectInfo() {
    return this.state.projectInfo;
  }

  get editForm() {
    return this.form.editForm;
  }

  get editFormForUI() {
    return this.form.editFormForUI;
  }

  get showDatePicker() {
    return this.dialogs.showDatePicker;
  }

  get datePickerPosition() {
    return this.dialogs.datePickerPosition;
  }

  get showConfirmationDialog() {
    return this.dialogs.showConfirmationDialog;
  }

  get showDeleteDialog() {
    return this.dialogs.showDeleteDialog;
  }

  get deleteDialogTitle() {
    return this.dialogs.deleteDialogTitle;
  }

  get deleteDialogMessage() {
    return this.dialogs.deleteDialogMessage;
  }

  get showProjectTaskListDialog() {
    return this.dialogs.showProjectTaskListDialog;
  }

  get showRecurrenceDialog() {
    return this.dialogs.showRecurrenceDialog;
  }

  get showSubTaskAddForm() {
    return this.dialogs.showSubTaskAddForm;
  }

  dispose() {
    this.form.dispose();
    this.dialogs.dispose();
  }
}

export type {
  TaskDetailDomainActions,
  TaskDetailRecurrenceActions,
  DateChangePayload,
  ProjectTaskListChangePayload
} from './task-detail/task-detail-types';
