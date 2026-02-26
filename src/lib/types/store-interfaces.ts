/**
 * ストア間のインターフェース定義
 *
 * TaskStore分割計画のための型定義を提供します。
 * 各ストアの責務と依存関係を明確化します。
 */

import type { Project, ProjectTree } from './project';
import type { TaskList, TaskListWithTasks } from './task-list';
import type { TaskWithSubTasks } from './task';
import type { SubTask } from './sub-task';
import type { Tag } from './tag';

/**
 * 選択状態管理インターフェース
 *
 * 責務: プロジェクト、タスクリスト、タスク、サブタスクの選択IDを管理
 * 依存: なし（完全独立）
 */
export interface ISelectionStore {
  // 選択状態
  selectedProjectId: string | null;
  selectedListId: string | null;
  selectedTaskId: string | null;
  selectedSubTaskId: string | null;

  // 保留中の選択
  pendingTaskSelection: string | null;
  pendingSubTaskSelection: string | null;

  // メソッド
  selectProject(projectId: string | null): void;
  selectList(listId: string | null): void;
  selectTask(taskId: string | null): void;
  selectSubTask(subTaskId: string | null): void;
  clearPendingSelections(): void;
  reset(): void;
}

/**
 * プロジェクト管理インターフェース
 *
 * 責務: プロジェクトのCRUD操作、並び替え
 * 依存: ISelectionStore（選択状態の参照）
 *
 * 注: Phase 2.1ではProjectTree[]を使用（TaskListを含む完全なツリー構造）
 *     将来的にProject[]に分離予定（Phase 4以降）
 */
export interface IProjectStore {
  // 状態
  projects: ProjectTree[];

  // 派生状態
  readonly selectedProject: ProjectTree | null;

  // CRUD操作（Store更新）
  addProjectToStore(project: ProjectTree): ProjectTree;
  updateProjectInStore(projectId: string, updates: Partial<ProjectTree>): ProjectTree | null;
  removeProjectFromStore(projectId: string): boolean;

  // 並び替え
  reorderProjectsInStore(fromIndex: number, toIndex: number): ProjectTree[];
  moveProjectToPositionInStore(projectId: string, targetIndex: number): ProjectTree[];

  // ヘルパー
  getProjectById(id: string): ProjectTree | null;

  // データロード
  loadProjects(projects: ProjectTree[]): void;
  setProjects(projects: ProjectTree[]): void;

  // テスト用
  reset(): void;
}

/**
 * タスクリスト管理インターフェース
 *
 * 責務: タスクリストのCRUD操作、並び替え、プロジェクト間移動
 * 依存: IProjectStore（プロジェクト情報）, ISelectionStore（選択状態）
 *
 * 注: Phase 2.2では実装シグネチャに合わせて調整
 */
export interface ITaskListStore {
  // 派生状態
  readonly selectedTaskList: TaskListWithTasks | null;

  // CRUD操作
  addTaskList(
    projectId: string,
    taskList: { name: string; description?: string; color?: string }
  ): Promise<TaskListWithTasks | null>;
  updateTaskList(
    taskListId: string,
    updates: { name?: string; description?: string; color?: string }
  ): Promise<TaskListWithTasks | null>;
  deleteTaskList(taskListId: string): Promise<boolean>;

  // 並び替え・移動
  reorderTaskLists(projectId: string, fromIndex: number, toIndex: number): Promise<void>;
  moveTaskListToPosition(
    taskListId: string,
    targetProjectId: string,
    targetIndex: number
  ): Promise<void>;
  moveTaskListToProject(
    taskListId: string,
    targetProjectId: string,
    targetIndex?: number
  ): Promise<void>;

  // ヘルパー
  getProjectIdByListId(listId: string): string | null;

  // テスト用
  reset(): void;
}

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
