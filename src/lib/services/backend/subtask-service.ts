import type { SubTaskSearchCondition, SubTask, SubTaskPatch } from '$lib/types/sub-task';
import type { ProjectCrudInterface, ProjectSearchInterface } from '../../types/crud-interface';

/**
 * サブタスク管理用のバックエンドサービスインターフェース
 */
export interface SubTaskService
  extends ProjectCrudInterface<SubTask, SubTaskPatch>,
    ProjectSearchInterface<SubTask, SubTaskSearchCondition> {}
