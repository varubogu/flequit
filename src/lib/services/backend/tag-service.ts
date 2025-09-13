import type { TagSearchCondition, Tag, TagPatch } from '$lib/types/tag';
import type { ProjectCrudInterface, ProjectSearchInterface } from '../../types/crud-interface';

/**
 * タグ管理用のバックエンドサービスインターフェース
 */
export interface TagService 
  extends ProjectCrudInterface<Tag, TagPatch>, 
    ProjectSearchInterface<Tag, TagSearchCondition> {}
