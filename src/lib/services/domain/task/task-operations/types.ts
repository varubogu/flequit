import type { Task, TaskWithSubTasks } from '$lib/types/task';
import type { TaskStore } from '$lib/stores/tasks.svelte';
import type { TaskCoreStore } from '$lib/stores/task-core-store.svelte';
import type { TaskListStore } from '$lib/stores/task-list-store.svelte';
import type { TagStore } from '$lib/stores/tags.svelte';
import type { ErrorHandler } from '$lib/stores/error-handler.svelte';
import type { TaskRecurrenceService } from '$lib/services/domain/task-recurrence';
import { SvelteDate } from 'svelte/reactivity';

export type TaskStoreLike = Pick<
  TaskStore,
  | 'selectedTaskId'
  | 'getTaskById'
  | 'getTaskProjectAndList'
  | 'attachTagToTask'
  | 'detachTagFromTask'
>;

export type TaskCoreStoreLike = Pick<
  TaskCoreStore,
  | 'applyTaskUpdate'
  | 'updateTask'
  | 'insertTask'
  | 'removeTask'
  | 'restoreTask'
  | 'moveTaskBetweenLists'
  | 'restoreTaskMove'
>;

export type TaskListStoreLike = Pick<TaskListStore, 'getProjectIdByListId'>;

export type TagStoreLike = Pick<TagStore, 'tags' | 'addTagWithId'>;

export type ErrorHandlerLike = Pick<ErrorHandler, 'addSyncError'>;

export type TaskOperationsDependencies = {
  taskStore: TaskStoreLike;
  taskCoreStore: TaskCoreStoreLike;
  taskListStore: TaskListStoreLike;
  tagStore: TagStoreLike;
  errorHandler: ErrorHandlerLike;
  recurrenceService?: TaskRecurrenceService;
};

// ===== ヘルパー関数 =====

export function cloneTask(task: TaskWithSubTasks): TaskWithSubTasks {
  return {
    ...task,
    subTasks: [...task.subTasks],
    tags: [...task.tags],
    createdAt: new Date(task.createdAt),
    updatedAt: new Date(task.updatedAt)
  };
}

export function toSvelteDate(date: Date | undefined): SvelteDate {
  return new SvelteDate(date ?? new Date());
}
