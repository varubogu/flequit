import type { ITaskListStore, IProjectStore, ISelectionStore } from '$lib/types/store-interfaces';
import type { TaskList, TaskListWithTasks } from '$lib/types/task-list';
import { resolveProjectStore } from '$lib/stores/providers/project-store-provider';
import { selectionStore } from './selection-store.svelte';
import { TaskListQueries } from './task-list/task-list-queries.svelte';
import { TaskListMutations } from './task-list/task-list-mutations.svelte';
import { TaskListOrdering } from './task-list/task-list-ordering.svelte';

/**
 * タスクリスト管理ストア
 *
 * 責務: タスクリストのCRUD操作、並び替え、プロジェクト間移動を統合
 * 依存: ProjectStore（プロジェクト情報）, SelectionStore（選択状態）
 *
 * TaskStoreから分離して、タスクリスト管理の責務を明確化しています。
 * 内部的には責務ごとに分割されたクラスを使用しています。
 */
export class TaskListStore implements ITaskListStore {
  private queries: TaskListQueries;
  private mutations: TaskListMutations;
  private ordering: TaskListOrdering;

  constructor(
    private projectStoreRef: IProjectStore,
    private selection: ISelectionStore
  ) {
    this.queries = new TaskListQueries(projectStoreRef, selection);
    this.mutations = new TaskListMutations(projectStoreRef, selection, this.queries);
    this.ordering = new TaskListOrdering(projectStoreRef);
  }

  // クエリ操作を委譲
  get selectedTaskList(): TaskListWithTasks | null {
    return this.queries.selectedTaskList;
  }

  getProjectIdByListId(listId: string): string | null {
    return this.queries.getProjectIdByListId(listId);
  }

  // CRUD操作を委譲
  async addTaskList(
    projectId: string,
    taskList: { name: string; description?: string; color?: string }
  ) {
    return this.mutations.addTaskList(projectId, taskList);
  }

  async updateTaskList(
    taskListId: string,
    updates: { name?: string; description?: string; color?: string }
  ): Promise<TaskListWithTasks | null> {
    return this.mutations.updateTaskList(taskListId, updates);
  }

  async deleteTaskList(taskListId: string) {
    return this.mutations.deleteTaskList(taskListId);
  }

  // 並び替え操作を委譲
  async reorderTaskLists(projectId: string, fromIndex: number, toIndex: number) {
    return this.ordering.reorderTaskLists(projectId, fromIndex, toIndex);
  }

  async moveTaskListToProject(taskListId: string, targetProjectId: string, targetIndex?: number) {
    return this.ordering.moveTaskListToProject(taskListId, targetProjectId, targetIndex);
  }

  async moveTaskListToPosition(taskListId: string, targetProjectId: string, targetIndex: number) {
    return this.ordering.moveTaskListToPosition(taskListId, targetProjectId, targetIndex);
  }

  // テスト用
  reset() {
    // TaskListはProjectTreeに含まれているため、ProjectStoreのresetで対応済み
    // 追加の状態がないため、このメソッドは空実装
  }
}

// シングルトンエクスポート（真の遅延初期化で循環参照を回避）
let _taskListStore: TaskListStore | undefined;
function getTaskListStore(): TaskListStore {
  if (!_taskListStore) {
    _taskListStore = new TaskListStore(resolveProjectStore(), selectionStore);
  }
  return _taskListStore;
}

// Proxyを使用してアクセス時に初期化
export const taskListStore = new Proxy({} as TaskListStore, {
  get(_target, prop) {
    const store = getTaskListStore();
    const value = store[prop as keyof TaskListStore];
    return typeof value === 'function' ? value.bind(store) : value;
  }
});
