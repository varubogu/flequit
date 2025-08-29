import type { TaggingService } from '$lib/services/backend/tagging-service';

export class TaggingWebService implements TaggingService {
  // Task Tag operations
  async createTaskTag(taskId: string, tagId: string): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: createTaskTag not implemented', taskId, tagId);
    return false; // 仮実装として失敗を返す
  }

  async deleteTaskTag(taskId: string, tagId: string): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: deleteTaskTag not implemented', taskId, tagId);
    return false; // 仮実装として失敗を返す
  }

  // Subtask Tag operations
  async createSubtaskTag(subtaskId: string, tagId: string): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: createSubtaskTag not implemented', subtaskId, tagId);
    return false; // 仮実装として失敗を返す
  }

  async deleteSubtaskTag(subtaskId: string, tagId: string): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: deleteSubtaskTag not implemented', subtaskId, tagId);
    return false; // 仮実装として失敗を返す
  }
}