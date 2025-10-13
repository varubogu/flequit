import type { Project, ProjectTree, ProjectWithLists } from '$lib/types/project';
import type { TaskList } from '$lib/types/task-list';
import { ProjectCrudService } from '$lib/services/domain/project/project-crud';
import { ProjectQueryService } from '$lib/services/domain/project/project-query';
import { ProjectHelpers } from '$lib/services/domain/project/project-helpers';
import { ProjectCompositeService } from './project-composite';
import { TaskListCompositeService } from './task-list-composite';
import { taskStore } from '$lib/stores/tasks.svelte';

/**
 * @deprecated Phase 2完了後に削除予定
 *
 * 後方互換性のため残されています。
 *
 * 新規コードでは以下を使用してください:
 * - ProjectCrudService（バックエンド操作のみ）
 * - ProjectCompositeService（CRUD + Store更新）
 * - ProjectQueryService（データ取得・検索）
 * - ProjectHelpers（ヘルパー関数）
 */
export const ProjectService = {
	/**
	 * @deprecated ProjectCrudService.create() を使用してください
	 */
	async createProject(projectData: {
		name: string;
		description?: string;
		color?: string;
		order_index?: number;
	}): Promise<Project> {
		console.warn(
			'ProjectService.createProject() is deprecated. Use ProjectCrudService.create() instead.'
		);
		return ProjectCrudService.create(projectData);
	},

	/**
	 * @deprecated ProjectCrudService.update() を使用してください
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
		console.warn(
			'ProjectService.updateProject() is deprecated. Use ProjectCrudService.update() instead.'
		);
		return ProjectCrudService.update(projectId, updates);
	},

	/**
	 * @deprecated ProjectCrudService.delete() を使用してください
	 */
	async deleteProject(projectId: string): Promise<boolean> {
		console.warn(
			'ProjectService.deleteProject() is deprecated. Use ProjectCrudService.delete() instead.'
		);
		return ProjectCrudService.delete(projectId);
	},

	/**
	 * @deprecated ProjectCrudService.createProjectTree() を使用してください
	 */
	async createProjectTree(projectData: {
		name: string;
		description?: string;
		color?: string;
		order_index?: number;
	}): Promise<ProjectTree> {
		console.warn(
			'ProjectService.createProjectTree() is deprecated. Use ProjectCrudService.createProjectTree() instead.'
		);
		return ProjectCrudService.createProjectTree(projectData);
	}
};

/**
 * @deprecated Phase 2完了後に削除予定
 *
 * 後方互換性のため残されています。
 *
 * 新規コードでは以下を使用してください:
 * - ProjectCompositeService（プロジェクト操作 + Store更新）
 * - TaskListCompositeService（タスクリスト操作 + Store更新）
 * - ProjectQueryService（データ取得・検索）
 * - ProjectHelpers（ヘルパー関数）
 */
export class ProjectsService {
	// ========================================
	// プロジェクトCRUD
	// ========================================

	/**
	 * @deprecated ProjectCompositeService.createProject() を使用してください
	 */
	static async createProject(projectData: {
		name: string;
		description?: string;
		color?: string;
		order_index?: number;
	}): Promise<Project | null> {
		console.warn(
			'ProjectsService.createProject() is deprecated. Use ProjectCompositeService.createProject() instead.'
		);
		return ProjectCompositeService.createProject(projectData);
	}

	/**
	 * @deprecated ProjectCompositeService.updateProject() を使用してください
	 */
	static async updateProject(
		projectId: string,
		updates: {
			name?: string;
			description?: string;
			color?: string;
			order_index?: number;
			is_archived?: boolean;
		}
	): Promise<Project | null> {
		console.warn(
			'ProjectsService.updateProject() is deprecated. Use ProjectCompositeService.updateProject() instead.'
		);
		return ProjectCompositeService.updateProject(projectId, updates);
	}

	/**
	 * @deprecated ProjectCompositeService.deleteProject() を使用してください
	 */
	static async deleteProject(projectId: string): Promise<boolean> {
		console.warn(
			'ProjectsService.deleteProject() is deprecated. Use ProjectCompositeService.deleteProject() instead.'
		);
		return ProjectCompositeService.deleteProject(projectId);
	}

