import type { TaskList, TaskListSearchCondition } from '$lib/types/task';
import type { TaskListService } from '$lib/services/backend/tasklist-service';

export class WebTaskListService implements TaskListService {
  async create(taskList: TaskList): Promise<boolean> {
    // TODO: Web API実装を追加
    console.log('Web backend: createTaskList not implemented', taskList);
    throw new Error('Not implemented for web mode');
  }

  async update(taskList: TaskList): Promise<boolean> {
    // TODO: Web API実装を追加
    console.log('Web backend: updateTaskList not implemented', taskList);
    throw new Error('Not implemented for web mode');
  }

  async delete(id: string): Promise<boolean> {
    // TODO: Web API実装を追加
    console.log('Web backend: deleteTaskList not implemented', id);
    throw new Error('Not implemented for web mode');
  }

  async get(id: string): Promise<TaskList | null> {
    // TODO: Web API実装を追加
    console.log('Web backend: getTaskList not implemented', id);
    throw new Error('Not implemented for web mode');
  }

  async search(condition: TaskListSearchCondition): Promise<TaskList[]> {
    // TODO: Web API実装を追加
    console.log('Web backend: searchTaskLists not implemented', condition);
    throw new Error('Not implemented for web mode');
  }
}