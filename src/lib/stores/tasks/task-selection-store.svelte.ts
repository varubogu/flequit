import type { TaskWithSubTasks } from '$lib/types/task';
import type { Project } from '$lib/types/project';
import type { TaskList } from '$lib/types/task-list';

export type TaskSelectionDependencies = {
  selectionStore: {
    selectedTaskId: string | null;
    selectedSubTaskId: string | null;
    selectTask(taskId: string | null): void;
    selectSubTask(subTaskId: string | null): void;
    clearPendingSelections(): void;
  };
  projectTraverser: {
    getAllTasks(projects: Project[]): TaskWithSubTasks[];
    findTask(projects: Project[], id: string): TaskWithSubTasks | null;
    findTaskContext(projects: Project[], id: string): { project: Project; taskList: TaskList } | null;
    getProjectIdByTaskId(projects: Project[], taskId: string): string | null;
  };
  getProjects(): Project[];
};

export class TaskSelectionStore {
  #deps: TaskSelectionDependencies;

  constructor(deps: TaskSelectionDependencies) {
    this.#deps = deps;
  }

  get selectedTaskId() {
    return this.#deps.selectionStore.selectedTaskId;
  }

  set selectedTaskId(value: string | null) {
    this.#deps.selectionStore.selectTask(value);
  }

  get selectedSubTaskId() {
    return this.#deps.selectionStore.selectedSubTaskId;
  }

  set selectedSubTaskId(value: string | null) {
    this.#deps.selectionStore.selectSubTask(value);
  }

  get selectedTask(): TaskWithSubTasks | null {
    const id = this.selectedTaskId;
    if (!id) return null;
    return this.#deps.projectTraverser.findTask(this.#deps.getProjects(), id);
  }

  get allTasks(): TaskWithSubTasks[] {
    return this.#deps.projectTraverser.getAllTasks(this.#deps.getProjects());
  }

  getTaskById(taskId: string): TaskWithSubTasks | null {
    return this.#deps.projectTraverser.findTask(this.#deps.getProjects(), taskId);
  }

  getTaskProjectAndList(taskId: string): { project: Project; taskList: TaskList } | null {
    return this.#deps.projectTraverser.findTaskContext(this.#deps.getProjects(), taskId);
  }

  getProjectIdByTaskId(taskId: string): string | null {
    return this.#deps.projectTraverser.getProjectIdByTaskId(this.#deps.getProjects(), taskId);
  }

  clearPendingSelections() {
    this.#deps.selectionStore.clearPendingSelections();
  }
}
