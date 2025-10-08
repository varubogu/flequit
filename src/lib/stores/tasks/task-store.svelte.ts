import type { Task, TaskWithSubTasks } from '$lib/types/task';
import type { Tag } from '$lib/types/tag';
import type { SubTask } from '$lib/types/sub-task';
import type { ProjectTree } from '$lib/types/project';
import type { TaskList } from '$lib/types/task-list';
import type { Project } from '$lib/types/project';
import type { TaskSelectionStore } from './task-selection-store.svelte.ts';
import type { TaskNewModeStore } from './task-new-mode-store.svelte.ts';
import type { TaskCoreStore } from '../task-core-store.svelte.ts';
import type { TaskListStore } from '../task-list-store.svelte.ts';
import type { TagStore } from '../tags.svelte.ts';
import { SvelteDate } from 'svelte/reactivity';

export type TaskStoreDependencies = {
  projectStore: {
    projects: ProjectTree[];
    setProjects(projects: ProjectTree[]): void;
    loadProjects(projects: ProjectTree[]): void;
  };
  taskCoreStore: Pick<TaskCoreStore, 'setProjects' | 'loadProjectsData' | 'addTask'>;
  selection: TaskSelectionStore;
  newMode: TaskNewModeStore;
  tagStore: Pick<TagStore, 'getOrCreateTagWithProject'>;
};

export class TaskFacadeStore {
  #deps: TaskStoreDependencies;

  constructor(deps: TaskStoreDependencies) {
    this.#deps = deps;
  }

  get projects() {
    return this.#deps.projectStore.projects;
  }

  set projects(value: ProjectTree[]) {
    this.#deps.projectStore.setProjects(value);
  }

  get isNewTaskMode() {
    return this.#deps.newMode.isNewTaskMode;
  }

  get newTaskData() {
    return this.#deps.newMode.newTaskDraft;
  }

  get selectedTaskId() {
    return this.#deps.selection.selectedTaskId;
  }

  set selectedTaskId(value: string | null) {
    this.#deps.selection.selectedTaskId = value;
  }

  get selectedSubTaskId() {
    return this.#deps.selection.selectedSubTaskId;
  }

  set selectedSubTaskId(value: string | null) {
    this.#deps.selection.selectedSubTaskId = value;
  }

  get selectedTask(): TaskWithSubTasks | null {
    return this.#deps.selection.selectedTask;
  }

  get allTasks(): TaskWithSubTasks[] {
    return this.#deps.selection.allTasks;
  }

  async setProjects(projects: ProjectTree[]) {
    this.#deps.projectStore.setProjects(projects);
    this.#deps.taskCoreStore.setProjects(projects);
  }

  loadProjectsData(projects: ProjectTree[]) {
    this.#deps.projectStore.loadProjects(projects);
    this.#deps.taskCoreStore.loadProjectsData(projects);
  }

  startNewTaskMode(listId: string) {
    this.#deps.selection.selectedTaskId = null;
    this.#deps.selection.selectedSubTaskId = null;
    this.#deps.newMode.start(listId);
  }

  cancelNewTaskMode() {
    this.#deps.newMode.cancel();
    this.#deps.selection.clearPendingSelections();
  }

  async saveNewTask(): Promise<string | null> {
    const draft = this.#deps.newMode.newTaskDraft;
    if (!draft || !draft.listId || !draft.title?.trim()) {
      return null;
    }

    const taskData = draft as Task;
    const newTask = await this.#deps.taskCoreStore.addTask(taskData.listId, taskData);
    if (newTask) {
      this.#deps.newMode.cancel();
      this.#deps.selection.selectedTaskId = newTask.id;
      return newTask.id;
    }
    return null;
  }

  updateNewTaskData(updates: Partial<TaskWithSubTasks>) {
    this.#deps.newMode.updateDraft(updates);
  }

  addTagToNewTask(name: string) {
    const draft = this.#deps.newMode.newTaskDraft;
    if (!draft) return;

    const projectId = this.getProjectIdByTaskId(draft.id) ?? draft.projectId;
    const tag = this.#deps.tagStore.getOrCreateTagWithProject(name, projectId);
    if (!tag) return;

    if (!draft.tags.some((t) => t.name.toLowerCase() === tag.name.toLowerCase())) {
      draft.tags.push(tag);
    }
  }

  removeTagFromNewTask(tagId: string) {
    const draft = this.#deps.newMode.newTaskDraft;
    if (!draft) return;

    const index = draft.tags.findIndex((t) => t.id === tagId);
    if (index !== -1) {
      draft.tags.splice(index, 1);
    }
  }

  attachTagToTask(taskId: string, tag: Tag) {
    const task = this.#deps.selection.getTaskById(taskId);
    if (!task) return;

    if (task.tags.some((existing) => existing.id === tag.id || existing.name.toLowerCase() === tag.name.toLowerCase())) {
      return;
    }

    task.tags.push(tag);
    task.updatedAt = new SvelteDate();
  }

  detachTagFromTask(taskId: string, tagId: string): Tag | null {
    const task = this.#deps.selection.getTaskById(taskId);
    if (!task) return null;

    const index = task.tags.findIndex((t) => t.id === tagId);
    if (index === -1) return null;

    const [removed] = task.tags.splice(index, 1);
    task.updatedAt = new SvelteDate();
    return removed ?? null;
  }

  getTaskById(taskId: string) {
    return this.#deps.selection.getTaskById(taskId);
  }

  getTaskProjectAndList(taskId: string) {
    return this.#deps.selection.getTaskProjectAndList(taskId);
  }

  getProjectIdByTaskId(taskId: string) {
    return this.#deps.selection.getProjectIdByTaskId(taskId);
  }
}
