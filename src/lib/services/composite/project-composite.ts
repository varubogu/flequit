import type { Project } from '$lib/types/project';
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
	}): Promise<Project | null> {
		try {
			const newProject = await ProjectCrudService.create(projectData);
			// ローカルストアも更新
			await projectStore.addProject(projectData);
			return newProject;
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

			// ローカルストアも更新
			await projectStore.updateProject(projectId, updates);
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
				// ローカルストアからも削除
				await projectStore.deleteProject(projectId);
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
		await projectStore.reorderProjects(fromIndex, toIndex);
	},

	/**
	 * プロジェクト位置移動（Store操作）
	 */
	async moveProjectToPosition(projectId: string, targetIndex: number): Promise<void> {
		await projectStore.moveProjectToPosition(projectId, targetIndex);
	},

	/**
	 * プロジェクトのアーカイブ状態変更（バックエンド + Store更新）
	 */
	async archiveProject(projectId: string, isArchived: boolean): Promise<boolean> {
		const result = await this.updateProject(projectId, { is_archived: isArchived });
		return result !== null;
	}
};
