import { getTranslationService } from '$lib/stores/locale.svelte';
import { taskStore } from '$lib/stores/tasks.svelte';
import type { TaskDetailDomainActions } from './task-detail-types';
import type { TaskDetailViewState } from '$lib/stores/task-detail/task-detail-view-state.svelte';

export class TaskDetailDialogsStore {
  #viewState: TaskDetailViewState;
  #actions: TaskDetailDomainActions;
  #translationService = getTranslationService();

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

  constructor(viewState: TaskDetailViewState, actions: TaskDetailDomainActions) {
    this.#viewState = viewState;
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
  }

  dispose() {
    // noop for now, placeholder for future cleanup if needed
  }

  openDatePicker(position: { x: number; y: number }) {
    this.datePickerPosition = position;
    this.showDatePicker = true;
  }

  closeDatePicker() {
    this.showDatePicker = false;
  }

  openDeleteDialog(isSubTask: boolean, itemId: string) {
    if (isSubTask) {
      this.deleteDialogTitle = this.#translationService.getMessage('delete_subtask_title')();
      this.deleteDialogMessage = this.#translationService.getMessage('delete_subtask_message')();
      this.pendingDeleteAction = () => this.#actions.deleteSubTask(itemId);
    } else {
      this.deleteDialogTitle = this.#translationService.getMessage('delete_task_title')();
      this.deleteDialogMessage = this.#translationService.getMessage('delete_task_message')();
      this.pendingDeleteAction = () => this.#actions.deleteTask(itemId);
    }
    this.showDeleteDialog = true;
  }

  confirmDelete() {
    this.showDeleteDialog = false;
    this.pendingDeleteAction?.();
    this.pendingDeleteAction = null;
  }

  cancelDelete() {
    this.showDeleteDialog = false;
    this.pendingDeleteAction = null;
  }

  toggleSubTaskAddForm() {
    this.showSubTaskAddForm = !this.showSubTaskAddForm;
  }

  closeSubTaskAddForm() {
    this.showSubTaskAddForm = false;
  }

  openProjectTaskListDialog() {
    this.showProjectTaskListDialog = true;
  }

  closeProjectTaskListDialog() {
    this.showProjectTaskListDialog = false;
  }

  openRecurrenceDialog() {
    this.showRecurrenceDialog = true;
  }

  closeRecurrenceDialog() {
    this.showRecurrenceDialog = false;
  }

  showConfirmationIfNeeded(action: () => void): boolean {
    if (this.#viewState.isNewTaskMode && this.#viewState.currentItem?.title?.trim()) {
      this.pendingAction = action;
      this.showConfirmationDialog = true;
      return false;
    }
    action();
    return true;
  }

  confirmDiscard() {
    this.showConfirmationDialog = false;
    this.pendingAction?.();
    this.pendingAction = null;
  }

  cancelDiscard() {
    this.showConfirmationDialog = false;
    this.pendingAction = null;
    this.#viewState.clearPendingSelections();
  }
}
