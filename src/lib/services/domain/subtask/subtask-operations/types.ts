import type { Tag } from '$lib/types/tag';
import type { TaskStore } from '$lib/stores/tasks.svelte';
import type { TaskCoreStore } from '$lib/stores/task-core-store.svelte';
import type { SubTaskStore } from '$lib/stores/sub-task-store.svelte';
import type { TagStore } from '$lib/stores/tags.svelte';
import type { ErrorHandler } from '$lib/stores/error-handler.svelte';

export type TaskStoreLike = Pick<TaskStore, 'getTaskProjectAndList'>;

export type TaskCoreStoreLike = Pick<TaskCoreStore, 'updateTask'>;

export type SubTaskStoreLike = Pick<
  SubTaskStore,
  'addSubTask' | 'updateSubTask' | 'deleteSubTask' | 'attachTagToSubTask' | 'detachTagFromSubTask'
>;

export type TagStoreLike = Pick<TagStore, 'tags'>;

export type ErrorHandlerLike = Pick<ErrorHandler, 'addSyncError'>;

export type TaggingServiceLike = {
  createSubtaskTag: (projectId: string, subTaskId: string, tagName: string) => Promise<Tag>;
  deleteSubtaskTag: (projectId: string, subTaskId: string, tagId: string) => Promise<void>;
};

export type SubTaskOperationsDependencies = {
  taskStore: TaskStoreLike;
  taskCoreStore: TaskCoreStoreLike;
  subTaskStore: SubTaskStoreLike;
  tagStore: TagStoreLike;
  taggingService: TaggingServiceLike;
  errorHandler: ErrorHandlerLike;
};
