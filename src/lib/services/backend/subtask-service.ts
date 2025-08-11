import type { SubTask, SubTaskSearchCondition } from '$lib/types/task';
import type { CrudInterface, SearchInterface } from '../../types/crud-interface';

/**
 * サブタスク管理用のバックエンドサービスインターフェース
 */
export interface SubTaskService extends CrudInterface<SubTask>, SearchInterface<SubTask, SubTaskSearchCondition> {}
