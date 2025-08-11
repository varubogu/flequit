import type { Task, TaskSearchCondition } from '$lib/types/task';
import type { CrudInterface, SearchInterface } from '../../types/crud-interface';

/**
 * タスク管理用のバックエンドサービスインターフェース
 */
export interface TaskService
  extends CrudInterface<Task>,
    SearchInterface<Task, TaskSearchCondition> {}
