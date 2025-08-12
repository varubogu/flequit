import type { TagSearchCondition } from "$lib/types/tag";
import type { Tag } from "$lib/types/tag";
import type { CrudInterface, SearchInterface } from '../../types/crud-interface';

/**
 * タグ管理用のバックエンドサービスインターフェース
 */
export interface TagService extends CrudInterface<Tag>, SearchInterface<Tag, TagSearchCondition> {}
