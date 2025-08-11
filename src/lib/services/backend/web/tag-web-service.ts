import type { Tag, TagSearchCondition } from '$lib/types/task';
import type { TagService } from '$lib/services/backend/tag-service';

export class WebTagService implements TagService {
  async create(tag: Tag): Promise<boolean> {
    // TODO: Web API実装を追加
    console.log('Web backend: createTag not implemented', tag);
    throw new Error('Not implemented for web mode');
  }

  async update(tag: Tag): Promise<boolean> {
    // TODO: Web API実装を追加
    console.log('Web backend: updateTag not implemented', tag);
    throw new Error('Not implemented for web mode');
  }

  async delete(id: string): Promise<boolean> {
    // TODO: Web API実装を追加
    console.log('Web backend: deleteTag not implemented', id);
    throw new Error('Not implemented for web mode');
  }

  async get(id: string): Promise<Tag | null> {
    // TODO: Web API実装を追加
    console.log('Web backend: getTag not implemented', id);
    throw new Error('Not implemented for web mode');
  }

  async search(condition: TagSearchCondition): Promise<Tag[]> {
    // TODO: Web API実装を追加
    console.log('Web backend: searchTags not implemented', condition);
    throw new Error('Not implemented for web mode');
  }
}
