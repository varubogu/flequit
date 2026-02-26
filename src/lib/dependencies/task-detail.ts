import { taskInteractions } from '$lib/services/ui/task';
import { taskOperations } from '$lib/services/domain/task';

export interface TaskEditActionsGateway {
  updateNewTaskData(updates: Record<string, unknown>): void;
  updateTask(taskId: string, updates: Record<string, unknown>): Promise<unknown>;
}

export function resolveTaskEditActionsGateway(): TaskEditActionsGateway {
  return {
    updateNewTaskData: (updates) => taskInteractions.updateNewTaskData(updates),
    updateTask: (taskId, updates) => taskOperations.updateTask(taskId, updates)
  };
}
