import { getTranslationService } from '$lib/stores/locale.svelte';
import { getBackendService } from '$lib/infrastructure/backends/index';
import { SvelteDate } from 'svelte/reactivity';
import type { TaskStatus } from '$lib/types/task';
import type { RecurrenceRule } from '$lib/types/recurrence';
import type { RecurrenceRule as LegacyRecurrenceRule } from '$lib/types/datetime-calendar';
import {
  fromLegacyRecurrenceRule,
  toLegacyRecurrenceRule
} from '$lib/utils/recurrence-converter';
import { taskStore } from '$lib/stores/tasks.svelte';
import { taskCoreStore } from '$lib/stores/task-core-store.svelte';
import { subTaskStore } from '$lib/stores/sub-task-store.svelte';
import type { TaskWithSubTasks } from '$lib/types/task';

type EditFormState = {
  title: string;
  description: string;
  plan_start_date: Date | undefined;
  plan_end_date: Date | undefined;
  is_range_date: boolean;
  priority: number;
  recurrenceRule: RecurrenceRule | undefined;
};

type DateChangePayload = {
  date: string;
  dateTime: string;
  range?: { start: string; end: string };
  isRangeDate: boolean;
  recurrenceRule?: LegacyRecurrenceRule | null;
};

type ProjectTaskListChangePayload = {
  projectId: string;
  taskListId: string;
};

export type TaskDetailDomainActions = {
  selectTask: (taskId: string) => void;
  selectSubTask: (subTaskId: string) => void;
  forceSelectTask: (taskId: string) => void;
  forceSelectSubTask: (subTaskId: string) => void;
  changeTaskStatus: (taskId: string, status: TaskStatus) => void;
  changeSubTaskStatus: (subTaskId: string, status: TaskStatus) => void;
  deleteTask: (taskId: string) => void;
  deleteSubTask: (subTaskId: string) => void;
  toggleSubTaskStatus: (task: TaskWithSubTasks, subTaskId: string) => void;
  addSubTask: (taskId: string, data: { title: string }) => Promise<unknown>;
};

type TaskDetailViewStoreOptions = {
  actions: TaskDetailDomainActions;
};

export class TaskDetailViewStore {
  #actions: TaskDetailDomainActions;
  #saveTimeout: ReturnType<typeof setTimeout> | null = null;
  #translationService = getTranslationService();

  task = $derived(taskStore.selectedTask);
  subTask = $derived(taskStore.selectedSubTask);
  isSubTask = $derived(!!this.subTask);
  isNewTaskMode = $derived(taskStore.isNewTaskMode);
  currentItem = $derived(
    this.task || this.subTask || (this.isNewTaskMode ? taskStore.newTaskData : null)
  );
  selectedSubTaskId = $derived(taskStore.selectedSubTaskId);

  editForm = $state<EditFormState>({
    title: '',
    description: '',
    plan_start_date: undefined,
    plan_end_date: undefined,
    is_range_date: false,
    priority: 0,
    recurrenceRule: undefined
  });

  editFormForUI = $derived.by(() => ({
    title: this.editForm.title,
    description: this.editForm.description,
    plan_start_date: this.editForm.plan_start_date,
    plan_end_date: this.editForm.plan_end_date,
    is_range_date: this.editForm.is_range_date,
    priority: this.editForm.priority,
    recurrenceRule: toLegacyRecurrenceRule(this.editForm.recurrenceRule)
  }));

  projectInfo = $derived.by(() => {
    if (this.isNewTaskMode || !this.currentItem) return null;
    if (this.isSubTask && 'taskId' in this.currentItem) {
      return taskStore.getTaskProjectAndList(this.currentItem.taskId);
    }
    return taskStore.getTaskProjectAndList(this.currentItem.id);
  });

  showDatePicker = $state(false);
  datePickerPosition = $state({ x: 0, y: 0 });
  showConfirmationDialog = $state(false);
  showDeleteDialog = $state(false);
  showProjectTaskListDialog = $state(false);
  showRecurrenceDialog = $state(false);
  showSubTaskAddForm = $state(false);

