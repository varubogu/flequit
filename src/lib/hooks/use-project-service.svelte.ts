import { ProjectCompositeService } from '$lib/services/composite/project-composite';
import type { Project, ProjectTree } from '$lib/types/project';

/**
 * プロジェクトサービスインターフェース
 *
 * ProjectCompositeServiceの公開APIを定義します。
 * テスト時にモック実装を提供するために使用されます。
 */
export interface IProjectService {
  createProject(projectData: {
    name: string;
    description?: string;
    color?: string;
    order_index?: number;
  }): Promise<ProjectTree | null>;

  updateProject(
    projectId: string,
    updates: {
      name?: string;
      description?: string;
      color?: string;
      order_index?: number;
      is_archived?: boolean;
    }
  ): Promise<Project | null>;

  deleteProject(projectId: string): Promise<boolean>;
  reorderProjects(fromIndex: number, toIndex: number): Promise<void>;
  moveProjectToPosition(projectId: string, targetIndex: number): Promise<void>;
  archiveProject(projectId: string, isArchived: boolean): Promise<boolean>;
}

/**
 * useProjectService - プロジェクトサービスを取得するComposable
 *
 * 責務: コンポーネントにプロジェクトサービス機能を提供する統一的なインターフェース
 *
 * 利点:
 * - テスト時のモック化が容易
 * - 依存関係の注入パターンに準拠
 * - Svelte 5のrunesパターンに適合
 *
 * 使用例:
 * ```typescript
 * const projectService = useProjectService();
 * const project = await projectService.createProject({ name: 'New Project' });
 * ```
 */
export function useProjectService(): IProjectService {
  return ProjectCompositeService;
}
