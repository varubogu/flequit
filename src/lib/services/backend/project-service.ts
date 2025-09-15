import type { ProjectSearchCondition, Project } from '$lib/types/project';
import type { CrudInterface, SearchInterface } from '../../types/crud-interface';

/**
 * プロジェクト管理用のバックエンドサービスインターフェース
 */
export interface ProjectService
  extends CrudInterface<Project, Partial<Project>>,
    SearchInterface<Project, ProjectSearchCondition> {}
