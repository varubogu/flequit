import type { Project } from '../project';
import type { ProjectTree } from '../project';
import type { TaskList } from '../task-list';
import type { TaskWithSubTasks } from '../task';
import type { SubTask } from '../sub-task';
import type { Tag } from '../tag';
import type { ISelectionStore } from './selection';
import type { IProjectStore, ITaskListStore } from './project';

/**
 * タスク管理インターフェース
 *
 * 責務: タスクのCRUD操作、ステータス管理、タグ管理、繰り返しタスク
 * 依存: ITaskListStore（リスト情報）, ISelectionStore（選択状態）
 */
export interface ITaskStore {
  // 状態
  projects: ProjectTree[];
  isNewTaskMode: boolean;
  newTaskData: TaskWithSubTasks | null;

  // 派生状態
  readonly selectedTask: TaskWithSubTasks | null;
  readonly selectedSubTask: SubTask | null;
  readonly allTasks: TaskWithSubTasks[];
  readonly todayTasks: TaskWithSubTasks[];
  readonly overdueTasks: TaskWithSubTasks[];

  // 選択状態
  selectedProjectId: string | null;
  selectedListId: string | null;
  selectedTaskId: string | null;
  selectedSubTaskId: string | null;
  pendingTaskSelection: string | null;
  pendingSubTaskSelection: string | null;

  // データ同期
  setProjects(projects: ProjectTree[]): void;
  loadProjectsData(projects: ProjectTree[]): void;

  // タグ操作
  attachTagToTask(taskId: string, tag: Tag): void;
  detachTagFromTask(taskId: string, tagId: string): Tag | null;
  removeTagFromAllTasks(tagId: string): void;
  updateTagInAllTasks(updatedTag: Tag): void;

  // ヘルパー
  getTaskById(taskId: string): TaskWithSubTasks | null;
  getTaskProjectAndList(taskId: string): { project: Project; taskList: TaskList } | null;
  getProjectIdByTaskId(taskId: string): string | null;
  getProjectIdByTagId(tagId: string): string | null;
  getTaskCountByTag(tagName: string): number;

  // 選択状態リセット
  clearPendingSelections(): void;
}

/**
 * サブタスク管理インターフェース
 *
 * 責務: サブタスクのCRUD操作、タグ管理
 * 依存: IProjectStore（データ参照）, ISelectionStore（選択状態）
 *
 * 注: Phase 3.1では実装シグネチャに合わせて調整
 */
export interface ISubTaskStore {
  // 派生状態
  readonly selectedSubTask: SubTask | null;

  // CRUD操作
  addSubTask(
    taskId: string,
    subTask: { title: string; description?: string; status?: string; priority?: number }
  ): Promise<SubTask | null>;
  updateSubTask(subTaskId: string, updates: Partial<SubTask>): Promise<void>;
  deleteSubTask(subTaskId: string): Promise<void>;

  // タグ操作
  attachTagToSubTask(subTaskId: string, tag: Tag): void;
  detachTagFromSubTask(subTaskId: string, tagId: string): Tag | null;

  // ヘルパー
  getTaskIdBySubTaskId(subTaskId: string): string | null;
  getProjectIdBySubTaskId(subTaskId: string): string | null;

  // テスト用
  reset(): void;
}

/**
 * タグ管理インターフェース
 *
 * 責務: タグのCRUD操作、タスク内タグの更新伝播
 * 依存: なし（独立、ただしタスク更新通知を受け取る）
 */
export interface ITagStore {
  // 状態
  tags: Tag[];

  // CRUD操作
  addTag(tag: Tag): Promise<void>;
  updateTag(tagId: string, updates: Partial<Tag>): Promise<void>;
  deleteTag(tagId: string): Promise<void>;

  // 並び替え
  reorderTags(tagIds: string[]): Promise<void>;

  // タスク内更新
  updateTagInAllTasks(tag: Tag): void;
  removeTagFromAllTasks(tagId: string): void;

  // ヘルパー
  getTagById(tagId: string): Tag | null;
  getTaskCountByTag(tagId: string): number;
  getProjectIdByTagId(tagId: string): string | null;
}

/**
 * ストア依存関係マップ
 *
 * 依存の方向:
 * SelectionStore (独立)
 *     ↓
 * ProjectStore (SelectionStore依存)
 *     ↓
 * TaskListStore (ProjectStore + SelectionStore依存)
 *     ↓
 * TaskStore (TaskListStore + SelectionStore依存)
 *     ↓
 * SubTaskStore (TaskStore + SelectionStore依存)
 *
 * TagStore (独立、タスク更新通知を受け取る)
 */
export interface IStoreContainer {
  selection: ISelectionStore;
  project?: IProjectStore;
  taskList?: ITaskListStore;
  task?: ITaskStore;
  subTask?: ISubTaskStore;
  tag?: ITagStore;
}
