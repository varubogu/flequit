import type { TaskRecurrence, TaskRecurrenceSearchCondition } from '$lib/types/task-recurrence';
import type { TaskRecurrenceService } from '$lib/services/backend/task-recurrence-service';

export class TaskRecurrenceWebService implements TaskRecurrenceService {
  async create(taskRecurrence: TaskRecurrence): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: createTaskRecurrence not implemented', taskRecurrence);
    return true; // 警告を出しつつ正常終了として扱う
  }

  async getByTaskId(taskId: string): Promise<TaskRecurrence | null> {
    // TODO: Web API実装を追加
    console.warn('Web backend: getTaskRecurrenceByTaskId not implemented', taskId);
    return null; // 仮実装としてnullを返す
  }

  async delete(taskId: string): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: deleteTaskRecurrence not implemented', taskId);
    return true; // 警告を出しつつ正常終了として扱う
  }

  async search(condition: TaskRecurrenceSearchCondition): Promise<TaskRecurrence[]> {
    // TODO: Web API実装を追加
    console.warn('Web backend: searchTaskRecurrences not implemented', condition);
    return []; // 仮実装として空配列を返す
  }
}