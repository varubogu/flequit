import type { TagSearchCondition, Tag } from '$lib/types/tag';
import type {
  ProjectCrudInterface,
  ProjectSearchInterface,
  RestorableProjectInterface
} from '../../types/crud-interface';

/**
 * タグ管理用のバックエンドサービスインターフェース
 */
export interface TagService
  extends ProjectCrudInterface<Tag, Partial<Tag>>,
    ProjectSearchInterface<Tag, TagSearchCondition>,
    RestorableProjectInterface {}
