import type { IProjectStore } from '$lib/types/store-interfaces';
import type { ProjectTree } from '$lib/types/project';
import type { ISelectionStore } from '$lib/types/store-interfaces';
import { selectionStore } from './selection-store.svelte';
import { tagStore } from './tags.svelte';
import { ProjectService } from '$lib/services/domain/project-service';
import { errorHandler } from './error-handler.svelte';
import { SvelteDate } from 'svelte/reactivity';
import { loadProjectsData as loadProjects, registerTagsToStore } from '$lib/services/data-loader';

/**
 * プロジェクト管理ストア
 *
 * 責務: プロジェクトのCRUD操作、並び替え
 * 依存: SelectionStore（選択状態の参照）
 *
 * TaskStoreから分離して、プロジェクト管理の責務を明確化しています。
 */
export class ProjectStore implements IProjectStore {
	projects = $state<ProjectTree[]>([]);

	constructor(private selection: ISelectionStore) {}

	// 派生状態
	get selectedProject(): ProjectTree | null {
		const id = this.selection.selectedProjectId;
		if (!id) return null;
		return this.projects.find((p) => p.id === id) ?? null;
	}

	// CRUD操作
	async addProject(project: { name: string; description?: string; color?: string }) {
		try {
			const projectWithOrderIndex = {
				...project,
				order_index: this.projects.length
			};
			const newProject = await ProjectService.createProjectTree(projectWithOrderIndex);
			this.projects.push(newProject);
			return newProject;
		} catch (error) {
			console.error('Failed to create project:', error);
			errorHandler.addSyncError('プロジェクト作成', 'project', 'new', error);
			return null;
		}
	}

	async updateProject(
		projectId: string,
		updates: {
			name?: string;
			description?: string;
			color?: string;
			order_index?: number;
			is_archived?: boolean;
		}
	) {
		try {
			const updatedProject = await ProjectService.updateProject(projectId, updates);
			if (updatedProject) {
				const projectIndex = this.projects.findIndex((p) => p.id === projectId);
				if (projectIndex !== -1) {
					this.projects[projectIndex] = { ...this.projects[projectIndex], ...updatedProject };
				}
			}
			// 更新操作は定期保存に任せる
			return updatedProject;
		} catch (error) {
			console.error('Failed to update project:', error);
			errorHandler.addSyncError('プロジェクト更新', 'project', projectId, error);
			return null;
		}
	}

	async deleteProject(projectId: string) {
		try {
			const success = await ProjectService.deleteProject(projectId);
			if (success) {
				const projectIndex = this.projects.findIndex((p) => p.id === projectId);
				if (projectIndex !== -1) {
					this.projects.splice(projectIndex, 1);
					// 削除されたプロジェクトが選択されていた場合はクリア
					if (this.selection.selectedProjectId === projectId) {
						this.selection.selectProject(null);
						this.selection.selectTask(null);
						this.selection.selectSubTask(null);
					}
				}
			}
			return success;
		} catch (error) {
			console.error('Failed to delete project:', error);
			errorHandler.addSyncError('プロジェクト削除', 'project', projectId, error);
			return false;
		}
	}

	// 並び替え
	async reorderProjects(fromIndex: number, toIndex: number) {
		if (
			fromIndex === toIndex ||
			fromIndex < 0 ||
			toIndex < 0 ||
			fromIndex >= this.projects.length ||
			toIndex >= this.projects.length
		) {
			return;
		}

		const [movedProject] = this.projects.splice(fromIndex, 1);
		this.projects.splice(toIndex, 0, movedProject);

		// Update order indices and sync to backends
		for (let index = 0; index < this.projects.length; index++) {
			const project = this.projects[index];
			project.orderIndex = index;
			project.updatedAt = new SvelteDate();

			try {
				// サービス層経由でバックエンドを更新（循環依存を避ける）
				await ProjectService.updateProject(project.id, { order_index: index });
			} catch (error) {
				console.error('Failed to sync project order to backends:', error);
				errorHandler.addSyncError('プロジェクト順序更新', 'project', project.id, error);
			}
		}
	}

	async moveProjectToPosition(projectId: string, targetIndex: number) {
		const currentIndex = this.projects.findIndex((p) => p.id === projectId);
		if (currentIndex === -1 || currentIndex === targetIndex) return;

		await this.reorderProjects(currentIndex, targetIndex);
	}

	// ヘルパー
	getProjectById(id: string): ProjectTree | null {
		return this.projects.find((p) => p.id === id) ?? null;
	}

	// データロード
	loadProjects(projects: ProjectTree[]) {
		// data-loaderを使用してプロジェクトデータを読み込み・変換
		const loadedData = loadProjects(projects);

		// 変換済みプロジェクトデータを設定
		this.projects = loadedData.projects;

		// タグストアにタグを登録し、初期ブックマークを設定
		registerTagsToStore(tagStore, loadedData);
	}

	setProjects(projects: ProjectTree[]) {
		this.loadProjects(projects);
	}

	// テスト用
	reset() {
		this.projects = [];
	}
}

// シングルトンエクスポート
export const projectStore = new ProjectStore(selectionStore);
