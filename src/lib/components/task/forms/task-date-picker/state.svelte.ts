import type { TaskWithSubTasks } from '$lib/types/task';
import { taskCoreStore } from '$lib/stores/task-core-store.svelte';

export interface TaskDatePickerState {
  taskId: string;
}

export interface DatePickerState {
  show: boolean;
  position: { x: number; y: number };
}

export interface SubTaskDatePickerState extends DatePickerState {
  editingSubTaskId: string | null;
}

/**
 * タスク日付ピッカーの状態を作成する
 */
export function createTaskDatePickerState(getTask: () => TaskWithSubTasks) {
  // Task state
  const taskState = $state<TaskDatePickerState>({ taskId: getTask().id });

  // task prop の差し替え時に追従
  $effect(() => {
    taskState.taskId = getTask().id;
  });

  // 最新の task を取得（リアクティブ）
  const currentTask = $derived.by(() => {
    return taskCoreStore.getTaskById(taskState.taskId) || getTask();
  });

  // Main task date picker state
  const mainState = $state<DatePickerState>({ show: false, position: { x: 0, y: 0 } });

  // SubTask date picker state
  const subTaskState = $state<SubTaskDatePickerState>({
    show: false,
    position: { x: 0, y: 0 },
    editingSubTaskId: null
  });

  return {
    // Current task (リアクティブにストアから取得)
    get currentTask() {
      return currentTask;
    },

    // Main task state getters
    get showDatePicker() {
      return mainState.show;
    },
    get datePickerPosition() {
      return mainState.position;
    },

    // SubTask state getters
    get showSubTaskDatePicker() {
      return subTaskState.show;
    },
    get subTaskDatePickerPosition() {
      return subTaskState.position;
    },
    get editingSubTaskId() {
      return subTaskState.editingSubTaskId;
    },

    // Expose mutable state for handlers
    mainState,
    subTaskState
  };
}

export type TaskDatePickerStateResult = ReturnType<typeof createTaskDatePickerState>;
