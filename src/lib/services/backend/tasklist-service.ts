import type { TaskList, TaskListSearchCondition } from '$lib/types/task';
import type { CrudInterface, SearchInterface } from '$lib/types/crud-interface';

/**
 * タスクリスト管理用のバックエンドサービスインターフェース
 */
export interface TaskListService
  extends CrudInterface<TaskList>,
    SearchInterface<TaskList, TaskListSearchCondition> {}
