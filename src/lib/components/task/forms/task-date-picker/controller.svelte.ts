import type { TaskWithSubTasks } from '$lib/types/task';
import type { RecurrenceRule } from '$lib/types/datetime-calendar';
import { taskMutations } from '$lib/services/domain/task/task-mutations-instance';
import { subTaskStore } from '$lib/stores/sub-task-store.svelte';
import { RecurrenceSyncService } from '$lib/services/domain/recurrence-sync';
import { SvelteDate } from 'svelte/reactivity';
import { taskCoreStore } from '$lib/stores/task-core-store.svelte';

interface TaskDatePickerState {
  taskId: string;
}

interface DatePickerState {
  show: boolean;
  position: { x: number; y: number };
}

interface SubTaskDatePickerState extends DatePickerState {
  editingSubTaskId: string | null;
}

export function useTaskDatePickerController(task: TaskWithSubTasks) {
  // Task state
  const taskState = $state<TaskDatePickerState>({ taskId: task.id });
  
  // 最新の task を取得（リアクティブ）
  const currentTask = $derived.by(() => {
    return taskCoreStore.getTaskById(taskState.taskId) || task;
  });

  // Main task date picker state
  const mainState = $state<DatePickerState>({ show: false, position: { x: 0, y: 0 } });

  // SubTask date picker state
  const subTaskState = $state<SubTaskDatePickerState>({
    show: false,
    position: { x: 0, y: 0 },
    editingSubTaskId: null
  });

  // RecurrenceRule保存処理
  async function saveRecurrenceRule(
    itemId: string,
    isSubTask: boolean,
    rule: RecurrenceRule | null
  ) {
    const projectId = task.projectId;

    if (!projectId) {
      console.error('Failed to get projectId for recurrence rule');
      return;
    }

    try {
      await RecurrenceSyncService.save({ projectId, itemId, isSubTask, rule });
    } catch (error) {
      console.error('Failed to save recurrence rule:', error);
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
    console.log('[TaskDatePickerController.handleDateChange] 開始:', data);
    const { dateTime, range, isRangeDate, recurrenceRule } = data;

    // 更新データを準備
    let updates: any = {};

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
    console.log('[TaskDatePickerController.handleDateChange] タスク更新開始:', updates);
    await taskMutations.updateTask(task.id, updates);
    console.log('[TaskDatePickerController.handleDateChange] タスク更新完了');

    // recurrenceRule の保存とストア更新
    if (recurrenceRule !== undefined) {
      console.log('[TaskDatePickerController.handleDateChange] recurrenceRule保存開始:', recurrenceRule);
      await saveRecurrenceRule(task.id, false, recurrenceRule);
      console.log('[TaskDatePickerController.handleDateChange] recurrenceRule保存完了');
      
      // タスクストアの recurrenceRule を直接更新
      console.log('[TaskDatePickerController.handleDateChange] タスクストアのrecurrenceRule更新開始');
      taskCoreStore.updateTask(task.id, { recurrenceRule: recurrenceRule ?? undefined });
      console.log('[TaskDatePickerController.handleDateChange] タスクストアのrecurrenceRule更新完了');
    }
  }

  async function handleDateClear() {
    await taskMutations.updateTask(task.id, {
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
    console.log('[TaskDatePickerController.handleSubTaskDateChange] 開始:', data);
    if (!subTaskState.editingSubTaskId) return;

    const { dateTime, range, isRangeDate, recurrenceRule } = data;
    const subTaskIndex = task.subTasks.findIndex((st) => st.id === subTaskState.editingSubTaskId);
    if (subTaskIndex === -1) return;

    // 更新データを準備
    let updates: any = {};

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
    console.log('[TaskDatePickerController.handleSubTaskDateChange] サブタスク更新開始:', updates);
    subTaskStore.updateSubTask(subTaskState.editingSubTaskId, updates);
    console.log('[TaskDatePickerController.handleSubTaskDateChange] サブタスク更新完了');

    // recurrenceRule の保存とストア更新
    if (recurrenceRule !== undefined) {
      console.log('[TaskDatePickerController.handleSubTaskDateChange] recurrenceRule保存開始:', recurrenceRule);
      await saveRecurrenceRule(subTaskState.editingSubTaskId, true, recurrenceRule);
      console.log('[TaskDatePickerController.handleSubTaskDateChange] recurrenceRule保存完了');
      
      // サブタスクストアの recurrenceRule を直接更新
      console.log('[TaskDatePickerController.handleSubTaskDateChange] サブタスクストアのrecurrenceRule更新開始');
      subTaskStore.updateSubTask(subTaskState.editingSubTaskId, { recurrenceRule: recurrenceRule ?? undefined });
      console.log('[TaskDatePickerController.handleSubTaskDateChange] サブタスクストアのrecurrenceRule更新完了');
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

  // Getters for SubTask data
  function getEditingSubTask() {
    if (!subTaskState.editingSubTaskId) return null;
    return task.subTasks.find((st) => st.id === subTaskState.editingSubTaskId);
  }

  return {
    // Main task state
    get showDatePicker() {
      return mainState.show;
    },
    get datePickerPosition() {
      return mainState.position;
    },

    // SubTask state
    get showSubTaskDatePicker() {
      return subTaskState.show;
    },
    get subTaskDatePickerPosition() {
      return subTaskState.position;
    },
    get editingSubTaskId() {
      return subTaskState.editingSubTaskId;
    },
    getEditingSubTask,

    // Main task handlers
    handleDueDateClick,
    handleDateChange,
    handleDateClear,
    handleDatePickerClose,

    // SubTask handlers
    handleSubTaskDueDateClick,
    handleSubTaskDateChange,
    handleSubTaskDateClear,
    handleSubTaskDatePickerClose
  };
}
