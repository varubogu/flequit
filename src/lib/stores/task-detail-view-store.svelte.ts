import { taskStore } from '$lib/stores/tasks.svelte';
import { taskCoreStore } from '$lib/stores/task-core-store.svelte';
import type { TaskWithSubTasks } from '$lib/types/task';
import type { TaskStatus } from '$lib/types/task';
import type { RecurrenceRule as LegacyRecurrenceRule } from '$lib/types/datetime-calendar';
import type {
  TaskDetailDomainActions,
  TaskDetailRecurrenceActions,
  DateChangePayload,
  ProjectTaskListChangePayload
} from './task-detail/task-detail-types';
import { TaskDetailViewState } from './task-detail/task-detail-view-state.svelte';
import { TaskEditFormStore } from './task-detail/task-edit-form-store.svelte';
import { TaskDetailDialogsStore } from './task-detail/task-detail-dialogs-store.svelte';

export type TaskDetailViewStoreOptions = {
  actions: TaskDetailDomainActions;
  recurrence: TaskDetailRecurrenceActions;
};

export class TaskDetailViewStore {
  #actions: TaskDetailDomainActions;
  #recurrence: TaskDetailRecurrenceActions;

  state: TaskDetailViewState;
  form: TaskEditFormStore;
  dialogs: TaskDetailDialogsStore;

  constructor({ actions, recurrence }: TaskDetailViewStoreOptions) {
    this.#actions = actions;
    this.#recurrence = recurrence;

    this.state = new TaskDetailViewState();
    this.form = new TaskEditFormStore(this.state);
    this.dialogs = new TaskDetailDialogsStore(this.state, this.#actions);
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

  handleFormChange = () => {
    this.form.queueSave();
  };

  handleTitleChange = (title: string) => {
    this.form.handleTitleChange(title);
  };

  handleDescriptionChange = (description: string) => {
    this.form.handleDescriptionChange(description);
  };

  handlePriorityChange = (priority: number) => {
    this.form.handlePriorityChange(priority);
  };

  handleStatusChange = (event: Event) => {
    const current = this.state.currentItem;
    if (!current) return;

    const target = event.target as HTMLSelectElement;
    const status = target.value as TaskStatus;

    if (this.state.isNewTaskMode) {
      taskStore.updateNewTaskData({ status });
    } else if (this.state.isSubTask) {
      this.#actions.changeSubTaskStatus(current.id, status);
    } else {
      this.#actions.changeTaskStatus(current.id, status);
    }
  };

  handleDueDateClick = (event?: Event) => {
    event?.preventDefault();
    event?.stopPropagation();

    const rect = event?.target
      ? (event.target as HTMLElement).getBoundingClientRect()
      : { left: 0, bottom: 0 };

    const position = {
      x: Math.min(rect.left, window.innerWidth - 300),
      y: rect.bottom + 8
    };

    this.dialogs.openDatePicker(position);
  };

  handleDateChange = async (data: DateChangePayload) => {
    const { dateTime, range, isRangeDate, recurrenceRule } = data;

    if (isRangeDate && range) {
      this.form.updateDates({ start: range.start, end: range.end, isRange: true });
    } else {
      this.form.updateDates({ end: dateTime, isRange: false });
    }

    if (recurrenceRule !== undefined) {
      this.form.updateRecurrence(recurrenceRule);
      await this.handleRecurrenceChange(recurrenceRule);
    }
  };

  handleDateClear = () => {
    this.form.clearDates();
  };

  handleDatePickerClose = () => {
    this.dialogs.closeDatePicker();
  };

  handleDelete = () => {
    const current = this.state.currentItem;
    if (!current) {
      return;
    }

    if (this.state.isNewTaskMode) {
      taskStore.cancelNewTaskMode();
      return;
    }

    this.dialogs.openDeleteDialog(this.state.isSubTask, current.id);
  };

  handleSaveNewTask = async () => {
    if (!this.state.isNewTaskMode) return;
    const newTaskId = await taskStore.saveNewTask();
    if (newTaskId) {
      this.#actions.selectTask(newTaskId);
    }
  };

  handleSubTaskToggle = (subTaskId: string) => {
    const task = this.state.task;
    if (!task) return;
    this.#actions.toggleSubTaskStatus(task, subTaskId);
  };

  handleSubTaskClick = (subTaskId: string) => {
    this.#actions.selectSubTask(subTaskId);
  };

  handleAddSubTask = () => {
    this.dialogs.toggleSubTaskAddForm();
  };

  handleSubTaskAdded = async (title: string) => {
    const task = this.state.task;
    if (!task || !title.trim()) return;

    const newSubTask = await this.#actions.addSubTask(task.id, {
      title: title.trim()
    });

    if (newSubTask) {
      this.dialogs.closeSubTaskAddForm();
    }
  };

  handleSubTaskAddCancel = () => {
    this.dialogs.closeSubTaskAddForm();
  };

  handleGoToParentTask = () => {
    const current = this.state.currentItem;
    if (this.state.isSubTask && current && 'taskId' in current) {
      this.#actions.selectTask(current.taskId);
    }
  };

  handleProjectTaskListEdit = () => {
    this.dialogs.openProjectTaskListDialog();
  };

  handleProjectTaskListChange = async (data: ProjectTaskListChangePayload) => {
    const current = this.state.currentItem;
    if (!current || this.state.isNewTaskMode) return;

    if (this.state.isSubTask && 'taskId' in current) {
      await taskCoreStore.moveTaskToList(current.taskId, data.taskListId);
    } else {
      await taskCoreStore.moveTaskToList(current.id, data.taskListId);
    }
    this.dialogs.closeProjectTaskListDialog();
  };

  handleProjectTaskListDialogClose = () => {
    this.dialogs.closeProjectTaskListDialog();
  };

  handleConfirmDiscard = () => {
    this.dialogs.confirmDiscard();
  };

  handleCancelDiscard = () => {
    this.dialogs.cancelDiscard();
  };

  handleConfirmDelete = () => {
    this.dialogs.confirmDelete();
  };

  handleCancelDelete = () => {
    this.dialogs.cancelDelete();
  };

  handleRecurrenceDialogClose = (open?: boolean) => {
    if (typeof open === 'boolean') {
      if (open) {
        this.dialogs.openRecurrenceDialog();
      } else {
        this.dialogs.closeRecurrenceDialog();
      }
    } else {
      this.dialogs.closeRecurrenceDialog();
    }
  };

  async handleRecurrenceChange(rule: LegacyRecurrenceRule | null) {
    const current = this.state.currentItem;
    if (!current || this.state.isNewTaskMode) {
      return;
    }

    const projectInfo = this.state.projectInfo;
    const projectId = projectInfo?.project.id;

    if (!projectId) {
      console.error('Failed to get projectId for recurrence rule');
      return;
    }

    try {
      await this.#recurrence.save({
        projectId,
        itemId: current.id,
        isSubTask: this.state.isSubTask,
        rule
      });
    } catch (error) {
      console.error('Failed to save recurrence rule:', error);
    }

    this.dialogs.closeRecurrenceDialog();
  }

  handleRecurrenceDialogOpen = () => {
    this.dialogs.openRecurrenceDialog();
  };
}
