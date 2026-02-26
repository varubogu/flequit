import type { Tag } from '$lib/types/tag';
import { tagStore as tagStoreInternal } from '$lib/stores/tags/tag-store.svelte';
import { resolveTagGateway, type TagGateway } from '$lib/dependencies/tag';

/**
 * タグの検索・取得操作
 *
 * 責務: タグの検索、名前による検索、プロジェクトID取得
 */
export class TagQueries {
  private readonly tagGateway: TagGateway;

  constructor(tagGateway: TagGateway = resolveTagGateway()) {
    this.tagGateway = tagGateway;
  }

  /**
   * すべてのタグを取得
   */
  get allTags(): Tag[] {
    return tagStoreInternal.allTags;
  }

  /**
   * タグ名のリストを取得
   */
  get tagNames(): string[] {
    return tagStoreInternal.tagNames;
  }

  /**
   * 名前でタグを検索
   */
  findTagByName(name: string): Tag | undefined {
    return tagStoreInternal.findTagByName(name);
  }

  /**
   * クエリでタグを検索
   */
  searchTags(query: string): Tag[] {
    return tagStoreInternal.searchTags(query);
  }

  /**
   * タグIDからプロジェクトIDを取得
   */
  async getProjectIdByTagId(tagId: string): Promise<string | null> {
    return this.tagGateway.getProjectIdByTagId(tagId);
  }
}
