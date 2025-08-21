import type { TagSearchCondition, Tag, TagPatch } from '$lib/types/tag';
import type { CrudInterface, SearchInterface } from '../../types/crud-interface';

/**
 * タグ管理用のバックエンドサービスインターフェース
 */
export interface TagService 
  extends CrudInterface<Tag, TagPatch>, 
    SearchInterface<Tag, TagSearchCondition> {}
