import type { TaggingService } from '$lib/infrastructure/backends/tagging-service';
import type { Tag } from '$lib/types/tag';

function createNotImplementedTag(tagName: string): Tag {
  const now = new Date();
  return {
    id: `experimental-web-${tagName}`,
    name: tagName,
    createdAt: now,
    updatedAt: now
  };
}

export class TaggingWebService implements TaggingService {
  // Task Tag operations
  async createTaskTag(projectId: string, taskId: string, tagName: string): Promise<Tag> {
    // TODO: Web API実装を追加
    console.warn('Web backends: createTaskTag not implemented', projectId, taskId, tagName);
    return createNotImplementedTag(tagName);
  }

  async deleteTaskTag(projectId: string, taskId: string, tagId: string): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backends: deleteTaskTag not implemented', projectId, taskId, tagId);
    return false; // 仮実装として失敗を返す
  }

  // Subtask Tag operations
  async createSubtaskTag(projectId: string, subtaskId: string, tagName: string): Promise<Tag> {
    // TODO: Web API実装を追加
    console.warn('Web backends: createSubtaskTag not implemented', projectId, subtaskId, tagName);
    return createNotImplementedTag(tagName);
  }

  async deleteSubtaskTag(projectId: string, subtaskId: string, tagId: string): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backends: deleteSubtaskTag not implemented', projectId, subtaskId, tagId);
    return false; // 仮実装として失敗を返す
  }
}