  pendingAction = $state<(() => void) | null>(null);
  pendingDeleteAction = $state<(() => void) | null>(null);
  deleteDialogTitle = $state('');
  deleteDialogMessage = $state('');

  lastSyncedItemId = $state<string | undefined>(undefined);

  constructor({ actions }: TaskDetailViewStoreOptions) {
    this.#actions = actions;
    $effect(() => {
      const pendingTaskSelection = taskStore.pendingTaskSelection;
      if (pendingTaskSelection) {
        this.showConfirmationIfNeeded(() => {
          this.#actions.forceSelectTask(pendingTaskSelection);
          taskStore.clearPendingSelections();
        });
      }
    });

    $effect(() => {
      const pendingSubTaskSelection = taskStore.pendingSubTaskSelection;
      if (pendingSubTaskSelection) {
        this.showConfirmationIfNeeded(() => {
          this.#actions.forceSelectSubTask(pendingSubTaskSelection);
          taskStore.clearPendingSelections();
        });
      }
    });

    $effect(() => {
      const itemId = this.currentItem?.id;
      if (this.currentItem && itemId !== this.lastSyncedItemId) {
        this.lastSyncedItemId = itemId;
        this.editForm = {
          title: this.currentItem.title,
          description: this.currentItem.description || '',
          plan_start_date: this.currentItem.planStartDate,
          plan_end_date: this.currentItem.planEndDate,
          is_range_date: this.currentItem.isRangeDate || false,
          priority: this.currentItem.priority || 0,
          recurrenceRule: fromLegacyRecurrenceRule(this.currentItem.recurrenceRule)
        };
      } else if (!this.currentItem) {
        this.lastSyncedItemId = undefined;
      }
    });
  }

  dispose() {
    if (this.#saveTimeout) {
      clearTimeout(this.#saveTimeout);
      this.#saveTimeout = null;
    }
  }

  private scheduleSave() {
    if (this.#saveTimeout) {
      clearTimeout(this.#saveTimeout);
    }

    this.#saveTimeout = setTimeout(() => {
      if (!this.currentItem) return;

      const updates = {
        title: this.editForm.title,
        description: this.editForm.description || undefined,
        priority: this.editForm.priority,
        planStartDate: this.editForm.plan_start_date,
        planEndDate: this.editForm.plan_end_date,
        isRangeDate: this.editForm.is_range_date,
        recurrenceRule: toLegacyRecurrenceRule(this.editForm.recurrenceRule)
      };

      if (this.isNewTaskMode) {
        taskStore.updateNewTaskData(updates);
      } else if (this.isSubTask && this.currentItem) {
        subTaskStore.updateSubTask(this.currentItem.id, updates);
      } else if (this.currentItem) {
        taskCoreStore.updateTask(this.currentItem.id, updates);
      }
    }, 500);
  }

