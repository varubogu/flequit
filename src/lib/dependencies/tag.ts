import { TagService } from '$lib/services/domain/tag';
import { TagBookmarkService } from '$lib/services/domain/tag-bookmark';
import type { Tag } from '$lib/types/tag';

export interface TagGateway {
  createTag(
    projectId: string,
    tagData: { name: string; color?: string }
  ): Promise<Tag | null>;
  updateTag(projectId: string, tagId: string, updates: Partial<Tag>): Promise<void>;
  deleteTag(projectId: string, tagId: string, onDelete?: (tagId: string) => void): Promise<void>;
  getOrCreateTag(projectId: string, name: string, color?: string): Promise<Tag | null>;
  getProjectIdByTagId(tagId: string): Promise<string | null>;
}

export function resolveTagGateway(): TagGateway {
  return TagService;
}

export interface TagBookmarkGateway {
  toggleBookmark(projectId: string, tagId: string): Promise<void>;
  create(projectId: string, tagId: string): Promise<unknown>;
  delete(bookmarkId: string, tagId: string): Promise<void>;
  reorder(projectId: string, fromIndex: number, toIndex: number): Promise<void>;
}

export function resolveTagBookmarkGateway(): TagBookmarkGateway {
  return TagBookmarkService;
}
