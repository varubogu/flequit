import type { TaskRecurrence, TaskRecurrenceSearchCondition } from '$lib/types/recurrence-reference';
import type { TaskRecurrenceService } from '$lib/services/backend/task-recurrence-service';

export class TaskRecurrenceWebService implements TaskRecurrenceService {
  async create(projectId: string, taskRecurrence: TaskRecurrence): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: createTaskRecurrence not implemented', { projectId, taskRecurrence });
    return true; // 警告を出しつつ正常終了として扱う
  }

  async getByTaskId(projectId: string, taskId: string): Promise<TaskRecurrence | null> {
    // TODO: Web API実装を追加
    console.warn('Web backend: getTaskRecurrenceByTaskId not implemented', { projectId, taskId });
    return null; // 仮実装としてnullを返す
  }

  async delete(projectId: string, taskId: string): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: deleteTaskRecurrence not implemented', { projectId, taskId });
    return true; // 警告を出しつつ正常終了として扱う
  }

  async search(projectId: string, condition: TaskRecurrenceSearchCondition): Promise<TaskRecurrence[]> {
    // TODO: Web API実装を追加
    console.warn('Web backend: searchTaskRecurrences not implemented', { projectId, condition });
    return []; // 仮実装として空配列を返す
  }
}