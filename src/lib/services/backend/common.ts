import type {
  TaskStatus,
  ProjectTree,
  TaskListWithTasks,
  TaskWithSubTasks,
  SubTask,
  Tag
} from '$lib/types/task';

export function convertTimestampToDate(timestamp: number): Date {
  return new Date(timestamp);
}

export function convertProjectTree(project: unknown): ProjectTree {
  const proj = project as Record<string, unknown>;
  return {
    ...proj,
    created_at: convertTimestampToDate(proj.created_at as number),
    updated_at: convertTimestampToDate(proj.updated_at as number),
    task_lists: (proj.task_lists as unknown[]).map(convertTaskList)
  } as ProjectTree;
}

export function convertTaskList(list: unknown): TaskListWithTasks {
  const taskList = list as Record<string, unknown>;
  return {
    ...taskList,
    created_at: convertTimestampToDate(taskList.created_at as number),
    updated_at: convertTimestampToDate(taskList.updated_at as number),
    tasks: (taskList.tasks as unknown[]).map(convertTask)
  } as TaskListWithTasks;
}

export function convertTask(task: unknown): TaskWithSubTasks {
  const taskData = task as Record<string, unknown>;
  return {
    ...taskData,
    status: taskData.status as TaskStatus,
    start_date: taskData.start_date
      ? convertTimestampToDate(taskData.start_date as number)
      : undefined,
    end_date: taskData.end_date ? convertTimestampToDate(taskData.end_date as number) : undefined,
    created_at: convertTimestampToDate(taskData.created_at as number),
    updated_at: convertTimestampToDate(taskData.updated_at as number),
    sub_tasks: (taskData.sub_tasks as unknown[]).map(convertSubTask),
    tags: (taskData.tags as unknown[]).map(convertTag)
  } as TaskWithSubTasks;
}

export function convertSubTask(subtask: unknown): SubTask {
  const subTaskData = subtask as Record<string, unknown>;
  return {
    ...subTaskData,
    status: subTaskData.status as TaskStatus,
    start_date: subTaskData.start_date
      ? convertTimestampToDate(subTaskData.start_date as number)
      : undefined,
    end_date: subTaskData.end_date
      ? convertTimestampToDate(subTaskData.end_date as number)
      : undefined,
    created_at: convertTimestampToDate(subTaskData.created_at as number),
    updated_at: convertTimestampToDate(subTaskData.updated_at as number),
    tags: (subTaskData.tags as unknown[]).map(convertTag)
  } as SubTask;
}

export function convertTag(tag: unknown): Tag {
  const tagData = tag as Record<string, unknown>;
  return {
    ...tagData,
    created_at: convertTimestampToDate(tagData.created_at as number),
    updated_at: convertTimestampToDate(tagData.updated_at as number)
  } as Tag;
}

export function isTauriEnvironment(): boolean {
  // @ts-expect-error - Tauri環境でのみ利用可能
  return typeof window !== 'undefined' && window.__TAURI_INTERNALS__;
}
