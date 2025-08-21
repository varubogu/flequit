import type { Task, TaskSearchCondition, TaskPatch } from '$lib/types/task';
import type { CrudInterface, SearchInterface } from '../../types/crud-interface';

/**
 * タスク管理用のバックエンドサービスインターフェース
 */
export interface TaskService
  extends CrudInterface<Task, TaskPatch>,
    SearchInterface<Task, TaskSearchCondition> {}
