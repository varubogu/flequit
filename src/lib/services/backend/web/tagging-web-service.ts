import type { TaggingService } from '$lib/services/backend/tagging-service';

export class TaggingWebService implements TaggingService {
  // Task Tag operations
  async createTaskTag(projectId: string, taskId: string, tagId: string): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: createTaskTag not implemented', projectId, taskId, tagId);
    return false; // 仮実装として失敗を返す
  }

  async deleteTaskTag(projectId: string, taskId: string, tagId: string): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: deleteTaskTag not implemented', projectId, taskId, tagId);
    return false; // 仮実装として失敗を返す
  }

  // Subtask Tag operations
  async createSubtaskTag(projectId: string, subtaskId: string, tagId: string): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: createSubtaskTag not implemented', projectId, subtaskId, tagId);
    return false; // 仮実装として失敗を返す
  }

  async deleteSubtaskTag(projectId: string, subtaskId: string, tagId: string): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: deleteSubtaskTag not implemented', projectId, subtaskId, tagId);
    return false; // 仮実装として失敗を返す
  }
}