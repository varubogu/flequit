import { SvelteDate } from 'svelte/reactivity';
import { subTaskStore } from '../sub-task-store.svelte';
import { taskStore, taskMutations } from '../tasks.svelte';
import { fromLegacyRecurrenceRule, toLegacyRecurrenceRule } from '$lib/utils/recurrence-converter';
import type { EditFormState } from './task-detail-types';
import type { TaskDetailViewState } from './task-detail-view-state.svelte';

const SAVE_DEBOUNCE_MS = 500;

export class TaskEditFormStore {
  #viewState: TaskDetailViewState;
  #saveTimeout: ReturnType<typeof setTimeout> | null = null;

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

  constructor(viewState: TaskDetailViewState) {
    this.#viewState = viewState;

    $effect(() => {
      const currentItem = this.#viewState.currentItem;
      const itemId = currentItem?.id;
      if (currentItem && itemId !== this.#viewState.lastSyncedTaskId) {
        this.#viewState.setLastSyncedTaskId(itemId);
        this.editForm = {
          title: currentItem.title,
          description: currentItem.description || '',
          plan_start_date: currentItem.planStartDate,
          plan_end_date: currentItem.planEndDate,
          is_range_date: currentItem.isRangeDate || false,
          priority: currentItem.priority || 0,
          recurrenceRule: fromLegacyRecurrenceRule(currentItem.recurrenceRule)
        };
      } else if (!currentItem) {
        this.#viewState.setLastSyncedTaskId(undefined);
      }
    });
  }

  dispose() {
    if (this.#saveTimeout) {
      clearTimeout(this.#saveTimeout);
      this.#saveTimeout = null;
    }
  }

  handleTitleChange = (title: string) => {
    this.editForm.title = title;
    this.scheduleSave();
  };

  handleDescriptionChange = (description: string) => {
    this.editForm.description = description;
    this.scheduleSave();
  };

  handlePriorityChange = (priority: number) => {
    this.editForm.priority = priority;
    this.scheduleSave();
  };

  updateDates(options: {
    start?: string;
    end?: string;
    isRange: boolean;
  }) {
    if (options.isRange) {
      this.editForm = {
        ...this.editForm,
        plan_start_date: options.start ? new SvelteDate(options.start) : undefined,
        plan_end_date: options.end ? new SvelteDate(options.end) : undefined,
        is_range_date: true
      };
    } else {
      this.editForm = {
        ...this.editForm,
        plan_start_date: undefined,
        plan_end_date: options.end ? new SvelteDate(options.end) : undefined,
        is_range_date: false
      };
    }
    this.saveImmediately();
  }

  clearDates() {
    this.editForm = {
      ...this.editForm,
      plan_start_date: undefined,
      plan_end_date: undefined,
      is_range_date: false
    };
    this.saveImmediately();
  }

  updateRecurrence(rule: import('$lib/types/datetime-calendar').RecurrenceRule | null) {
    this.editForm = {
      ...this.editForm,
      recurrenceRule: fromLegacyRecurrenceRule(rule)
    };
    this.saveImmediately();
  }

  private scheduleSave() {
    if (this.#saveTimeout) {
      clearTimeout(this.#saveTimeout);
    }

    this.#saveTimeout = setTimeout(() => {
      this.saveImmediately();
    }, SAVE_DEBOUNCE_MS);
  }

  queueSave() {
    this.scheduleSave();
  }

  saveImmediately() {
    const currentItem = this.#viewState.currentItem;
    if (!currentItem) return;

    const updates = {
      title: this.editForm.title,
      description: this.editForm.description || undefined,
      priority: this.editForm.priority,
      planStartDate: this.editForm.plan_start_date,
      planEndDate: this.editForm.plan_end_date,
      isRangeDate: this.editForm.is_range_date,
      recurrenceRule: toLegacyRecurrenceRule(this.editForm.recurrenceRule)
    };

    if (this.#viewState.isNewTaskMode) {
      taskStore.updateNewTaskData(updates);
    } else if (this.#viewState.isSubTask && currentItem) {
      subTaskStore.updateSubTask(currentItem.id, updates);
    } else {
      void taskMutations.updateTask(currentItem.id, updates);
    }
  }
}
