import type { TaskList, TaskListSearchCondition } from '$lib/types/task';
import type { TaskListService } from '$lib/services/backend/tasklist-service';

export class TasklistWebService implements TaskListService {
  async create(taskList: TaskList): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: createTaskList not implemented', taskList);
    return true; // 警告を出しつつ正常終了として扱う
  }

  async update(taskList: TaskList): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: updateTaskList not implemented', taskList);
    return true; // 警告を出しつつ正常終了として扱う
  }

  async delete(id: string): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: deleteTaskList not implemented', id);
    return true; // 警告を出しつつ正常終了として扱う
  }

  async get(id: string): Promise<TaskList | null> {
    // TODO: Web API実装を追加
    console.warn('Web backend: getTaskList not implemented', id);
    return null; // 仮実装としてnullを返す
  }

  async search(condition: TaskListSearchCondition): Promise<TaskList[]> {
    // TODO: Web API実装を追加
    console.warn('Web backend: searchTaskLists not implemented', condition);
    return []; // 仮実装として空配列を返す
  }
}
