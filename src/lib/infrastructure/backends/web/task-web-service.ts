import type { Task, TaskSearchCondition } from '$lib/types/task';
import type { TaskService } from '../task-service';

export class TaskWebService implements TaskService {
  async create(projectId: string, task: Task): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backends: createTask not implemented', projectId, task);
    return true; // 警告を出しつつ正常終了として扱う
  }

  async update(projectId: string, id: string, patch: Partial<Task>): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backends: updateTask not implemented', projectId, id, patch);
    return true; // 警告を出しつつ正常終了として扱う
  }

  async delete(projectId: string, id: string): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backends: deleteTask not implemented', projectId, id);
    return true; // 警告を出しつつ正常終了として扱う
  }

  async get(projectId: string, id: string): Promise<Task | null> {
    // TODO: Web API実装を追加
    console.warn('Web backends: getTask not implemented (called for data retrieval)', projectId, id);
    return null; // 仮実装としてnullを返す
  }

  async search(projectId: string, condition: TaskSearchCondition): Promise<Task[]> {
    // TODO: Web API実装を追加
    console.warn('Web backends: searchTasks not implemented', projectId, condition);
    return []; // 仮実装として空配列を返す
  }

}
