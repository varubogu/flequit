import type { Task, TaskSearchCondition } from '$lib/types/task';
import type { TaskService } from '$lib/services/backend/task-service';

export class WebTaskService implements TaskService {
  async create(task: Task): Promise<boolean> {
    // TODO: Web API実装を追加
    console.log('Web backend: createTask not implemented', task);
    throw new Error('Not implemented for web mode');
  }

  async update(task: Task): Promise<boolean> {
    // TODO: Web API実装を追加
    console.log('Web backend: updateTask not implemented', task);
    throw new Error('Not implemented for web mode');
  }

  async delete(id: string): Promise<boolean> {
    // TODO: Web API実装を追加
    console.log('Web backend: deleteTask not implemented', id);
    throw new Error('Not implemented for web mode');
  }

  async get(id: string): Promise<Task | null> {
    // TODO: Web API実装を追加
    console.log('Web backend: getTask not implemented', id);
    throw new Error('Not implemented for web mode');
  }

  async search(condition: TaskSearchCondition): Promise<Task[]> {
    // TODO: Web API実装を追加
    console.log('Web backend: searchTasks not implemented', condition);
    throw new Error('Not implemented for web mode');
  }
}
