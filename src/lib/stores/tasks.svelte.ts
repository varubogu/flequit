import type { TaskWithSubTasks } from '$lib/types/task';
import type { ProjectTree } from '$lib/types/project';
import type { Project } from '$lib/types/project';
import type { TaskList } from '$lib/types/task-list';
import type { Tag } from '$lib/types/tag';
import type { SubTask } from '$lib/types/sub-task';
import { selectionStore } from './selection-store.svelte';
import { projectStore } from './project-store.svelte';
import { taskListStore } from './task-list-store.svelte';
import { subTaskStore } from './sub-task-store.svelte';
import { taskCoreStore } from './task-core-store.svelte';
import { tagStore } from './tags.svelte';
import { TaskEntitiesStore } from './tasks/task-entities-store.svelte';
import { TaskSelectionStore } from './tasks/task-selection-store.svelte';
import { TaskDraftStore } from './tasks/task-draft-store.svelte';
import { TaskInteractionsService } from '$lib/services/ui/task/task-interactions';
import { TaskMutations, type TaskMutationDependencies } from '$lib/services/domain/task/task-mutations';
import { TaggingService } from '$lib/services/domain/tagging';
import { errorHandler } from '$lib/stores/error-handler.svelte';
import { TaskService } from '$lib/services/domain/task/task-crud';
import { TaskRecurrenceService } from '$lib/services/domain/task-recurrence';

export type TaskStoreConfig = Partial<{
	projectStore: typeof projectStore;
	selectionStore: typeof selectionStore;
	taskListStore: typeof taskListStore;
	subTaskStore: typeof subTaskStore;
	taskCoreStore: typeof taskCoreStore;
	tagStore: typeof tagStore;
}>;

export class TaskStore {
	#entities: TaskEntitiesStore;
	#selection: TaskSelectionStore;
	#draft: TaskDraftStore;
	#interactions: TaskInteractionsService;
	#mutations: TaskMutations;

	constructor(config: TaskStoreConfig = {}) {
		const resolved = {
			projectStore: config.projectStore ?? projectStore,
			selectionStore: config.selectionStore ?? selectionStore,
			taskListStore: config.taskListStore ?? taskListStore,
			subTaskStore: config.subTaskStore ?? subTaskStore,
			taskCoreStore: config.taskCoreStore ?? taskCoreStore,
			tagStore: config.tagStore ?? tagStore
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

const baseDeps: TaskMutationDependencies = {
	taskStore: this as unknown as TaskStore,
		taskCoreStore: resolved.taskCoreStore,
		taskListStore: resolved.taskListStore,
		tagStore: resolved.tagStore,
		taggingService: TaggingService,
		errorHandler,
		taskService: TaskService,
		recurrenceService: new TaskRecurrenceService()
	};

	this.#mutations = new TaskMutations(baseDeps);

	this.#interactions = new TaskInteractionsService({
		entities: this.#entities,
		selection: this.#selection,
		draft: this.#draft,
		taskMutations: this.#mutations,
		tagStore: resolved.tagStore
	});
	}

	get mutations(): TaskMutations {
		return this.#mutations;
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

	startNewTaskMode(listId: string): void {
		this.#interactions.startNewTaskMode(listId);
	}

	cancelNewTaskMode(): void {
		this.#interactions.cancelNewTaskMode();
	}

	async saveNewTask(): Promise<string | null> {
		return this.#interactions.saveNewTask();
	}

	updateNewTaskData(updates: Partial<TaskWithSubTasks>): void {
		this.#interactions.updateNewTaskData(updates);
	}

	async addTagToNewTask(tagName: string): Promise<void> {
		await this.#interactions.addTagToNewTask(tagName);
	}

	removeTagFromNewTask(tagId: string): void {
		this.#interactions.removeTagFromNewTask(tagId);
	}

	attachTagToTask(taskId: string, tag: Tag): void {
		this.#interactions.attachTagToTask(taskId, tag);
	}

	detachTagFromTask(taskId: string, tagId: string): Tag | null {
		return this.#interactions.detachTagFromTask(taskId, tagId);
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
		this.#interactions.removeTagFromAllTasks(tagId);
	}

	updateTagInAllTasks(updatedTag: Tag): void {
		this.#interactions.updateTagInAllTasks(updatedTag);
	}

	clearPendingSelections(): void {
		this.#interactions.clearPendingSelections();
	}
}

export const taskStore = new TaskStore();
export const taskMutations = taskStore.mutations;
