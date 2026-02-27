import type { ProjectTree } from '../project';
import type { TaskListWithTasks } from '../task-list';

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
