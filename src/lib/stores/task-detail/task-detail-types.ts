import type { TaskStatus } from '$lib/types/task';
import type { RecurrenceRule as LegacyRecurrenceRule } from '$lib/types/datetime-calendar';
import type { TaskWithSubTasks } from '$lib/types/task';

export type EditFormState = {
  title: string;
  description: string;
  plan_start_date: Date | undefined;
  plan_end_date: Date | undefined;
  is_range_date: boolean;
  priority: number;
  recurrenceRule: import('$lib/types/recurrence').RecurrenceRule | undefined;
};

export type DateChangePayload = {
  date: string;
  dateTime: string;
  range?: { start: string; end: string };
  isRangeDate: boolean;
  recurrenceRule?: LegacyRecurrenceRule | null;
};

export type ProjectTaskListChangePayload = {
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
  moveTaskToList: (taskId: string, taskListId: string) => Promise<void>;
};

export type TaskDetailRecurrenceActions = {
  save: (params: {
    projectId: string;
    itemId: string;
    isSubTask: boolean;
    rule: LegacyRecurrenceRule | null;
    userId: string; // 追加
  }) => Promise<void>;
};
