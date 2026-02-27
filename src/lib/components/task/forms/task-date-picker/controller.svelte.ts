import type { TaskWithSubTasks } from '$lib/types/task';
import { createTaskDatePickerState } from './state.svelte';
import { createTaskDatePickerHandlers } from './handlers.svelte';

/**
 * タスク日付ピッカーのコントローラー
 *
 * state.svelte.ts と handlers.svelte.ts を組み合わせた統合インターフェース
 */
export function useTaskDatePickerController(task: TaskWithSubTasks) {
  const state = createTaskDatePickerState(task);
  const handlers = createTaskDatePickerHandlers(task, state.mainState, state.subTaskState);

  return {
    // Current task (リアクティブにストアから取得)
    get currentTask() {
      return state.currentTask;
    },

    // Main task state
    get showDatePicker() {
      return state.showDatePicker;
    },
    get datePickerPosition() {
      return state.datePickerPosition;
    },

    // SubTask state
    get showSubTaskDatePicker() {
      return state.showSubTaskDatePicker;
    },
    get subTaskDatePickerPosition() {
      return state.subTaskDatePickerPosition;
    },
    get editingSubTaskId() {
      return state.editingSubTaskId;
    },
    getEditingSubTask: handlers.getEditingSubTask,

    // Main task handlers
    handleDueDateClick: handlers.handleDueDateClick,
    handleDateChange: handlers.handleDateChange,
    handleDateClear: handlers.handleDateClear,
    handleDatePickerClose: handlers.handleDatePickerClose,

    // SubTask handlers
    handleSubTaskDueDateClick: handlers.handleSubTaskDueDateClick,
    handleSubTaskDateChange: handlers.handleSubTaskDateChange,
    handleSubTaskDateClear: handlers.handleSubTaskDateClear,
    handleSubTaskDatePickerClose: handlers.handleSubTaskDatePickerClose
  };
}
