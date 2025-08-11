import type { SubTask, SubTaskSearchCondition } from '$lib/types/task';
import type { SubTaskService } from '$lib/services/backend/subtask-service';

export class WebSubTaskService implements SubTaskService {
  async create(subTask: SubTask): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: createSubTask not implemented', subTask);
    return false; // 仮実装として失敗を返す
  }

  async update(subTask: SubTask): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: updateSubTask not implemented', subTask);
    return false; // 仮実装として失敗を返す
  }

  async delete(id: string): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: deleteSubTask not implemented', id);
    return false; // 仮実装として失敗を返す
  }

  async get(id: string): Promise<SubTask | null> {
    // TODO: Web API実装を追加
    console.warn('Web backend: getSubTask not implemented', id);
    return null; // 仮実装としてnullを返す
  }

  async search(condition: SubTaskSearchCondition): Promise<SubTask[]> {
    // TODO: Web API実装を追加
    console.warn('Web backend: searchSubTasks not implemented', condition);
    return []; // 仮実装として空配列を返す
  }
}
