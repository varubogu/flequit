import type { TaskWithSubTasks } from '$lib/types/task';
import type { Project } from '$lib/types/project';
import type { TaskList } from '$lib/types/task-list';
import type { SubTask } from '$lib/types/sub-task';

export type TaskSelectionDependencies = {
	selectionStore: {
		selectedProjectId: string | null;
		selectedListId: string | null;
		selectedTaskId: string | null;
		selectedSubTaskId: string | null;
		pendingTaskSelection: string | null;
		pendingSubTaskSelection: string | null;
		selectProject(projectId: string | null): void;
		selectList(listId: string | null): void;
		selectTask(taskId: string | null): void;
		selectSubTask(subTaskId: string | null): void;
		clearPendingSelections(): void;
	};
	entitiesStore: {
		allTasks: TaskWithSubTasks[];
		getTaskById(taskId: string): TaskWithSubTasks | null;
		getTaskProjectAndList(taskId: string): { project: Project; taskList: TaskList } | null;
		getProjectIdByTaskId(taskId: string): string | null;
	};
	subTaskStore: {
		selectedSubTask: SubTask | null;
	};
};

export class TaskSelectionStore {
	#deps: TaskSelectionDependencies;

	constructor(deps: TaskSelectionDependencies) {
		this.#deps = deps;
	}

	get selectedProjectId(): string | null {
		return this.#deps.selectionStore.selectedProjectId;
	}

	set selectedProjectId(value: string | null) {
		this.#deps.selectionStore.selectProject(value);
	}

	get selectedListId(): string | null {
		return this.#deps.selectionStore.selectedListId;
	}

	set selectedListId(value: string | null) {
		this.#deps.selectionStore.selectList(value);
	}

	get selectedTaskId(): string | null {
		return this.#deps.selectionStore.selectedTaskId;
	}

	set selectedTaskId(value: string | null) {
		this.#deps.selectionStore.selectTask(value);
	}

	get selectedSubTaskId(): string | null {
		return this.#deps.selectionStore.selectedSubTaskId;
	}

	set selectedSubTaskId(value: string | null) {
		this.#deps.selectionStore.selectSubTask(value);
	}

	get pendingTaskSelection(): string | null {
		return this.#deps.selectionStore.pendingTaskSelection;
	}

	set pendingTaskSelection(value: string | null) {
		this.#deps.selectionStore.pendingTaskSelection = value;
	}

	get pendingSubTaskSelection(): string | null {
		return this.#deps.selectionStore.pendingSubTaskSelection;
	}

	set pendingSubTaskSelection(value: string | null) {
		this.#deps.selectionStore.pendingSubTaskSelection = value;
	}

	get selectedTask(): TaskWithSubTasks | null {
		const id = this.selectedTaskId;
		if (!id) return null;
		return this.#deps.entitiesStore.getTaskById(id);
	}

	get selectedSubTask(): SubTask | null {
		return this.#deps.subTaskStore.selectedSubTask;
	}

	get allTasks(): TaskWithSubTasks[] {
		return this.#deps.entitiesStore.allTasks;
	}

	getTaskById(taskId: string): TaskWithSubTasks | null {
		return this.#deps.entitiesStore.getTaskById(taskId);
	}

	getTaskProjectAndList(taskId: string): { project: Project; taskList: TaskList } | null {
		return this.#deps.entitiesStore.getTaskProjectAndList(taskId);
	}

	getProjectIdByTaskId(taskId: string): string | null {
		return this.#deps.entitiesStore.getProjectIdByTaskId(taskId);
	}

	clearPendingSelections(): void {
		this.#deps.selectionStore.clearPendingSelections();
	}
}
