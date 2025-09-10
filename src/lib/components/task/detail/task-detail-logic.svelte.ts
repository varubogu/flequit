import { taskStore } from '$lib/stores/tasks.svelte';
import type { TaskStatus } from '$lib/types/task';
import type { RecurrenceRule } from '$lib/types/datetime-calendar';
import { TaskService } from '$lib/services/task-service';
import { getTranslationService } from '$lib/stores/locale.svelte';
import { SvelteDate } from 'svelte/reactivity';

export class TaskDetailLogic {
  // Core derived states
  task = $derived(taskStore.selectedTask);
  subTask = $derived(taskStore.selectedSubTask);
  currentItem = $derived(
    this.task || this.subTask || (taskStore.isNewTaskMode ? taskStore.newTaskData : null)
  );
  isSubTask = $derived(!!this.subTask);
  isNewTaskMode = $derived(taskStore.isNewTaskMode);

  // Form state
  editForm = $state({
    title: '',
    description: '',
    plan_start_date: undefined as Date | undefined,
    plan_end_date: undefined as Date | undefined,
    is_range_date: false,
    priority: 0
  });

  // UI states
  showDatePicker = $state(false);
  datePickerPosition = $state({ x: 0, y: 0 });
  showConfirmationDialog = $state(false);
  showDeleteDialog = $state(false);
  showProjectTaskListDialog = $state(false);
  showRecurrenceDialog = $state(false);
  showSubTaskAddForm = $state(false);

  // Action states
  pendingAction = $state<(() => void) | null>(null);
  pendingDeleteAction = $state<(() => void) | null>(null);
  deleteDialogTitle = $state('');
  deleteDialogMessage = $state('');

  private saveTimeout: ReturnType<typeof setTimeout> | null = null;
  private translationService = getTranslationService();

  constructor() {
    // Watch for pending selections from taskStore
    $effect(() => {
      if (taskStore.pendingTaskSelection) {
        const taskId = taskStore.pendingTaskSelection;
        this.showConfirmationIfNeeded(() => {
          TaskService.forceSelectTask(taskId);
          taskStore.clearPendingSelections();
        });
      }
    });

    $effect(() => {
      if (taskStore.pendingSubTaskSelection) {
        const subTaskId = taskStore.pendingSubTaskSelection;
        this.showConfirmationIfNeeded(() => {
          TaskService.forceSelectSubTask(subTaskId);
          taskStore.clearPendingSelections();
        });
      }
    });

    // Sync form with current item
    $effect(() => {
      if (this.currentItem) {
        this.editForm = {
          title: this.currentItem.title,
          description: this.currentItem.description || '',
          plan_start_date: this.currentItem.plan_start_date,
          plan_end_date: this.currentItem.plan_end_date,
          is_range_date: this.currentItem.is_range_date || false,
          priority: this.currentItem.priority || 0
        };
      }
    });
  }

  // Project info getter
  getProjectInfo() {
    if (this.isNewTaskMode || !this.currentItem) return null;
    if (this.isSubTask && 'task_id' in this.currentItem) {
      return taskStore.getTaskProjectAndList(this.currentItem.task_id);
    } else {
      return taskStore.getTaskProjectAndList(this.currentItem.id);
    }
  }

