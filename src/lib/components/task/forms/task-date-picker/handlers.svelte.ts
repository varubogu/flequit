import { taskOperations } from '$lib/services/domain/task';
import type { TaskWithSubTasks } from '$lib/types/task';
import type { SubTask } from '$lib/types/sub-task';
import type { RecurrenceRule } from '$lib/types/datetime-calendar';
import { subTaskStore } from '$lib/stores/sub-task-store.svelte';
import { RecurrenceSyncService } from '$lib/services/domain/recurrence-sync';
import { SvelteDate } from 'svelte/reactivity';
import { taskCoreStore } from '$lib/stores/task-core-store.svelte';
import type { DatePickerState, SubTaskDatePickerState } from '$lib/components/task/forms/task-date-picker/state.svelte';

// RecurrenceRule保存処理
async function saveRecurrenceRule(
  task: TaskWithSubTasks,
  itemId: string,
  isSubTask: boolean,
  rule: RecurrenceRule | null
): Promise<boolean> {
  const projectId = task.projectId;
  const userId = task.updatedBy;

  if (!projectId) {
    console.error('Failed to get projectId for recurrence rule');
    return false;
  }

  if (!userId) {
    console.error('Failed to get userId for recurrence rule');
    return false;
  }

  try {
    await RecurrenceSyncService.save({ projectId, itemId, isSubTask, rule, userId });
    return true;
  } catch (error) {
    console.error('Failed to save recurrence rule:', error);
    return false;
  }
}

// Position calculation utility
function calculatePickerPosition(event: MouseEvent): { x: number; y: number } {
  const rect = (event.target as HTMLElement).getBoundingClientRect();
  return {
    x: Math.min(rect.left, window.innerWidth - 300),
    y: rect.bottom + 8
  };
}

/**
 * タスク日付ピッカーのハンドラーを作成する
 */
export function createTaskDatePickerHandlers(
  task: TaskWithSubTasks,
  mainState: DatePickerState,
  subTaskState: SubTaskDatePickerState
) {
  // Main task handlers
  function handleDueDateClick(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    subTaskState.show = false;
    subTaskState.editingSubTaskId = null;

    mainState.position = calculatePickerPosition(event);
    mainState.show = true;
  }

  async function handleDateChange(data: {
    date: string;
    dateTime: string;
    range?: { start: string; end: string };
    isRangeDate: boolean;
    recurrenceRule?: RecurrenceRule | null;
  }) {
    const { dateTime, range, isRangeDate, recurrenceRule } = data;

    // 更新データを準備
    let updates: Partial<TaskWithSubTasks> = {};

    if (isRangeDate) {
      if (range) {
        updates = {
          ...task,
          planStartDate: new SvelteDate(range.start),
          planEndDate: new SvelteDate(range.end),
          isRangeDate: true
        };
      } else {
        const currentEndDate =
          task.planEndDate !== undefined
            ? new SvelteDate(task.planEndDate)
            : new SvelteDate(dateTime);
        updates = {
          ...task,
          planStartDate: currentEndDate,
          planEndDate: currentEndDate,
          isRangeDate: true
        };
      }
    } else {
      updates = {
        ...task,
        planEndDate: new SvelteDate(dateTime),
        planStartDate: undefined,
        isRangeDate: false
      };
    }

    // タスクの日付を先に更新
    await taskOperations.updateTask(task.id, updates);

    // recurrenceRule の保存とストア更新
    if (recurrenceRule !== undefined) {
      const success = await saveRecurrenceRule(task, task.id, false, recurrenceRule);

      // バックエンド保存が成功した場合のみストアを更新
      if (success) {
        taskCoreStore.updateTask(task.id, { recurrenceRule: recurrenceRule ?? undefined });
      } else {
        console.error(
          '[TaskDatePickerController.handleDateChange] バックエンド保存失敗のためストア更新をスキップ'
        );
      }
    }
  }

  async function handleDateClear() {
    await taskOperations.updateTask(task.id, {
      ...task,
      planStartDate: undefined,
      planEndDate: undefined,
      isRangeDate: false
    });
  }

  function handleDatePickerClose() {
    mainState.show = false;
  }

  // SubTask handlers
  function handleSubTaskDueDateClick(event: MouseEvent, subTaskId: string) {
    event.preventDefault();
    event.stopPropagation();

    mainState.show = false;

    subTaskState.position = calculatePickerPosition(event);
    subTaskState.editingSubTaskId = subTaskId;
    subTaskState.show = true;
  }

  async function handleSubTaskDateChange(data: {
    date: string;
    dateTime: string;
    range?: { start: string; end: string };
    isRangeDate: boolean;
    recurrenceRule?: RecurrenceRule | null;
  }) {
    if (!subTaskState.editingSubTaskId) return;

    const { dateTime, range, isRangeDate, recurrenceRule } = data;
    const subTaskIndex = task.subTasks.findIndex((st) => st.id === subTaskState.editingSubTaskId);
    if (subTaskIndex === -1) return;

    // 更新データを準備
    let updates: Partial<SubTask> = {};

    if (isRangeDate) {
      if (range) {
        updates = {
          planStartDate: new SvelteDate(range.start),
          planEndDate: new SvelteDate(range.end),
          isRangeDate: true
        };
      } else {
        const subTask = task.subTasks[subTaskIndex];
        const currentEndDate =
          subTask.planEndDate !== undefined
            ? new SvelteDate(subTask.planEndDate)
            : new SvelteDate(dateTime);
        updates = {
          planStartDate: currentEndDate,
          planEndDate: currentEndDate,
          isRangeDate: true
        };
      }
    } else {
      updates = {
        planEndDate: new SvelteDate(dateTime),
        planStartDate: undefined,
        isRangeDate: false
      };
    }

    // サブタスクの日付を先に更新
    subTaskStore.updateSubTask(subTaskState.editingSubTaskId, updates);

    // recurrenceRule の保存とストア更新
    if (recurrenceRule !== undefined) {
      const success = await saveRecurrenceRule(
        task,
        subTaskState.editingSubTaskId,
        true,
        recurrenceRule
      );

      // バックエンド保存が成功した場合のみストアを更新
      if (success) {
        subTaskStore.updateSubTask(subTaskState.editingSubTaskId, {
          recurrenceRule: recurrenceRule ?? undefined
        });
      } else {
        console.error(
          '[TaskDatePickerController.handleSubTaskDateChange] バックエンド保存失敗のためストア更新をスキップ'
        );
      }
    }
  }

  function handleSubTaskDateClear() {
    if (!subTaskState.editingSubTaskId) return;

    subTaskStore.updateSubTask(subTaskState.editingSubTaskId, {
      planStartDate: undefined,
      planEndDate: undefined,
      isRangeDate: false
    });
  }

  function handleSubTaskDatePickerClose() {
    subTaskState.show = false;
    subTaskState.editingSubTaskId = null;
  }

  // Getter for SubTask data
  function getEditingSubTask() {
    if (!subTaskState.editingSubTaskId) return null;
    return task.subTasks.find((st) => st.id === subTaskState.editingSubTaskId);
  }

  return {
    getEditingSubTask,
    handleDueDateClick,
    handleDateChange,
    handleDateClear,
    handleDatePickerClose,
    handleSubTaskDueDateClick,
    handleSubTaskDateChange,
    handleSubTaskDateClear,
    handleSubTaskDatePickerClose
  };
}
