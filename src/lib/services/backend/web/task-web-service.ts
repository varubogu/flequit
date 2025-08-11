import type { Task, TaskSearchCondition } from '$lib/types/task';
import type { TaskService } from '$lib/services/backend/task-service';

export class WebTaskService implements TaskService {
  async create(task: Task): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: createTask not implemented', task);
    return false; // 仮実装として失敗を返す
  }

  async update(task: Task): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: updateTask not implemented', task);
    return false; // 仮実装として失敗を返す
  }

  async delete(id: string): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: deleteTask not implemented', id);
    return false; // 仮実装として失敗を返す
  }

  async get(id: string): Promise<Task | null> {
    // TODO: Web API実装を追加
    console.warn('Web backend: getTask not implemented', id);
    return null; // 仮実装としてnullを返す
  }

  async search(condition: TaskSearchCondition): Promise<Task[]> {
    // TODO: Web API実装を追加
    console.warn('Web backend: searchTasks not implemented', condition);
    return []; // 仮実装として空配列を返す
  }
}
