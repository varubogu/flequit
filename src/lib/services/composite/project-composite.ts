import type { Project, ProjectTree } from '$lib/types/project';
import { ProjectCrudService } from '$lib/services/domain/project/project-crud';
import { projectStore } from '$lib/stores/project-store.svelte';

/**
 * プロジェクトコンポジットサービス（CRUD + Store更新）
 *
 * 責務:
 * 1. バックエンド操作（ProjectCrudServiceを使用）
 * 2. Store更新（projectStoreを使用）
 * 3. エラーハンドリング
 *
 * 使用例:
 * - コンポーネントから直接呼び出す
 * - バックエンドとStoreの両方を更新したい場合
 */
export const ProjectCompositeService = {
	/**
	 * プロジェクト作成（バックエンド + Store更新）
	 */
	async createProject(projectData: {
		name: string;
		description?: string;
		color?: string;
		order_index?: number;
	}): Promise<ProjectTree | null> {
		try {
			const newProjectTree = await ProjectCrudService.createProjectTree(projectData);
			projectStore.addProjectToStore(newProjectTree);
			return newProjectTree;
		} catch (error) {
			console.error('Failed to create project:', error);
			return null;
		}
	},

	/**
	 * プロジェクト更新（バックエンド + Store更新）
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
			const updatedProject = await ProjectCrudService.update(projectId, updates);
			if (!updatedProject) return null;

			projectStore.updateProjectInStore(projectId, {
				name: updatedProject.name,
				description: updatedProject.description,
				color: updatedProject.color,
				orderIndex: updatedProject.orderIndex,
				isArchived: updatedProject.isArchived,
				updatedAt: updatedProject.updatedAt
			});
			return updatedProject;
		} catch (error) {
			console.error('Failed to update project:', error);
			return null;
		}
	},

	/**
	 * プロジェクト削除（バックエンド + Store更新）
	 */
	async deleteProject(projectId: string): Promise<boolean> {
		try {
			const success = await ProjectCrudService.delete(projectId);
			if (success) {
				projectStore.removeProjectFromStore(projectId);
			}
			return success;
		} catch (error) {
			console.error('Failed to delete project:', error);
			return false;
		}
	},

	/**
	 * プロジェクト並べ替え（Store操作）
	 */
	async reorderProjects(fromIndex: number, toIndex: number): Promise<void> {
		const updatedProjects = projectStore.reorderProjectsInStore(fromIndex, toIndex);
		await Promise.allSettled(
			updatedProjects.map((project) =>
				ProjectCrudService.update(project.id, { order_index: project.orderIndex })
			)
		);
	},

	/**
	 * プロジェクト位置移動（Store操作）
	 */
	async moveProjectToPosition(projectId: string, targetIndex: number): Promise<void> {
		const updatedProjects = projectStore.moveProjectToPositionInStore(projectId, targetIndex);
		await Promise.allSettled(
			updatedProjects.map((project) =>
				ProjectCrudService.update(project.id, { order_index: project.orderIndex })
			)
		);
	},

	/**
	 * プロジェクトのアーカイブ状態変更（バックエンド + Store更新）
	 */
	async archiveProject(projectId: string, isArchived: boolean): Promise<boolean> {
		const result = await this.updateProject(projectId, { is_archived: isArchived });
		return result !== null;
	}
};
