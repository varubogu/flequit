import type { TagSearchCondition, Tag } from '$lib/types/tag';
import type { TagService } from '$lib/infrastructure/backends/tag-service';

export class TagWebService implements TagService {
  async create(projectId: string, tag: Tag): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backends: createTag not implemented', projectId, tag);
    return true; // 警告を出しつつ正常終了として扱う
  }

  async update(projectId: string, id: string, patch: Partial<Tag>): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backends: updateTag not implemented', projectId, id, patch);
    return true; // 警告を出しつつ正常終了として扱う
  }

  async delete(projectId: string, id: string): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backends: deleteTag not implemented', projectId, id);
    return true; // 警告を出しつつ正常終了として扱う
  }

  async get(projectId: string, id: string): Promise<Tag | null> {
    // TODO: Web API実装を追加
    console.warn('Web backends: getTag not implemented', projectId, id);
    return null; // 仮実装としてnullを返す
  }

  async search(projectId: string, condition: TagSearchCondition): Promise<Tag[]> {
    // TODO: Web API実装を追加
    console.warn('Web backends: searchTags not implemented', projectId, condition);
    return []; // 仮実装として空配列を返す
  }

}
