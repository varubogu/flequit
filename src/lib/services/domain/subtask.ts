import type { SubTask } from '$lib/types/sub-task';

/**
 * サブタスクサービスのインターフェース
 */
export interface SubTaskService {
  create(projectId: string, subTask: SubTask): Promise<boolean>;
  update(projectId: string, id: string, patch: Partial<SubTask>): Promise<boolean>;
  delete(projectId: string, id: string): Promise<boolean>;
  get(projectId: string, id: string): Promise<SubTask | null>;
}
