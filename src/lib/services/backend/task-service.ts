import type { Task, TaskSearchCondition, TaskPatch } from '$lib/types/task';
import type { ProjectCrudInterface, ProjectSearchInterface } from '../../types/crud-interface';

/**
 * タスク管理用のバックエンドサービスインターフェース
 */
export interface TaskService
  extends ProjectCrudInterface<Task, TaskPatch>,
    ProjectSearchInterface<Task, TaskSearchCondition> {}
