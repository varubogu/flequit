import type { TaskListSearchCondition, TaskList, TaskListPatch } from '$lib/types/task-list';
import type { ProjectCrudInterface, ProjectSearchInterface } from '$lib/types/crud-interface';

/**
 * タスクリスト管理用のバックエンドサービスインターフェース
 */
export interface TaskListService
  extends ProjectCrudInterface<TaskList, TaskListPatch>,
    ProjectSearchInterface<TaskList, TaskListSearchCondition> {}
