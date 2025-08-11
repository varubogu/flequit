import type { Project, ProjectSearchCondition } from '$lib/types/task';
import type { CrudInterface, SearchInterface } from '../../types/crud-interface';

/**
 * プロジェクト管理用のバックエンドサービスインターフェース
 */
export interface ProjectService
  extends CrudInterface<Project>,
    SearchInterface<Project, ProjectSearchCondition> {}