	/**
	 * @deprecated Component層で実装してください
	 */
	static selectProject(_projectId: string | null): void {
		console.warn(
			'ProjectsService.selectProject() is deprecated. UI state management should be done in Components layer.'
		);
	}

	/**
	 * @deprecated ProjectQueryService.getByName() を使用してください
	 */
	static getProjectIdByName(name: string): string | null {
		console.warn(
			'ProjectsService.getProjectIdByName() is deprecated. Use ProjectQueryService.getByName() instead.'
		);
		const project = ProjectQueryService.getByName(name);
		return project?.id || null;
	}

	/**
	 * @deprecated ProjectQueryService.getById() を使用してください
	 */
	static getProjectById(projectId: string): Project | null {
		console.warn(
			'ProjectsService.getProjectById() is deprecated. Use ProjectQueryService.getById() instead.'
		);
		return ProjectQueryService.getById(projectId);
	}

	/**
	 * @deprecated ProjectQueryService.getWithListsById() を使用してください
	 */
	static getProjectWithListsById(projectId: string): ProjectWithLists | null {
		console.warn(
			'ProjectsService.getProjectWithListsById() is deprecated. Use ProjectQueryService.getWithListsById() instead.'
		);
		return ProjectQueryService.getWithListsById(projectId);
	}

	/**
	 * @deprecated ProjectQueryService.getAll() を使用してください
	 */
	static getAllProjects(): Project[] {
		console.warn(
			'ProjectsService.getAllProjects() is deprecated. Use ProjectQueryService.getAll() instead.'
		);
		return ProjectQueryService.getAll();
	}

	/**
	 * @deprecated ProjectQueryService.searchByName() を使用してください
	 */
	static searchProjectsByName(searchTerm: string): Project[] {
		console.warn(
			'ProjectsService.searchProjectsByName() is deprecated. Use ProjectQueryService.searchByName() instead.'
		);
		return ProjectQueryService.searchByName(searchTerm);
	}

	/**
	 * @deprecated ProjectCompositeService.reorderProjects() を使用してください
	 */
	static async reorderProjects(fromIndex: number, toIndex: number): Promise<void> {
		console.warn(
			'ProjectsService.reorderProjects() is deprecated. Use ProjectCompositeService.reorderProjects() instead.'
		);
		return ProjectCompositeService.reorderProjects(fromIndex, toIndex);
	}

	/**
	 * @deprecated ProjectCompositeService.moveProjectToPosition() を使用してください
	 */
	static async moveProjectToPosition(projectId: string, targetIndex: number): Promise<void> {
		console.warn(
			'ProjectsService.moveProjectToPosition() is deprecated. Use ProjectCompositeService.moveProjectToPosition() instead.'
		);
		return ProjectCompositeService.moveProjectToPosition(projectId, targetIndex);
	}

	// ========================================
	// タスクリストCRUD
	// ========================================

	/**
	 * @deprecated TaskListCompositeService.createTaskList() を使用してください
	 */
	static async createTaskList(
		projectId: string,
		taskListData: {
			name: string;
			description?: string;
			color?: string;
			order_index?: number;
		}
	): Promise<TaskList | null> {
		console.warn(
			'ProjectsService.createTaskList() is deprecated. Use TaskListCompositeService.createTaskList() instead.'
		);
		return TaskListCompositeService.createTaskList(projectId, taskListData);
	}

	/**
	 * @deprecated TaskListCompositeService.updateTaskList() を使用してください
	 */
	static async updateTaskList(
		taskListId: string,
		updates: {
			name?: string;
			description?: string;
			color?: string;
			order_index?: number;
			is_archived?: boolean;
			project_id?: string;
		}
	): Promise<TaskList | null> {
		console.warn(
			'ProjectsService.updateTaskList() is deprecated. Use TaskListCompositeService.updateTaskList() instead.'
		);
		return TaskListCompositeService.updateTaskList(taskListId, updates);
	}

	/**
	 * @deprecated TaskListCompositeService.deleteTaskList() を使用してください
	 */
	static async deleteTaskList(taskListId: string): Promise<boolean> {
		console.warn(
			'ProjectsService.deleteTaskList() is deprecated. Use TaskListCompositeService.deleteTaskList() instead.'
		);
		return TaskListCompositeService.deleteTaskList(taskListId);
	}

