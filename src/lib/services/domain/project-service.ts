import type { Project, ProjectTree } from '$lib/types/project';
import { resolveBackend } from '$lib/infrastructure/backend-client';
import { errorHandler } from '$lib/stores/error-handler.svelte';

/**
 * プロジェクトドメインサービス
 *
 * 責務:
 * 1. バックエンドへの登録 (resolveBackend経由)
 * 2. プロジェクトCRUD操作
 */
export const ProjectService = {
  /**
   * 新しいプロジェクトを作成します
   */
  async createProject(projectData: {
    name: string;
    description?: string;
    color?: string;
    order_index?: number;
  }): Promise<Project> {
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: projectData.name,
      description: projectData.description,
      color: projectData.color,
      orderIndex: projectData.order_index ?? 0,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      const backend = await resolveBackend();
      await backend.project.create(newProject);
      return newProject;
    } catch (error) {
      console.error('Failed to create project:', error);
      errorHandler.addSyncError('プロジェクト作成', 'project', newProject.id, error);
      throw error;
    }
  },

  /**
   * プロジェクトを更新します
   */
  async updateProject(
    projectId: string,
    updates: {
      name?: string;
      description?: string;
      color?: string;
      order_index?: number;
      is_archived?: boolean;
    }
  ): Promise<Project | null> {
    try {
      const backend = await resolveBackend();

      const patchData = {
        ...updates,
        updated_at: new Date()
      };

      const success = await backend.project.update(projectId, patchData);

      if (success) {
        return await backend.project.get(projectId);
      }
      return null;
    } catch (error) {
      console.error('Failed to update project:', error);
      errorHandler.addSyncError('プロジェクト更新', 'project', projectId, error);
      throw error;
    }
  },

  /**
   * プロジェクトを削除します
   */
  async deleteProject(projectId: string): Promise<boolean> {
    try {
      const backend = await resolveBackend();
      return await backend.project.delete(projectId);
    } catch (error) {
      console.error('Failed to delete project:', error);
      errorHandler.addSyncError('プロジェクト削除', 'project', projectId, error);
      throw error;
    }
  },

  /**
   * プロジェクトツリーを作成します（TaskStore互換）
   */
  async createProjectTree(projectData: {
    name: string;
    description?: string;
    color?: string;
    order_index?: number;
  }): Promise<ProjectTree> {
    const project = await this.createProject(projectData);
    return {
      ...project,
      taskLists: [],
      allTags: []
    };
  }
};
