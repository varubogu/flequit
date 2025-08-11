import type { SubTask, SubTaskSearchCondition } from '$lib/types/task';
import type { SubTaskService } from '$lib/services/backend/subtask-service';

export class WebSubTaskService implements SubTaskService {
  async create(subTask: SubTask): Promise<boolean> {
    // TODO: Web API実装を追加
    console.log('Web backend: createSubTask not implemented', subTask);
    throw new Error('Not implemented for web mode');
  }

  async update(subTask: SubTask): Promise<boolean> {
    // TODO: Web API実装を追加
    console.log('Web backend: updateSubTask not implemented', subTask);
    throw new Error('Not implemented for web mode');
  }

  async delete(id: string): Promise<boolean> {
    // TODO: Web API実装を追加
    console.log('Web backend: deleteSubTask not implemented', id);
    throw new Error('Not implemented for web mode');
  }

  async get(id: string): Promise<SubTask | null> {
    // TODO: Web API実装を追加
    console.log('Web backend: getSubTask not implemented', id);
    throw new Error('Not implemented for web mode');
  }

  async search(condition: SubTaskSearchCondition): Promise<SubTask[]> {
    // TODO: Web API実装を追加
    console.log('Web backend: searchSubTasks not implemented', condition);
    throw new Error('Not implemented for web mode');
  }
}