  private saveImmediately() {
    if (this.#saveTimeout) {
      clearTimeout(this.#saveTimeout);
      this.#saveTimeout = null;
    }

    if (!this.currentItem) return;

    const updates = {
      title: this.editForm.title,
      description: this.editForm.description || undefined,
      priority: this.editForm.priority,
      planStartDate: this.editForm.plan_start_date,
      planEndDate: this.editForm.plan_end_date,
      isRangeDate: this.editForm.is_range_date,
      recurrenceRule: toLegacyRecurrenceRule(this.editForm.recurrenceRule)
    };

    if (this.isNewTaskMode) {
      taskStore.updateNewTaskData(updates);
    } else if (this.isSubTask && this.currentItem) {
      subTaskStore.updateSubTask(this.currentItem.id, updates);
    } else if (this.currentItem) {
      taskCoreStore.updateTask(this.currentItem.id, updates);
    }
  }

  handleFormChange = () => {
    this.scheduleSave();
  };

  handleTitleChange = (title: string) => {
    this.editForm.title = title;
    this.handleFormChange();
  };

  handleDescriptionChange = (description: string) => {
    this.editForm.description = description;
    this.handleFormChange();
  };

  handlePriorityChange = (priority: number) => {
    this.editForm.priority = priority;
  };

  handleStatusChange = (event: Event) => {
    if (!this.currentItem) return;
    const target = event.target as HTMLSelectElement;
    const status = target.value as TaskStatus;

    if (this.isNewTaskMode) {
      taskStore.updateNewTaskData({ status });
    } else if (this.isSubTask) {
      this.#actions.changeSubTaskStatus(this.currentItem.id, status);
    } else {
      this.#actions.changeTaskStatus(this.currentItem.id, status);
    }
  };

  handleDueDateClick = (event?: Event) => {
    event?.preventDefault();
    event?.stopPropagation();

    const rect = event?.target
      ? (event.target as HTMLElement).getBoundingClientRect()
      : { left: 0, bottom: 0 };

    this.datePickerPosition = {
      x: Math.min(rect.left, window.innerWidth - 300),
      y: rect.bottom + 8
    };
    this.showDatePicker = true;
  };

  handleDateChange = async (data: DateChangePayload) => {
    const { dateTime, range, isRangeDate, recurrenceRule } = data;

    if (isRangeDate) {
      if (range) {
        this.editForm = {
          ...this.editForm,
          plan_start_date: new SvelteDate(range.start),
          plan_end_date: new SvelteDate(range.end),
          is_range_date: true
        };
      } else {
        const currentEndDate = this.editForm.plan_end_date || new SvelteDate(dateTime);
        this.editForm = {
          ...this.editForm,
          plan_start_date: currentEndDate,
          plan_end_date: currentEndDate,
          is_range_date: true
        };
      }
    } else {
      this.editForm = {
        ...this.editForm,
        plan_end_date: new SvelteDate(dateTime),
        plan_start_date: undefined,
        is_range_date: false
      };
    }

    if (recurrenceRule !== undefined) {
      this.editForm = {
        ...this.editForm,
        recurrenceRule: fromLegacyRecurrenceRule(recurrenceRule)
      };
      await this.handleRecurrenceChange(recurrenceRule);
    }

    this.saveImmediately();
  };

  handleDateClear = () => {
    this.editForm = {
      ...this.editForm,
      plan_start_date: undefined,
      plan_end_date: undefined,
      is_range_date: false
    };
    this.saveImmediately();
  };

  handleDatePickerClose = () => {
    this.showDatePicker = false;
  };

  handleDelete = () => {
    if (!this.currentItem) return;
    if (this.isNewTaskMode) {
      taskStore.cancelNewTaskMode();
      return;
    }

    if (this.isSubTask) {
      this.deleteDialogTitle = this.#translationService.getMessage('delete_subtask_title')();
      this.deleteDialogMessage = this.#translationService.getMessage('delete_subtask_message')();
      this.pendingDeleteAction = () => this.#actions.deleteSubTask(this.currentItem!.id);
    } else {
      this.deleteDialogTitle = this.#translationService.getMessage('delete_task_title')();
      this.deleteDialogMessage = this.#translationService.getMessage('delete_task_message')();
      this.pendingDeleteAction = () => this.#actions.deleteTask(this.currentItem!.id);
    }

    this.showDeleteDialog = true;
  };

  handleSaveNewTask = async () => {
    if (!this.isNewTaskMode) return;
    const newTaskId = await taskStore.saveNewTask();
    if (newTaskId) {
      this.#actions.selectTask(newTaskId);
    }
  };

  handleSubTaskToggle = (subTaskId: string) => {
    if (!this.task) return;
    this.#actions.toggleSubTaskStatus(this.task, subTaskId);
  };

  handleSubTaskClick = (subTaskId: string) => {
    this.#actions.selectSubTask(subTaskId);
  };

  handleAddSubTask = () => {
    this.showSubTaskAddForm = !this.showSubTaskAddForm;
  };

  handleSubTaskAdded = async (title: string) => {
    if (!this.task || !title.trim()) return;

    const newSubTask = await this.#actions.addSubTask(this.task.id, {
      title: title.trim()
    });

