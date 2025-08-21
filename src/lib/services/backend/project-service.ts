import type { ProjectSearchCondition, Project, ProjectPatch } from '$lib/types/project';
import type { CrudInterface, SearchInterface } from '../../types/crud-interface';

/**
 * プロジェクト管理用のバックエンドサービスインターフェース
 */
export interface ProjectService
  extends CrudInterface<Project, ProjectPatch>,
    SearchInterface<Project, ProjectSearchCondition> {}
