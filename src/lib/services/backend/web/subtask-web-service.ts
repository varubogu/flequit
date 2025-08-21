import type { SubTaskSearchCondition, SubTask, SubTaskPatch } from '$lib/types/sub-task';
import type { SubTaskService } from '$lib/services/backend/subtask-service';

export class SubtaskWebService implements SubTaskService {
  async create(subTask: SubTask): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: createSubTask not implemented', subTask);
    return true; // 警告を出しつつ正常終了として扱う
  }

  async update(id: string, patch: SubTaskPatch): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: updateSubTask not implemented', id, patch);
    return true; // 警告を出しつつ正常終了として扱う
  }

  async delete(id: string): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: deleteSubTask not implemented', id);
    return true; // 警告を出しつつ正常終了として扱う
  }

  async get(id: string): Promise<SubTask | null> {
    // TODO: Web API実装を追加
    console.warn('Web backend: getSubTask not implemented (called for data retrieval)', id);
    return null; // 仮実装としてnullを返す
  }

  async search(condition: SubTaskSearchCondition): Promise<SubTask[]> {
    // TODO: Web API実装を追加
    console.warn('Web backend: searchSubTasks not implemented', condition);
    return []; // 仮実装として空配列を返す
  }

}
