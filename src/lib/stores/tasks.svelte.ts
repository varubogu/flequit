import type { TaskWithSubTasks } from '$lib/types/task';
import type { ProjectTree } from '$lib/types/project';
import type { Project } from '$lib/types/project';
import type { TaskList } from '$lib/types/task-list';
import type { Tag } from '$lib/types/tag';
import type { SubTask } from '$lib/types/sub-task';
import { SvelteDate } from 'svelte/reactivity';
import { selectionStore } from './selection-store.svelte';
import { projectStore } from './project-store.svelte';
import { taskListStore } from './task-list-store.svelte';
import { subTaskStore } from './sub-task-store.svelte';
import { taskCoreStore } from './task-core-store.svelte';
import { TaskEntitiesStore } from './tasks/task-entities-store.svelte';
import { TaskSelectionStore } from './tasks/task-selection-store.svelte';
import { TaskDraftStore } from './tasks/task-draft-store.svelte';

export type TaskStoreConfig = Partial<{
	projectStore: typeof projectStore;
	selectionStore: typeof selectionStore;
	taskListStore: typeof taskListStore;
	subTaskStore: typeof subTaskStore;
	taskCoreStore: typeof taskCoreStore;
}>;

export class TaskStore {
	#entities: TaskEntitiesStore;
	#selection: TaskSelectionStore;
	#draft: TaskDraftStore;

