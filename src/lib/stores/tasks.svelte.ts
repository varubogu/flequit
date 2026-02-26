import type { TaskWithSubTasks } from '$lib/types/task';
import type { ProjectTree } from '$lib/types/project';
import type { Project } from '$lib/types/project';
import type { TaskList } from '$lib/types/task-list';
import type { Tag } from '$lib/types/tag';
import type { SubTask } from '$lib/types/sub-task';
import { selectionStore } from '$lib/stores/selection-store.svelte';
import { resolveProjectStore } from '$lib/stores/providers/project-store-provider';
import { taskListStore } from '$lib/stores/task-list-store.svelte';
import { subTaskStore } from '$lib/stores/sub-task-store.svelte';
import { taskCoreStore } from '$lib/stores/task-core-store.svelte';
import { TaskEntitiesStore } from '$lib/stores/tasks/task-entities-store.svelte';
import { TaskSelectionStore } from '$lib/stores/tasks/task-selection-store.svelte';
import { TaskDraftStore } from '$lib/stores/tasks/task-draft-store.svelte';
import { TaskTagOperations } from '$lib/stores/tasks/task-tag-operations.svelte';

export type TaskStoreConfig = Partial<{
  projectStore: ReturnType<typeof resolveProjectStore>;
  selectionStore: typeof selectionStore;
  taskListStore: typeof taskListStore;
  subTaskStore: typeof subTaskStore;
  taskCoreStore: typeof taskCoreStore;
}>;

/**
 * TaskStore - タスク管理のFacadeストア
 *
 * 複数のサブストアを統合し、タスク関連の操作を統一インターフェースで提供
 */
export class TaskStore {
  #entities: TaskEntitiesStore;
  #selection: TaskSelectionStore;
  #draft: TaskDraftStore;
  #tagOps: TaskTagOperations;

  constructor(config: TaskStoreConfig = {}) {
    const resolved = {
      projectStore: config.projectStore ?? resolveProjectStore(),
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

    this.#tagOps = new TaskTagOperations(this.#entities, this.#draft);
  }

  // 内部ストアアクセス（UIサービスからの依存注入用）
  get entities(): TaskEntitiesStore {
    return this.#entities;
  }
  get selection(): TaskSelectionStore {
    return this.#selection;
  }
  get draft(): TaskDraftStore {
    return this.#draft;
  }

  // プロジェクトデータ
  get projects(): ProjectTree[] {
    return this.#entities.projects;
  }
  set projects(projects: ProjectTree[]) {
    this.#entities.projects = projects;
  }
  setProjects(projects: ProjectTree[]): void {
    this.#entities.setProjects(projects);
  }
  loadProjectsData(projects: ProjectTree[]): void {
    this.#entities.loadProjectsData(projects);
  }

  // 新規タスクモード
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

  // 選択状態
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
  clearPendingSelections(): void {
    this.#selection.clearPendingSelections();
  }

  // タスクリスト取得
  get allTasks(): TaskWithSubTasks[] {
    return this.#entities.allTasks;
  }
  get todayTasks(): TaskWithSubTasks[] {
    return this.#entities.todayTasks;
  }
  get overdueTasks(): TaskWithSubTasks[] {
    return this.#entities.overdueTasks;
  }

  // タスク検索・取得
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

  // タグ操作（TaskTagOperationsへ委譲）
  attachTagToTask(taskId: string, tag: Tag): void {
    this.#tagOps.attachTagToTask(taskId, tag);
  }
  detachTagFromTask(taskId: string, tagId: string): Tag | null {
    return this.#tagOps.detachTagFromTask(taskId, tagId);
  }
  removeTagFromAllTasks(tagId: string): void {
    this.#tagOps.removeTagFromAllTasks(tagId);
  }
  updateTagInAllTasks(updatedTag: Tag): void {
    this.#tagOps.updateTagInAllTasks(updatedTag);
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
