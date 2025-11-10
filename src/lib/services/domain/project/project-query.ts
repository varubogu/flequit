import type { Project, ProjectWithLists } from '$lib/types/project';
import type { TaskList } from '$lib/types/task-list';
import { taskStore } from '$lib/stores/tasks.svelte';

/**
 * プロジェクトクエリサービス（読み取り専用）
 *
 * 責務:
 * 1. Storeからのデータ取得
 * 2. 検索・フィルタリング
 * 3. データ変換
 *
 * 注意: このサービスは読み取り専用です。データの変更はできません。
 */
export const ProjectQueryService = {
	/**
	 * プロジェクトIDから取得
	 */
	getById(projectId: string): Project | null {
		const project = taskStore.projects.find((p) => p.id === projectId);
		return project || null;
	},

	/**
	 * プロジェクト名から取得
	 */
	getByName(name: string): Project | null {
		const project = taskStore.projects.find((p) => p.name === name);
		return project || null;
	},

	/**
	 * プロジェクトIDからタスクリスト付きで取得
	 */
	getWithListsById(projectId: string): ProjectWithLists | null {
		const project = taskStore.projects.find((p) => p.id === projectId);
		if (!project) return null;

		return {
			...project,
			taskLists: project.taskLists.map((list) => ({
				id: list.id,
				projectId: list.projectId,
				name: list.name,
				description: list.description,
				color: list.color,
				orderIndex: list.orderIndex,
				isArchived: list.isArchived,
				createdAt: list.createdAt,
				updatedAt: list.updatedAt,
				deleted: list.deleted,
				updatedBy: list.updatedBy
			}))
		};
	},

	/**
	 * 全プロジェクトを取得
	 */
	getAll(): Project[] {
		return taskStore.projects.map((project) => ({
			id: project.id,
			name: project.name,
			description: project.description,
			color: project.color,
			orderIndex: project.orderIndex,
			isArchived: project.isArchived,
			createdAt: project.createdAt,
			updatedAt: project.updatedAt,
			deleted: project.deleted,
			updatedBy: project.updatedBy
		}));
	},

	/**
	 * プロジェクトを名前で検索（部分一致）
	 */
	searchByName(searchTerm: string): Project[] {
		const lowercaseSearch = searchTerm.toLowerCase();
		return this.getAll().filter(
			(project) =>
				project.name.toLowerCase().includes(lowercaseSearch) ||
				(project.description && project.description.toLowerCase().includes(lowercaseSearch))
		);
	},

	/**
	 * アクティブなプロジェクトのみ取得
	 */
	getActive(): Project[] {
		return this.getAll().filter((project) => !project.isArchived);
	},

	/**
	 * アーカイブ済みプロジェクトのみ取得
	 */
	getArchived(): Project[] {
		return this.getAll().filter((project) => project.isArchived);
	},

	/**
	 * 選択中のプロジェクトIDを取得
	 *
	 * @deprecated UI状態管理はComponent層で行うべきです
	 */
	getSelectedProjectId(): string | null {
		return taskStore.selectedProjectId;
	},

	/**
	 * タスクIDからプロジェクトとタスクリストを検索
	 */
	findProjectAndTaskListByTaskId(
		taskId: string
	): { project: Project; taskList: TaskList } | null {
		const result = taskStore.getTaskProjectAndList(taskId);
		if (!result) return null;

		return {
			project: {
				id: result.project.id,
				name: result.project.name,
				description: result.project.description,
				color: result.project.color,
				orderIndex: result.project.orderIndex,
				isArchived: result.project.isArchived,
				createdAt: result.project.createdAt,
				updatedAt: result.project.updatedAt,
				deleted: result.project.deleted,
				updatedBy: result.project.updatedBy
			},
			taskList: {
				id: result.taskList.id,
				projectId: result.taskList.projectId,
				name: result.taskList.name,
				description: result.taskList.description,
				color: result.taskList.color,
				orderIndex: result.taskList.orderIndex,
				isArchived: result.taskList.isArchived,
				createdAt: result.taskList.createdAt,
				updatedAt: result.taskList.updatedAt,
				deleted: result.taskList.deleted,
				updatedBy: result.taskList.updatedBy
			}
		};
	}
};