	constructor(config: TaskStoreConfig = {}) {
		const resolved = {
			projectStore: config.projectStore ?? projectStore,
			selectionStore: config.selectionStore ?? selectionStore,
			taskListStore: config.taskListStore ?? taskListStore,
			subTaskStore: config.subTaskStore ?? subTaskStore,
			taskCoreStore: config.taskCoreStore ?? taskCoreStore
		};

		this.#entities = new TaskEntitiesStore({
			projectStore: resolved.projectStore,
			taskCoreStore: resolved.taskCoreStore
		});

		this.#selection = new TaskSelectionStore({
			selectionStore: resolved.selectionStore,
			entitiesStore: this.#entities,
			subTaskStore: resolved.subTaskStore
		});

		this.#draft = new TaskDraftStore({
			taskListStore: resolved.taskListStore,
			selection: this.#selection
		});
	}

	/**
	 * 内部エンティティストア（UIサービスからの依存注入用）
	 */
	get entities(): TaskEntitiesStore {
		return this.#entities;
	}

	/**
	 * 選択状態ストア（UIサービスからの依存注入用）
	 */
	get selection(): TaskSelectionStore {
		return this.#selection;
	}

	/**
	 * 新規タスクドラフトストア（UIサービスからの依存注入用）
	 */
	get draft(): TaskDraftStore {
		return this.#draft;
	}

	get projects(): ProjectTree[] {
		return this.#entities.projects;
	}

	set projects(projects: ProjectTree[]) {
		this.#entities.projects = projects;
	}

	get isNewTaskMode(): boolean {
		return this.#draft.isNewTaskMode;
	}

	set isNewTaskMode(value: boolean) {
		this.#draft.isNewTaskMode = value;
	}

	get newTaskData(): TaskWithSubTasks | null {
		return this.#draft.newTaskDraft;
	}

	set newTaskData(value: TaskWithSubTasks | null) {
		this.#draft.newTaskDraft = value;
	}

	get selectedProjectId(): string | null {
		return this.#selection.selectedProjectId;
	}

	set selectedProjectId(value: string | null) {
		this.#selection.selectedProjectId = value;
	}

	get selectedListId(): string | null {
		return this.#selection.selectedListId;
	}

	set selectedListId(value: string | null) {
		this.#selection.selectedListId = value;
	}

	get selectedTaskId(): string | null {
		return this.#selection.selectedTaskId;
	}

	set selectedTaskId(value: string | null) {
		this.#selection.selectedTaskId = value;
	}

	get selectedSubTaskId(): string | null {
		return this.#selection.selectedSubTaskId;
	}

	set selectedSubTaskId(value: string | null) {
		this.#selection.selectedSubTaskId = value;
	}

	get pendingTaskSelection(): string | null {
		return this.#selection.pendingTaskSelection;
	}

	set pendingTaskSelection(value: string | null) {
		this.#selection.pendingTaskSelection = value;
	}

	get pendingSubTaskSelection(): string | null {
		return this.#selection.pendingSubTaskSelection;
	}

	set pendingSubTaskSelection(value: string | null) {
		this.#selection.pendingSubTaskSelection = value;
	}

	get selectedTask(): TaskWithSubTasks | null {
		return this.#selection.selectedTask;
	}

	get selectedSubTask(): SubTask | null {
		return this.#selection.selectedSubTask;
	}

	get allTasks(): TaskWithSubTasks[] {
		return this.#entities.allTasks;
	}

	get todayTasks(): TaskWithSubTasks[] {
		return this.#entities.todayTasks;
	}

	get overdueTasks(): TaskWithSubTasks[] {
		return this.#entities.overdueTasks;
	}

	setProjects(projects: ProjectTree[]): void {
		this.#entities.setProjects(projects);
	}

	loadProjectsData(projects: ProjectTree[]): void {
		this.#entities.loadProjectsData(projects);
	}

	attachTagToTask(taskId: string, tag: Tag): void {
		const task = this.#entities.getTaskById(taskId);
		if (!task) return;

		const duplicated = task.tags.some(
			(existing) => existing.id === tag.id || existing.name.toLowerCase() === tag.name.toLowerCase()
		);
		if (duplicated) return;

		task.tags.push(tag);
		task.updatedAt = new SvelteDate();
	}

	detachTagFromTask(taskId: string, tagId: string): Tag | null {
		const task = this.#entities.getTaskById(taskId);
		if (!task) return null;

		const index = task.tags.findIndex((existing) => existing.id === tagId);
		if (index === -1) return null;

		const [removed] = task.tags.splice(index, 1);
		task.updatedAt = new SvelteDate();
		return removed ?? null;
	}

	getTaskById(taskId: string): TaskWithSubTasks | null {
		return this.#selection.getTaskById(taskId);
	}

	getTaskProjectAndList(taskId: string): { project: Project; taskList: TaskList } | null {
		return this.#selection.getTaskProjectAndList(taskId);
	}

	getProjectIdByTaskId(taskId: string): string | null {
		return this.#selection.getProjectIdByTaskId(taskId);
	}

	getProjectIdByTagId(tagId: string): string | null {
		return this.#entities.getProjectIdByTagId(tagId);
	}

	getTaskCountByTag(tagName: string): number {
		return this.#entities.getTaskCountByTag(tagName);
	}

	removeTagFromAllTasks(tagId: string): void {
		this.#entities.removeTagFromAllTasks(tagId);
		const draft = this.#draft.newTaskDraft;
		if (draft) {
			const index = draft.tags.findIndex((tag) => tag.id === tagId);
			if (index !== -1) {
				draft.tags.splice(index, 1);
			}
		}
	}

	updateTagInAllTasks(updatedTag: Tag): void {
		this.#entities.updateTagInAllTasks(updatedTag);
		const draft = this.#draft.newTaskDraft;
		if (draft) {
			const index = draft.tags.findIndex((tag) => tag.id === updatedTag.id);
			if (index !== -1) {
				draft.tags[index] = { ...updatedTag };
			}
		}
	}

	clearPendingSelections(): void {
		this.#selection.clearPendingSelections();
	}
}

let _taskStore: TaskStore | undefined;

function getTaskStore(): TaskStore {
	if (!_taskStore) {
		_taskStore = new TaskStore();
	}
	return _taskStore;
}

export const taskStore = new Proxy({} as TaskStore, {
	get(_target, prop) {
		const store = getTaskStore();
		const value = store[prop as keyof TaskStore];
		return typeof value === 'function' ? value.bind(store) : value;
	}
});
