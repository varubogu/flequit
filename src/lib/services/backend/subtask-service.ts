import type { SubTaskSearchCondition } from '$lib/types/sub-task';
import type { SubTask } from '$lib/types/sub-task';
import type { CrudInterface, SearchInterface } from '../../types/crud-interface';

/**
 * サブタスク管理用のバックエンドサービスインターフェース
 */
export interface SubTaskService
  extends CrudInterface<SubTask>,
    SearchInterface<SubTask, SubTaskSearchCondition> {}
