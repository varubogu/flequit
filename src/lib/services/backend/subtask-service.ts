import type { SubTaskSearchCondition, SubTask, SubTaskPatch } from '$lib/types/sub-task';
import type { CrudInterface, SearchInterface } from '../../types/crud-interface';

/**
 * サブタスク管理用のバックエンドサービスインターフェース
 */
export interface SubTaskService
  extends CrudInterface<SubTask, SubTaskPatch>,
    SearchInterface<SubTask, SubTaskSearchCondition> {}
