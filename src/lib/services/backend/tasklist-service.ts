import type { TaskListSearchCondition, TaskList } from '$lib/types/task-list';
import type { ProjectCrudInterface, ProjectSearchInterface } from '$lib/types/crud-interface';

/**
 * タスクリスト管理用のバックエンドサービスインターフェース
 */
export interface TaskListService
  extends ProjectCrudInterface<TaskList, Partial<TaskList>>,
    ProjectSearchInterface<TaskList, TaskListSearchCondition> {}