    if (newSubTask) {
      this.showSubTaskAddForm = false;
    }
  };

  handleSubTaskAddCancel = () => {
    this.showSubTaskAddForm = false;
  };

  handleGoToParentTask = () => {
    if (this.isSubTask && this.currentItem && 'taskId' in this.currentItem) {
      this.#actions.selectTask(this.currentItem.taskId);
    }
  };

  handleProjectTaskListEdit = () => {
    this.showProjectTaskListDialog = true;
  };

  handleProjectTaskListChange = async (data: ProjectTaskListChangePayload) => {
    if (!this.currentItem || this.isNewTaskMode) return;

    if (this.isSubTask && 'taskId' in this.currentItem) {
      await taskCoreStore.moveTaskToList(this.currentItem.taskId, data.taskListId);
    } else {
      await taskCoreStore.moveTaskToList(this.currentItem.id, data.taskListId);
    }
    this.showProjectTaskListDialog = false;
  };

  handleProjectTaskListDialogClose = () => {
    this.showProjectTaskListDialog = false;
  };

  private showConfirmationIfNeeded(action: () => void): boolean {
    if (this.isNewTaskMode && this.editForm.title.trim()) {
      this.pendingAction = action;
      this.showConfirmationDialog = true;
      return false;
    }
    action();
    return true;
  }

  handleConfirmDiscard = () => {
    this.showConfirmationDialog = false;
    if (this.pendingAction) {
      this.pendingAction();
      this.pendingAction = null;
    }
  };

  handleCancelDiscard = () => {
    this.showConfirmationDialog = false;
    this.pendingAction = null;
    taskStore.clearPendingSelections();
  };

  handleConfirmDelete = () => {
    this.showDeleteDialog = false;
    if (this.pendingDeleteAction) {
      this.pendingDeleteAction();
      this.pendingDeleteAction = null;
    }
  };

  handleCancelDelete = () => {
    this.showDeleteDialog = false;
    this.pendingDeleteAction = null;
  };

  handleRecurrenceDialogClose = (open?: boolean) => {
    if (typeof open === 'boolean') {
      this.showRecurrenceDialog = open;
    } else {
      this.showRecurrenceDialog = false;
    }
  };

  handleRecurrenceChange = async (rule: LegacyRecurrenceRule | null) => {
    if (!this.currentItem || this.isNewTaskMode) {
      return;
    }

    const projectId = this.isSubTask && 'taskId' in this.currentItem
      ? taskStore.getTaskProjectAndList(this.currentItem.taskId)?.project.id
      : taskStore.getTaskProjectAndList(this.currentItem.id)?.project.id;

    if (!projectId) {
      console.error('Failed to get projectId for recurrence rule');
      return;
    }

    const unifiedRule = fromLegacyRecurrenceRule(rule);
    const backend = await getBackendService();

    try {
      if (rule === null) {
        if (this.isSubTask) {
          await backend.subtaskRecurrence.delete(projectId, this.currentItem.id);
        } else {
          await backend.taskRecurrence.delete(projectId, this.currentItem.id);
        }
      } else {
        const existing = this.isSubTask
          ? await backend.subtaskRecurrence.getBySubtaskId(projectId, this.currentItem.id)
          : await backend.taskRecurrence.getByTaskId(projectId, this.currentItem.id);

        if (existing) {
          await backend.recurrenceRule.update(projectId, {
            ...unifiedRule!,
            id: existing.recurrenceRuleId
          });
        } else {
          const ruleId = crypto.randomUUID();
          await backend.recurrenceRule.create(projectId, { ...unifiedRule!, id: ruleId });

          if (this.isSubTask) {
            await backend.subtaskRecurrence.create(projectId, {
              subtaskId: this.currentItem.id,
              recurrenceRuleId: ruleId
            });
          } else {
            await backend.taskRecurrence.create(projectId, {
              taskId: this.currentItem.id,
              recurrenceRuleId: ruleId
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to save recurrence rule:', error);
    }

    this.showRecurrenceDialog = false;
  };
}
