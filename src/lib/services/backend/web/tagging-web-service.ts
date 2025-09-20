import type { TaggingService } from '$lib/services/backend/tagging-service';
import type { Tag } from '$lib/types/tag';

export class TaggingWebService implements TaggingService {
  // Task Tag operations
  async createTaskTag(projectId: string, taskId: string, tagName: string): Promise<Tag> {
    // TODO: Web API実装を追加
    console.warn('Web backend: createTaskTag not implemented', projectId, taskId, tagName);
    throw new Error('Web backend: createTaskTag not implemented'); // 仮実装としてエラーを投げる
  }

  async deleteTaskTag(projectId: string, taskId: string, tagId: string): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: deleteTaskTag not implemented', projectId, taskId, tagId);
    return false; // 仮実装として失敗を返す
  }

  // Subtask Tag operations
  async createSubtaskTag(projectId: string, subtaskId: string, tagName: string): Promise<Tag> {
    // TODO: Web API実装を追加
    console.warn('Web backend: createSubtaskTag not implemented', projectId, subtaskId, tagName);
    throw new Error('Web backend: createSubtaskTag not implemented'); // 仮実装としてエラーを投げる
  }

  async deleteSubtaskTag(projectId: string, subtaskId: string, tagId: string): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: deleteSubtaskTag not implemented', projectId, subtaskId, tagId);
    return false; // 仮実装として失敗を返す
  }
}
