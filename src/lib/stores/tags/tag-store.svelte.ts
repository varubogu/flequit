import type { Tag } from '$lib/types/tag';
import { SvelteDate } from 'svelte/reactivity';

/**
 * Tag Store - 状態管理のみ
 *
 * Responsibilities:
 * - タグのリアクティブ状態管理
 * - タグの検索・クエリ
 *
 * 注意: バックエンド通信やビジネスロジックは TagService (domain層) に委譲
 */
export class TagStore {
  tags = $state<Tag[]>([]);

  // Computed values
  get allTags(): Tag[] {
    return this.tags;
  }

  get tagNames(): string[] {
    return this.tags.map((tag) => tag.name);
  }

  // 状態更新メソッド（Services層から呼ばれる）
  setTags(tags: Tag[]) {
    this.tags = tags;
  }

  addTagToStore(tag: Tag) {
    this.tags.push(tag);
  }

  updateTagInStore(tagId: string, updates: Partial<Tag>) {
    const tagIndex = this.tags.findIndex((tag) => tag.id === tagId);
    if (tagIndex !== -1) {
      this.tags[tagIndex] = {
        ...this.tags[tagIndex],
        ...updates,
        updatedAt: new SvelteDate()
      };
    }
  }

  deleteTagFromStore(tagId: string) {
    const tagIndex = this.tags.findIndex((tag) => tag.id === tagId);
    if (tagIndex !== -1) {
      this.tags.splice(tagIndex, 1);
    }
  }

  // 既存のタグを追加または更新（サンプルデータ初期化用）
  addTagWithId(tag: Tag): Tag {
    const existingTag = this.tags.find((t) => t.id === tag.id);
    if (existingTag) {
      // 既存タグを更新
      Object.assign(existingTag, tag);
      return existingTag;
    }

    // 新規タグを追加
    this.tags.push(tag);
    return tag;
  }

  // Query methods
  findTagByName(name: string): Tag | undefined {
    return this.tags.find((tag) => tag.name.toLowerCase() === name.toLowerCase());
  }

  searchTags(query: string): Tag[] {
    if (!query.trim()) return this.tags; // Return all tags for empty query

    const lowerQuery = query.toLowerCase();
    return this.tags.filter((tag) => tag.name.toLowerCase().includes(lowerQuery));
  }

  findTagById(tagId: string): Tag | undefined {
    return this.tags.find((tag) => tag.id === tagId);
  }
}

// Export singleton instance
export const tagStore = new TagStore();