  // Form handling
  debouncedSave() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      if (this.currentItem) {
        const updates = {
          title: this.editForm.title,
          description: this.editForm.description || undefined,
          priority: this.editForm.priority,
          plan_start_date: this.editForm.plan_start_date,
          plan_end_date: this.editForm.plan_end_date,
          is_range_date: this.editForm.is_range_date
        };

        if (this.isNewTaskMode) {
          taskStore.updateNewTaskData(updates);
        } else if (this.isSubTask) {
          taskStore.updateSubTask(this.currentItem.id, updates);
        } else {
          taskStore.updateTask(this.currentItem.id, updates);
        }
      }
    }, 500);
  }

  handleFormChange() {
    this.debouncedSave();
  }

  handleTitleChange(title: string) {
    this.editForm.title = title;
    this.handleFormChange();
  }

  handleDescriptionChange(description: string) {
    this.editForm.description = description;
    this.handleFormChange();
  }

  handlePriorityChange(priority: number) {
    this.editForm.priority = priority;
  }

  // Status handling
  handleStatusChange(event: Event) {
    if (!this.currentItem) return;
    const target = event.target as HTMLSelectElement;

    if (this.isNewTaskMode) {
      taskStore.updateNewTaskData({ status: target.value as TaskStatus });
    } else if (this.isSubTask) {
      TaskService.changeSubTaskStatus(this.currentItem.id, target.value as TaskStatus);
    } else {
      TaskService.changeTaskStatus(this.currentItem.id, target.value as TaskStatus);
    }
  }

  // Date handling
  handleDueDateClick(event?: Event) {
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
  }

  handleDateChange(data: {
    date: string;
    dateTime: string;
    range?: { start: string; end: string };
    isRangeDate: boolean;
  }) {
    const { dateTime, range, isRangeDate } = data;

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

    this.debouncedSave();
  }

  handleDateClear() {
    this.editForm = {
      ...this.editForm,
      plan_start_date: undefined,
      plan_end_date: undefined,
      is_range_date: false
    };
    this.debouncedSave();
  }

  handleDatePickerClose() {
    this.showDatePicker = false;
  }

  // Task actions
  handleDelete() {
    if (!this.currentItem) return;
    if (this.isNewTaskMode) {
      taskStore.cancelNewTaskMode();
      return;
    }

    const currentItem = this.currentItem; // Type guard to satisfy TypeScript

    if (this.isSubTask) {
      this.deleteDialogTitle = this.translationService.getMessage('delete_subtask_title')();
      this.deleteDialogMessage = this.translationService.getMessage('delete_subtask_message')();
      this.pendingDeleteAction = () => TaskService.deleteSubTask(currentItem.id);
    } else {
      this.deleteDialogTitle = this.translationService.getMessage('delete_task_title')();
      this.deleteDialogMessage = this.translationService.getMessage('delete_task_message')();
      this.pendingDeleteAction = () => TaskService.deleteTask(currentItem.id);
    }

    this.showDeleteDialog = true;
  }

  async handleSaveNewTask() {
    if (!this.isNewTaskMode) return;
    const newTaskId = await taskStore.saveNewTask();
    if (newTaskId) {
      TaskService.selectTask(newTaskId);
    }
  }

  handleSubTaskToggle(subTaskId: string) {
    if (!this.task) return;
    TaskService.toggleSubTaskStatus(this.task, subTaskId);
  }

  handleSubTaskClick(subTaskId: string) {
    TaskService.selectSubTask(subTaskId);
  }

  handleAddSubTask() {
    this.showSubTaskAddForm = !this.showSubTaskAddForm;
  }

  async handleSubTaskAdded(title: string) {
    if (!this.task || !title.trim()) return;

    const newSubTask = await TaskService.addSubTask(this.task.id, {
      title: title.trim()
    });

    if (newSubTask) {
      this.showSubTaskAddForm = false;
      // サブタスクは連続入力することが多いため、自動選択はしない
      // タスク詳細画面は現在のメインタスクを維持
    }
  }

  handleSubTaskAddCancel() {
    this.showSubTaskAddForm = false;
  }

  handleGoToParentTask() {
    if (this.isSubTask && this.currentItem && 'task_id' in this.currentItem) {
      TaskService.selectTask(this.currentItem.task_id);
    }
  }

  // Project/TaskList handling
  handleProjectTaskListEdit() {
    this.showProjectTaskListDialog = true;
  }

  async handleProjectTaskListChange(data: { projectId: string; taskListId: string }) {
    if (!this.currentItem || this.isNewTaskMode) return;

    if (this.isSubTask) {
      if ('task_id' in this.currentItem) {
        await taskStore.moveTaskToList(this.currentItem.task_id, data.taskListId);
      }
    } else {
      await taskStore.moveTaskToList(this.currentItem.id, data.taskListId);
    }
    this.showProjectTaskListDialog = false;
  }

  handleProjectTaskListDialogClose() {
    this.showProjectTaskListDialog = false;
  }

  // Confirmation handling
  showConfirmationIfNeeded(action: () => void): boolean {
    if (this.isNewTaskMode && this.editForm.title.trim()) {
      this.pendingAction = action;
      this.showConfirmationDialog = true;
      return false;
    }
    action();
    return true;
  }

  handleConfirmDiscard() {
    this.showConfirmationDialog = false;
    if (this.pendingAction) {
      this.pendingAction();
      this.pendingAction = null;
    }
  }

  handleCancelDiscard() {
    this.showConfirmationDialog = false;
    this.pendingAction = null;
    taskStore.clearPendingSelections();
  }

  handleConfirmDelete() {
    this.showDeleteDialog = false;
    if (this.pendingDeleteAction) {
      this.pendingDeleteAction();
      this.pendingDeleteAction = null;
    }
  }

  handleCancelDelete() {
    this.showDeleteDialog = false;
    this.pendingDeleteAction = null;
  }

  // Recurrence handling
  handleRecurrenceChange(rule: RecurrenceRule | null) {
    if (!this.currentItem || this.isNewTaskMode) return;

    const updates = { recurrence_rule: rule || undefined };

    if (this.isSubTask) {
      taskStore.updateSubTask(this.currentItem.id, updates);
    } else {
      taskStore.updateTask(this.currentItem.id, updates);
    }

    this.showRecurrenceDialog = false;
  }

  handleRecurrenceDialogClose() {
    this.showRecurrenceDialog = false;
  }
}