	/**
	 * @deprecated Component層で実装してください
	 */
	static selectTaskList(_listId: string | null): void {
		console.warn(
			'ProjectsService.selectTaskList() is deprecated. UI state management should be done in Components layer.'
		);
	}

	/**
	 * @deprecated taskStoreから直接取得してください
	 */
	static getTaskListIdByName(projectId: string, name: string): string | null {
		console.warn(
			'ProjectsService.getTaskListIdByName() is deprecated. Query taskStore directly instead.'
		);
		const project = taskStore.projects.find((p) => p.id === projectId);
		if (!project) return null;

		const taskList = project.taskLists.find((list) => list.name === name);
		return taskList?.id || null;
	}

	/**
	 * @deprecated taskStoreから直接取得してください
	 */
	static getTaskListById(taskListId: string): TaskList | null {
		console.warn(
			'ProjectsService.getTaskListById() is deprecated. Query taskStore directly instead.'
		);
		for (const project of taskStore.projects) {
			const taskList = project.taskLists.find((list) => list.id === taskListId);
			if (taskList) {
				return {
					id: taskList.id,
					projectId: taskList.projectId,
					name: taskList.name,
					description: taskList.description,
					color: taskList.color,
					orderIndex: taskList.orderIndex,
					isArchived: taskList.isArchived,
					createdAt: taskList.createdAt,
					updatedAt: taskList.updatedAt
				};
			}
		}
		return null;
	}

	/**
	 * @deprecated taskStoreから直接取得してください
	 */
	static getTaskListsByProjectId(projectId: string): TaskList[] {
		console.warn(
			'ProjectsService.getTaskListsByProjectId() is deprecated. Query taskStore directly instead.'
		);
		const project = taskStore.projects.find((p) => p.id === projectId);
		if (!project) return [];

		return project.taskLists.map((list) => ({
			id: list.id,
			projectId: list.projectId,
			name: list.name,
			description: list.description,
			color: list.color,
			orderIndex: list.orderIndex,
			isArchived: list.isArchived,
			createdAt: list.createdAt,
			updatedAt: list.updatedAt
		}));
	}

	/**
	 * @deprecated taskStoreから直接取得してください
	 */
	static searchTaskListsByName(searchTerm: string, projectId?: string): TaskList[] {
		console.warn(
			'ProjectsService.searchTaskListsByName() is deprecated. Query taskStore directly instead.'
		);
		const lowercaseSearch = searchTerm.toLowerCase();
		const projects = projectId
			? taskStore.projects.filter((p) => p.id === projectId)
			: taskStore.projects;

		const foundTaskLists: TaskList[] = [];

		for (const project of projects) {
			const matchingLists = project.taskLists.filter(
				(list) =>
					list.name.toLowerCase().includes(lowercaseSearch) ||
					(list.description && list.description.toLowerCase().includes(lowercaseSearch))
			);

			foundTaskLists.push(
				...matchingLists.map((list) => ({
					id: list.id,
					projectId: list.projectId,
					name: list.name,
					description: list.description,
					color: list.color,
					orderIndex: list.orderIndex,
					isArchived: list.isArchived,
					createdAt: list.createdAt,
					updatedAt: list.updatedAt
				}))
			);
		}

		return foundTaskLists;
	}

	/**
	 * @deprecated TaskListCompositeService.reorderTaskLists() を使用してください
	 */
	static async reorderTaskLists(
		projectId: string,
		fromIndex: number,
		toIndex: number
	): Promise<void> {
		console.warn(
			'ProjectsService.reorderTaskLists() is deprecated. Use TaskListCompositeService.reorderTaskLists() instead.'
		);
		return TaskListCompositeService.reorderTaskLists(projectId, fromIndex, toIndex);
	}

	/**
	 * @deprecated TaskListCompositeService.moveTaskListToProject() を使用してください
	 */
	static async moveTaskListToProject(
		taskListId: string,
		targetProjectId: string,
		targetIndex?: number
	): Promise<void> {
		console.warn(
			'ProjectsService.moveTaskListToProject() is deprecated. Use TaskListCompositeService.moveTaskListToProject() instead.'
		);
		return TaskListCompositeService.moveTaskListToProject(taskListId, targetProjectId, targetIndex);
	}

