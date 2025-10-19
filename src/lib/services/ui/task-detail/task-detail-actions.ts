import type {
  DateChangePayload,
  ProjectTaskListChangePayload,
  TaskDetailDomainActions,
  TaskDetailRecurrenceActions
} from '$lib/stores/task-detail/task-detail-types';
import type { TaskDetailViewStore } from '$lib/stores/task-detail-view-store.svelte';
import type { TaskStatus } from '$lib/types/task';
import type { TaskInteractionsService } from '$lib/services/ui/task/task-interactions';
import type { TaskWithSubTasks } from '$lib/types/task';
import type { SubTask } from '$lib/types/sub-task';
import { isSubTask } from './task-detail-guards';

export type TaskDetailActionsDependencies = {
  store: TaskDetailViewStore;
  domain: TaskDetailDomainActions;
  recurrence: TaskDetailRecurrenceActions;
  interactions: Pick<TaskInteractionsService, 'cancelNewTaskMode' | 'saveNewTask' | 'updateNewTaskData'>;
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

    this.#store.dialogs.openDatePicker(position);
  };

  handleDateChange = async (data: DateChangePayload) => {
    const { dateTime, range, isRangeDate, recurrenceRule } = data;

    if (isRangeDate && range) {
      this.#store.form.updateDates({ start: range.start, end: range.end, isRange: true });
    } else {
      this.#store.form.updateDates({ end: dateTime, isRange: false });
    }

    if (recurrenceRule !== undefined) {
      this.#store.form.updateRecurrence(recurrenceRule ?? undefined);
      await this.handleRecurrenceChange(recurrenceRule ?? null);
    }
  };

  handleDateClear = () => {
    this.#store.form.clearDates();
  };

  handleDatePickerClose = () => {
    this.#store.dialogs.closeDatePicker();
  };

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

  handleSubTaskToggle = (subTaskId: string) => {
    const task = this.#store.task;
    if (!task) return;
    this.#domain.toggleSubTaskStatus(task, subTaskId);
  };

  handleSubTaskClick = (subTaskId: string) => {
    this.#domain.selectSubTask(subTaskId);
  };

  handleAddSubTask = () => {
    this.#store.dialogs.toggleSubTaskAddForm();
  };

  handleSubTaskAdded = async (title: string) => {
    const task = this.#store.task;
    if (!task || !title.trim()) return;

    const newSubTask = await this.#domain.addSubTask(task.id, { title: title.trim() });

    if (newSubTask) {
      this.#store.dialogs.closeSubTaskAddForm();
    }
  };

  handleSubTaskAddCancel = () => {
    this.#store.dialogs.closeSubTaskAddForm();
  };

  handleGoToParentTask = () => {
    const current = this.#store.currentItem;
    if (isSubTask(current)) {
      this.#domain.selectTask(current.taskId);
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

  handleRecurrenceDialogClose = (open?: boolean) => {
    if (typeof open === 'boolean') {
      if (open) {
        this.#store.dialogs.openRecurrenceDialog();
      } else {
        this.#store.dialogs.closeRecurrenceDialog();
      }
      return;
    }

    this.#store.dialogs.closeRecurrenceDialog();
  };

  handleRecurrenceDialogOpen = () => {
    this.#store.dialogs.openRecurrenceDialog();
  };

  handleRecurrenceChange = async (rule: Parameters<TaskDetailRecurrenceActions['save']>[0]['rule']) => {
    const current = this.#store.currentItem as TaskWithSubTasks | SubTask | null;
    if (!current || this.#store.isNewTaskMode) {
      return;
    }

    const projectInfo = this.#store.projectInfo;
    const projectId = projectInfo?.project.id;

    if (!projectId) {
      console.error('Failed to get projectId for recurrence rule');
      return;
    }

    try {
      await this.#recurrence.save({
        projectId,
        itemId: current.id,
        isSubTask: isSubTask(current),
        rule
      });
    } catch (error) {
      console.error('Failed to save recurrence rule:', error);
    }

    this.#store.dialogs.closeRecurrenceDialog();
  };
}

export function createTaskDetailActions(deps: TaskDetailActionsDependencies) {
  return new TaskDetailActionsService(deps);
}
