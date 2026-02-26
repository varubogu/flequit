import { TagService } from '$lib/services/domain/tag';
import type { Tag } from '$lib/types/tag';

/**
 * タグサービスインターフェース
 *
 * TagServiceの公開APIを定義します。
 * テスト時にモック実装を提供するために使用されます。
 */
export interface ITagService {
  createTag(projectId: string, tagData: { name: string; color?: string }): Promise<Tag | null>;
  updateTag(projectId: string, tagId: string, updates: Partial<Tag>): Promise<void>;
  deleteTag(projectId: string, tagId: string, onDelete?: (tagId: string) => void): Promise<void>;
  getOrCreateTag(projectId: string, name: string, color?: string): Promise<Tag | null>;
  getProjectIdByTagId(tagId: string): Promise<string | null>;
  addBookmark(projectId: string, tagId: string): Promise<void>;
  removeBookmark(projectId: string, tagId: string): Promise<void>;
  notifyTagUpdate(tag: Tag): void;
}

/**
 * useTagService - タグサービスを取得するComposable
 *
 * 責務: コンポーネントにタグサービス機能を提供する統一的なインターフェース
 *
 * 利点:
 * - テスト時のモック化が容易
 * - 依存関係の注入パターンに準拠
 * - Svelte 5のrunesパターンに適合
 *
 * 使用例:
 * ```typescript
 * const tagService = useTagService();
 * const tag = await tagService.createTag(projectId, { name: 'New Tag' });
 * ```
 */
export function useTagService(): ITagService {
  return TagService;
}
