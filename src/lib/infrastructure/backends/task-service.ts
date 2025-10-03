import type { Task, TaskSearchCondition } from '$lib/types/task';
import type { ProjectCrudInterface, ProjectSearchInterface } from '../../types/crud-interface';

/**
 * タスク管理用のバックエンドサービスインターフェース
 */
export interface TaskService
  extends ProjectCrudInterface<Task, Partial<Task>>,
    ProjectSearchInterface<Task, TaskSearchCondition> {}
