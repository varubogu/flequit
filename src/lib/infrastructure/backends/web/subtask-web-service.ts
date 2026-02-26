import type { SubTaskSearchCondition, SubTask } from '$lib/types/sub-task';
import type { SubTaskService } from '../subtask-service';

export class SubtaskWebService implements SubTaskService {
  async create(projectId: string, subTask: SubTask): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backends: createSubTask not implemented', projectId, subTask);
    return true; // 警告を出しつつ正常終了として扱う
  }

  async update(projectId: string, id: string, patch: Partial<SubTask>): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backends: updateSubTask not implemented', projectId, id, patch);
    return true; // 警告を出しつつ正常終了として扱う
  }

  async delete(projectId: string, id: string): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backends: deleteSubTask not implemented', projectId, id);
    return true; // 警告を出しつつ正常終了として扱う
  }

  async get(projectId: string, id: string): Promise<SubTask | null> {
    // TODO: Web API実装を追加
    console.warn(
      'Web backends: getSubTask not implemented (called for data retrieval)',
      projectId,
      id
    );
    return null; // 仮実装としてnullを返す
  }

  async search(projectId: string, condition: SubTaskSearchCondition): Promise<SubTask[]> {
    // TODO: Web API実装を追加
    console.warn('Web backends: searchSubTasks not implemented', projectId, condition);
    return []; // 仮実装として空配列を返す
  }
}
