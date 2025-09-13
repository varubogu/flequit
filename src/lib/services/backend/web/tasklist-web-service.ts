import type { TaskListSearchCondition, TaskList, TaskListPatch } from '$lib/types/task-list';
import type { TaskListService } from '$lib/services/backend/tasklist-service';

export class TasklistWebService implements TaskListService {
  async create(projectId: string, taskList: TaskList): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: createTaskList not implemented', projectId, taskList);
    return true; // 警告を出しつつ正常終了として扱う
  }

  async update(projectId: string, id: string, patch: TaskListPatch): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: updateTaskList not implemented', projectId, id, patch);
    return true; // 警告を出しつつ正常終了として扱う
  }

  async delete(projectId: string, id: string): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: deleteTaskList not implemented', projectId, id);
    return true; // 警告を出しつつ正常終了として扱う
  }

  async get(projectId: string, id: string): Promise<TaskList | null> {
    // TODO: Web API実装を追加
    console.warn('Web backend: getTaskList not implemented', projectId, id);
    return null; // 仮実装としてnullを返す
  }

  async search(projectId: string, condition: TaskListSearchCondition): Promise<TaskList[]> {
    // TODO: Web API実装を追加
    console.warn('Web backend: searchTaskLists not implemented', projectId, condition);
    return []; // 仮実装として空配列を返す
  }

}
