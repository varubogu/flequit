import type { Task, TaskSearchCondition, TaskPatch } from '$lib/types/task';
import type { TaskService } from '$lib/services/backend/task-service';

export class TaskWebService implements TaskService {
  async create(projectId: string, task: Task): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: createTask not implemented', projectId, task);
    return true; // 警告を出しつつ正常終了として扱う
  }

  async update(projectId: string, id: string, patch: TaskPatch): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: updateTask not implemented', projectId, id, patch);
    return true; // 警告を出しつつ正常終了として扱う
  }

  async delete(projectId: string, id: string): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: deleteTask not implemented', projectId, id);
    return true; // 警告を出しつつ正常終了として扱う
  }

  async get(projectId: string, id: string): Promise<Task | null> {
    // TODO: Web API実装を追加
    console.warn('Web backend: getTask not implemented (called for data retrieval)', projectId, id);
    return null; // 仮実装としてnullを返す
  }

  async search(projectId: string, condition: TaskSearchCondition): Promise<Task[]> {
    // TODO: Web API実装を追加
    console.warn('Web backend: searchTasks not implemented', projectId, condition);
    return []; // 仮実装として空配列を返す
  }

}