	/**
	 * @deprecated TaskListCompositeService.moveTaskListToPosition() を使用してください
	 */
	static async moveTaskListToPosition(
		taskListId: string,
		targetProjectId: string,
		targetIndex: number
	): Promise<void> {
		console.warn(
			'ProjectsService.moveTaskListToPosition() is deprecated. Use TaskListCompositeService.moveTaskListToPosition() instead.'
		);
		return TaskListCompositeService.moveTaskListToPosition(
			taskListId,
			targetProjectId,
			targetIndex
		);
	}

	/**
	 * @deprecated taskStoreから直接取得してください
	 */
	static getTaskCountByListId(taskListId: string): number {
		console.warn(
			'ProjectsService.getTaskCountByListId() is deprecated. Query taskStore directly instead.'
		);
		for (const project of taskStore.projects) {
			const taskList = project.taskLists.find((list) => list.id === taskListId);
			if (taskList) {
				return taskList.tasks.length;
			}
		}
		return 0;
	}

	/**
	 * @deprecated ProjectHelpers.getTaskCountByProjectId() を使用してください
	 */
	static getTaskCountByProjectId(projectId: string): number {
		console.warn(
			'ProjectsService.getTaskCountByProjectId() is deprecated. Use ProjectHelpers.getTaskCountByProjectId() instead.'
		);
		return ProjectHelpers.getTaskCountByProjectId(projectId);
	}

	/**
	 * @deprecated ProjectQueryService.getSelectedProjectId() を使用してください
	 */
	static getSelectedProjectId(): string | null {
		console.warn(
			'ProjectsService.getSelectedProjectId() is deprecated. Use ProjectQueryService.getSelectedProjectId() instead.'
		);
		return ProjectQueryService.getSelectedProjectId();
	}

	/**
	 * @deprecated taskStoreから直接取得してください
	 */
	static getSelectedTaskListId(): string | null {
		console.warn(
			'ProjectsService.getSelectedTaskListId() is deprecated. Query taskStore directly instead.'
		);
		return taskStore.selectedListId;
	}

	/**
	 * @deprecated ProjectQueryService.findProjectAndTaskListByTaskId() を使用してください
	 */
	static findProjectAndTaskListByTaskId(
		taskId: string
	): { project: Project; taskList: TaskList } | null {
		console.warn(
			'ProjectsService.findProjectAndTaskListByTaskId() is deprecated. Use ProjectQueryService.findProjectAndTaskListByTaskId() instead.'
		);
		return ProjectQueryService.findProjectAndTaskListByTaskId(taskId);
	}

	/**
	 * @deprecated ProjectQueryService.getActive() を使用してください
	 */
	static getActiveProjects(): Project[] {
		console.warn(
			'ProjectsService.getActiveProjects() is deprecated. Use ProjectQueryService.getActive() instead.'
		);
		return ProjectQueryService.getActive();
	}

	/**
	 * @deprecated taskStoreから直接取得してください
	 */
	static getActiveTaskListsByProjectId(projectId: string): TaskList[] {
		console.warn(
			'ProjectsService.getActiveTaskListsByProjectId() is deprecated. Query taskStore directly instead.'
		);
		return this.getTaskListsByProjectId(projectId).filter((list) => !list.isArchived);
	}

	/**
	 * @deprecated ProjectCompositeService.archiveProject() を使用してください
	 */
	static async archiveProject(projectId: string, isArchived: boolean): Promise<boolean> {
		console.warn(
			'ProjectsService.archiveProject() is deprecated. Use ProjectCompositeService.archiveProject() instead.'
		);
		return ProjectCompositeService.archiveProject(projectId, isArchived);
	}

	/**
	 * @deprecated TaskListCompositeService.archiveTaskList() を使用してください
	 */
	static async archiveTaskList(taskListId: string, isArchived: boolean): Promise<boolean> {
		console.warn(
			'ProjectsService.archiveTaskList() is deprecated. Use TaskListCompositeService.archiveTaskList() instead.'
		);
		return TaskListCompositeService.archiveTaskList(taskListId, isArchived);
	}
}
