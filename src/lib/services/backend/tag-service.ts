import type { Tag, TagSearchCondition } from '$lib/types/task';
import type { CrudInterface, SearchInterface } from '../../types/crud-interface';

/**
 * タグ管理用のバックエンドサービスインターフェース
 */
export interface TagService extends CrudInterface<Tag>, SearchInterface<Tag, TagSearchCondition> {}
