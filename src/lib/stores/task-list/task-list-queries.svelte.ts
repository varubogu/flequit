import type { IProjectStore, ISelectionStore } from '$lib/types/store-interfaces';
import type { TaskListWithTasks } from '$lib/types/task-list';

/**
 * タスクリスト読み取り操作
 * 
 * 責務: タスクリストの検索、取得などの読み取り専用操作
 */
export class TaskListQueries {
  constructor(
    private projectStoreRef: IProjectStore,
    private selection: ISelectionStore
  ) {}

  /**
   * 現在選択されているタスクリストを取得
   */
  get selectedTaskList(): TaskListWithTasks | null {
    const listId = this.selection.selectedListId;
    if (!listId) return null;

    for (const project of this.projectStoreRef.projects) {
      const list = project.taskLists.find((l) => l.id === listId);
      if (list) return list;
    }
    return null;
  }

  /**
   * タスクリストIDから対応するプロジェクトIDを取得
   */
  getProjectIdByListId(listId: string): string | null {
    for (const project of this.projectStoreRef.projects) {
      const list = project.taskLists.find((l) => l.id === listId);
      if (list) {
        return project.id;
      }
    }
    return null;
  }
}
