<script lang="ts">
  import type { TaskWithSubTasks } from '$lib/types/task';
  import type { SubTask } from '$lib/types/sub-task';
  import { taskCoreStore } from '$lib/stores/task-core-store.svelte';
  import { taskStore } from '$lib/stores/tasks.svelte';
  import { subTaskStore } from '$lib/stores/sub-task-store.svelte';
  import InlineDatePicker from '$lib/components/datetime/inline-picker/inline-date-picker.svelte';
  import type { RecurrenceRule } from '$lib/types/datetime-calendar';
  import { getBackendService } from '$lib/infrastructure/backends/index';
  import { fromLegacyRecurrenceRule } from '$lib/utils/recurrence-converter';

  interface Props {
    task: TaskWithSubTasks;
  }

  let { task }: Props = $props();

  // Main task date picker state
  let showDatePicker = $state(false);
  let datePickerPosition = $state({ x: 0, y: 0 });

  // SubTask date picker state
  let showSubTaskDatePicker = $state(false);
  let subTaskDatePickerPosition = $state({ x: 0, y: 0 });
  let editingSubTaskId = $state<string | null>(null);

  // RecurrenceRule保存処理（TaskDetailLogicと同様）
  async function saveRecurrenceRule(
    itemId: string,
    isSubTask: boolean,
    rule: RecurrenceRule | null
  ) {
    // タスクからprojectIdを取得（サブタスクの場合は親タスクから）
    const projectId = task.projectId;

    if (!projectId) {
      console.error('Failed to get projectId for recurrence rule');
      return;
    }

    const backend = await getBackendService();
    const unifiedRule = fromLegacyRecurrenceRule(rule);

    try {
      if (rule === null) {
        // 繰り返しルールを削除
        if (isSubTask) {
          await backend.subtaskRecurrence.delete(projectId, itemId);
        } else {
          await backend.taskRecurrence.delete(projectId, itemId);
        }
      } else {
        // 既存の繰り返し関連付けを確認
        const existing = isSubTask
          ? await backend.subtaskRecurrence.getBySubtaskId(projectId, itemId)
          : await backend.taskRecurrence.getByTaskId(projectId, itemId);

        if (existing) {
          // 既存のRecurrenceRuleを更新
          await backend.recurrenceRule.update(projectId, { ...unifiedRule!, id: existing.recurrenceRuleId });
        } else {
          // 新規RecurrenceRuleを作成
          const ruleId = crypto.randomUUID();
          await backend.recurrenceRule.create(projectId, { ...unifiedRule!, id: ruleId });

          // 関連付けを作成
          if (isSubTask) {
            await backend.subtaskRecurrence.create(projectId, {
              subtaskId: itemId,
              recurrenceRuleId: ruleId
            });
          } else {
            await backend.taskRecurrence.create(projectId, {
              taskId: itemId,
              recurrenceRuleId: ruleId
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to save recurrence rule:', error);
    }
  }

  // Main task date picker handlers
  function handleDueDateClick(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    datePickerPosition = {
      x: Math.min(rect.left, window.innerWidth - 300),
      y: rect.bottom + 8
    };
    showDatePicker = true;
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
        taskCoreStore.updateTask(task.id, {
          ...task,
          planStartDate: new Date(range.start),
          planEndDate: new Date(range.end),
          isRangeDate: true,
          recurrenceRule: recurrenceRule ?? undefined
        });
      } else {
        const currentEndDate = task.planEndDate || new Date(dateTime);
        taskCoreStore.updateTask(task.id, {
          ...task,
          planStartDate: currentEndDate,
          planEndDate: currentEndDate,
          isRangeDate: true,
          recurrenceRule: recurrenceRule ?? undefined
        });
      }
    } else {
      taskCoreStore.updateTask(task.id, {
        ...task,
        planEndDate: new Date(dateTime),
        planStartDate: undefined,
        isRangeDate: false,
        recurrenceRule: recurrenceRule ?? undefined
      });
    }

    // RecurrenceRuleをバックエンドに保存
    if (recurrenceRule !== undefined) {
      await saveRecurrenceRule(task.id, false, recurrenceRule);
    }
  }

  function handleDateClear() {
    taskCoreStore.updateTask(task.id, {
      ...task,
      planStartDate: undefined,
      planEndDate: undefined,
      isRangeDate: false
    });
  }

  function handleDatePickerClose() {
    showDatePicker = false;
  }

  // SubTask date picker handlers
  function handleSubTaskDueDateClick(event: MouseEvent, subTask: SubTask) {
    event.preventDefault();
    event.stopPropagation();

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    subTaskDatePickerPosition = {
      x: Math.min(rect.left, window.innerWidth - 300),
      y: rect.bottom + 8
    };
    editingSubTaskId = subTask.id;
    showSubTaskDatePicker = true;
  }

  async function handleSubTaskDateChange(data: {
    date: string;
    dateTime: string;
    range?: { start: string; end: string };
    isRangeDate: boolean;
    recurrenceRule?: RecurrenceRule | null;
  }) {
    if (!editingSubTaskId) return;

    const { dateTime, range, isRangeDate, recurrenceRule } = data;
    const subTaskIndex = task.subTasks.findIndex((st) => st.id === editingSubTaskId);
    if (subTaskIndex === -1) return;

    if (isRangeDate) {
      if (range) {
        subTaskStore.updateSubTask(editingSubTaskId, {
          planStartDate: new Date(range.start),
          planEndDate: new Date(range.end),
          isRangeDate: true,
          recurrenceRule: recurrenceRule ?? undefined
        });
      } else {
        const subTask = task.subTasks[subTaskIndex];
        const currentEndDate = subTask.planEndDate || new Date(dateTime);
        subTaskStore.updateSubTask(editingSubTaskId, {
          planStartDate: currentEndDate,
          planEndDate: currentEndDate,
          isRangeDate: true,
          recurrenceRule: recurrenceRule ?? undefined
        });
      }
    } else {
      subTaskStore.updateSubTask(editingSubTaskId, {
        planEndDate: new Date(dateTime),
        planStartDate: undefined,
        isRangeDate: false,
        recurrenceRule: recurrenceRule ?? undefined
      });
    }

    // RecurrenceRuleをバックエンドに保存
    if (recurrenceRule !== undefined) {
      await saveRecurrenceRule(editingSubTaskId, true, recurrenceRule);
    }
  }

  function handleSubTaskDateClear() {
    if (!editingSubTaskId) return;

    subTaskStore.updateSubTask(editingSubTaskId, {
      planStartDate: undefined,
      planEndDate: undefined,
      isRangeDate: false
    });
  }

  function handleSubTaskDatePickerClose() {
    showSubTaskDatePicker = false;
    editingSubTaskId = null;
  }

  // Export handlers for parent component
  export { handleDueDateClick, handleSubTaskDueDateClick, datePickerPosition, showDatePicker };
</script>

<!-- Main Task Date Picker -->
<InlineDatePicker
  show={showDatePicker}
  currentDate={task.planEndDate ? task.planEndDate.toISOString() : ''}
  currentStartDate={task.planStartDate ? task.planStartDate.toISOString() : ''}
  position={datePickerPosition}
  isRangeDate={task.isRangeDate || false}
  recurrenceRule={task.recurrenceRule}
  onchange={handleDateChange}
  onclear={handleDateClear}
  onclose={handleDatePickerClose}
/>

<!-- SubTask Date Picker -->
<InlineDatePicker
  show={showSubTaskDatePicker}
  currentDate={editingSubTaskId
    ? task.subTasks.find((st) => st.id === editingSubTaskId)?.planEndDate?.toISOString() || ''
    : ''}
  currentStartDate={editingSubTaskId
    ? task.subTasks.find((st) => st.id === editingSubTaskId)?.planStartDate?.toISOString() || ''
    : ''}
  position={subTaskDatePickerPosition}
  isRangeDate={editingSubTaskId
    ? task.subTasks.find((st) => st.id === editingSubTaskId)?.isRangeDate || false
    : false}
  recurrenceRule={editingSubTaskId
    ? task.subTasks.find((st) => st.id === editingSubTaskId)?.recurrenceRule
    : null}
  onchange={handleSubTaskDateChange}
  onclear={handleSubTaskDateClear}
  onclose={handleSubTaskDatePickerClose}
/>
