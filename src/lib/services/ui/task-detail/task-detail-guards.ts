import type { TaskWithSubTasks } from '$lib/types/task';
import type { SubTask } from '$lib/types/sub-task';

export type TaskDetailItem = TaskWithSubTasks | SubTask | null;

export function isTaskWithSubTasks(item: TaskDetailItem): item is TaskWithSubTasks {
  return !!item && typeof item === 'object' && 'listId' in item && 'subTasks' in item;
}

export function isSubTask(item: TaskDetailItem): item is SubTask {
  return !!item && typeof item === 'object' && 'taskId' in item;
}

export function requireItem<T extends TaskDetailItem>(item: T | null): T {
  if (!item) {
    throw new Error('TaskDetailActions: current item is not available');
  }
  return item;
}
