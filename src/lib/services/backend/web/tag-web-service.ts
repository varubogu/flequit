import type { Tag, TagSearchCondition } from '$lib/types/task';
import type { TagService } from '$lib/services/backend/tag-service';

export class WebTagService implements TagService {
  async create(tag: Tag): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: createTag not implemented', tag);
    return false; // 仮実装として失敗を返す
  }

  async update(tag: Tag): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: updateTag not implemented', tag);
    return false; // 仮実装として失敗を返す
  }

  async delete(id: string): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: deleteTag not implemented', id);
    return false; // 仮実装として失敗を返す
  }

  async get(id: string): Promise<Tag | null> {
    // TODO: Web API実装を追加
    console.warn('Web backend: getTag not implemented', id);
    return null; // 仮実装としてnullを返す
  }

  async search(condition: TagSearchCondition): Promise<Tag[]> {
    // TODO: Web API実装を追加
    console.warn('Web backend: searchTags not implemented', condition);
    return []; // 仮実装として空配列を返す
  }
}
