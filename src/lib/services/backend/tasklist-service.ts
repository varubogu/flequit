import type { TaskListSearchCondition, TaskList, TaskListPatch } from '$lib/types/task-list';
import type { CrudInterface, SearchInterface } from '$lib/types/crud-interface';

/**
 * タスクリスト管理用のバックエンドサービスインターフェース
 */
export interface TaskListService
  extends CrudInterface<TaskList, TaskListPatch>,
    SearchInterface<TaskList, TaskListSearchCondition> {}
