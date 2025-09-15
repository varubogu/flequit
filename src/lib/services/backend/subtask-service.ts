import type { SubTaskSearchCondition, SubTask } from '$lib/types/sub-task';
import type { ProjectCrudInterface, ProjectSearchInterface } from '../../types/crud-interface';

/**
 * サブタスク管理用のバックエンドサービスインターフェース
 */
export interface SubTaskService
  extends ProjectCrudInterface<SubTask, Partial<SubTask>>,
    ProjectSearchInterface<SubTask, SubTaskSearchCondition> {}
