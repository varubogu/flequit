import { SubTaskBackend } from '$lib/services/domain/subtask';
import type { SubTask } from '$lib/types/sub-task';

export interface SubTaskGateway {
  createSubTask(
    projectId: string,
    taskId: string,
    subTask: { title: string; description?: string; status?: string; priority?: number }
  ): Promise<SubTask>;
  updateSubTask(
    projectId: string,
    subTaskId: string,
    updates: Partial<SubTask>
  ): Promise<SubTask | null>;
  deleteSubTask(projectId: string, subTaskId: string): Promise<boolean>;
}

export function resolveSubTaskGateway(): SubTaskGateway {
  return SubTaskBackend;
}
