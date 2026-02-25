import type { Project, ProjectTree } from '$lib/types/project';
import { resolveBackend } from '$lib/infrastructure/backend-client';
import { errorHandler } from '$lib/stores/error-handler.svelte';
import { getCurrentUserId } from '$lib/services/domain/current-user-id';

/**
 * ProjectBackend - プロジェクトのバックエンド通信を担当
 *
 * 責務:
 * - バックエンド（Tauri/Web）へのプロジェクトの永続化
 * - CRUD操作のバックエンド呼び出し
 * - バックエンドエラーのハンドリング
 *
 * 注意: このサービスはローカル状態（store）を操作しません。
 * ローカル状態の操作は ProjectOperations が担当します。
 */
export const ProjectBackend = {
	/**
	 * 新しいプロジェクトを作成します
	 */
	async create(projectData: {
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
			updatedAt: new Date(),
			deleted: false,
			updatedBy: getCurrentUserId()
		};

		try {
			const backend = await resolveBackend();
			await backend.project.create(newProject, getCurrentUserId());
			return newProject;
		} catch (error) {
			console.error('Failed to create project:', error);
			errorHandler.addSyncError('プロジェクト作成', 'project', newProject.id, error);
			throw error;
		}
	},

	/**
	 * プロジェクトを取得します
	 */
	async get(projectId: string): Promise<Project | null> {
		try {
			const backend = await resolveBackend();
			return await backend.project.get(projectId, getCurrentUserId());
		} catch (error) {
			console.error('Failed to get project:', error);
			throw error;
		}
	},

	/**
	 * プロジェクトを更新します
	 */
	async update(
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

			const success = await backend.project.update(projectId, patchData, getCurrentUserId());

			if (success) {
				return await backend.project.get(projectId, getCurrentUserId());
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
	async delete(projectId: string): Promise<boolean> {
		try {
			const backend = await resolveBackend();
			return await backend.project.delete(projectId, getCurrentUserId());
		} catch (error) {
			console.error('Failed to delete project:', error);
			errorHandler.addSyncError('プロジェクト削除', 'project', projectId, error);
			throw error;
		}
	},

	/**
	 * 論理削除されたプロジェクトをバックエンドから復元します
	 */
	async restore(projectId: string): Promise<boolean> {
		try {
			const backend = await resolveBackend();
			return await backend.project.restore(projectId, getCurrentUserId());
		} catch (error) {
			console.error('Failed to restore project:', error);
			errorHandler.addSyncError('プロジェクト復元', 'project', projectId, error);
			throw error;
		}
	},

	/**
	 * プロジェクトツリーを作成します（Store互換用）
	 */
	async createProjectTree(projectData: {
		name: string;
		description?: string;
		color?: string;
		order_index?: number;
	}): Promise<ProjectTree> {
		const project = await this.create(projectData);
		return {
			...project,
			taskLists: [],
			allTags: []
		};
	}
};
