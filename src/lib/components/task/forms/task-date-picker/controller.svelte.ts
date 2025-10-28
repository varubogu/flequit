import type { TaskWithSubTasks } from '$lib/types/task';
import type { RecurrenceRule } from '$lib/types/datetime-calendar';
import { taskMutations } from '$lib/services/domain/task/task-mutations-instance';
import { subTaskStore } from '$lib/stores/sub-task-store.svelte';
import { RecurrenceSyncService } from '$lib/services/domain/recurrence-sync';
import { SvelteDate } from 'svelte/reactivity';

interface DatePickerState {
  show: boolean;
  position: { x: number; y: number };
}

interface SubTaskDatePickerState extends DatePickerState {
  editingSubTaskId: string | null;
}

export function useTaskDatePickerController(task: TaskWithSubTasks) {
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
    const { dateTime, range, isRangeDate, recurrenceRule } = data;

    if (isRangeDate) {
      if (range) {
        await taskMutations.updateTask(task.id, {
          ...task,
          planStartDate: new SvelteDate(range.start),
          planEndDate: new SvelteDate(range.end),
          isRangeDate: true,
          recurrenceRule: recurrenceRule ?? undefined
        });
      } else {
        const currentEndDate =
          task.planEndDate !== undefined
            ? new SvelteDate(task.planEndDate)
            : new SvelteDate(dateTime);
        await taskMutations.updateTask(task.id, {
          ...task,
          planStartDate: currentEndDate,
          planEndDate: currentEndDate,
          isRangeDate: true,
          recurrenceRule: recurrenceRule ?? undefined
        });
      }
    } else {
      await taskMutations.updateTask(task.id, {
        ...task,
        planEndDate: new SvelteDate(dateTime),
        planStartDate: undefined,
        isRangeDate: false,
        recurrenceRule: recurrenceRule ?? undefined
      });
    }

    if (recurrenceRule !== undefined) {
      await saveRecurrenceRule(task.id, false, recurrenceRule);
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
    if (!subTaskState.editingSubTaskId) return;

    const { dateTime, range, isRangeDate, recurrenceRule } = data;
    const subTaskIndex = task.subTasks.findIndex((st) => st.id === subTaskState.editingSubTaskId);
    if (subTaskIndex === -1) return;

    if (isRangeDate) {
      if (range) {
        subTaskStore.updateSubTask(subTaskState.editingSubTaskId, {
          planStartDate: new SvelteDate(range.start),
          planEndDate: new SvelteDate(range.end),
          isRangeDate: true,
          recurrenceRule: recurrenceRule ?? undefined
        });
      } else {
        const subTask = task.subTasks[subTaskIndex];
        const currentEndDate =
          subTask.planEndDate !== undefined
            ? new SvelteDate(subTask.planEndDate)
            : new SvelteDate(dateTime);
        subTaskStore.updateSubTask(subTaskState.editingSubTaskId, {
          planStartDate: currentEndDate,
          planEndDate: currentEndDate,
          isRangeDate: true,
          recurrenceRule: recurrenceRule ?? undefined
        });
      }
    } else {
      subTaskStore.updateSubTask(subTaskState.editingSubTaskId, {
        planEndDate: new SvelteDate(dateTime),
        planStartDate: undefined,
        isRangeDate: false,
        recurrenceRule: recurrenceRule ?? undefined
      });
    }

    if (recurrenceRule !== undefined) {
      await saveRecurrenceRule(subTaskState.editingSubTaskId, true, recurrenceRule);
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
