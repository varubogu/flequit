import type { IProjectStore, ISelectionStore } from '$lib/types/store-interfaces';
import type { TaskListWithTasks } from '$lib/types/task-list';
import type { TaskListQueries } from '$lib/stores/task-list/task-list-queries.svelte';
import { resolveTaskListGateway, type TaskListGateway } from '$lib/dependencies/task-list';

/**
 * タスクリストCRUD操作
 *
 * 責務: タスクリストの作成、更新、削除
 */
export class TaskListMutations {
  private readonly taskListGateway: TaskListGateway;

  constructor(
    private projectStoreRef: IProjectStore,
    private selection: ISelectionStore,
    private queries: TaskListQueries,
    taskListGateway: TaskListGateway = resolveTaskListGateway()
  ) {
    this.taskListGateway = taskListGateway;
  }

  /**
   * タスクリストを追加
   */
  async addTaskList(
    projectId: string,
    taskList: { name: string; description?: string; color?: string }
  ) {
    try {
      const project = this.projectStoreRef.projects.find((p) => p.id === projectId);
      const taskListWithOrderIndex = {
        ...taskList,
        order_index: project?.taskLists?.length ?? 0
      };
      const newTaskList = await this.taskListGateway.createTaskListWithTasks(
        projectId,
        taskListWithOrderIndex
      );
      if (project) {
        if (!project.taskLists) {
          project.taskLists = [] as TaskListWithTasks[];
        }
        project.taskLists.push(newTaskList);
      }
      return newTaskList;
    } catch (error) {
      console.error('Failed to create task list:', error);
      return null;
    }
  }

  /**
   * タスクリストを更新
   */
  async updateTaskList(
    taskListId: string,
    updates: { name?: string; description?: string; color?: string }
  ): Promise<TaskListWithTasks | null> {
    try {
      // taskListIdからprojectIdを取得
      const projectId = this.queries.getProjectIdByListId(taskListId);
      if (!projectId) {
        throw new Error(`タスクリストID ${taskListId} に対応するプロジェクトが見つかりません。`);
      }

      const updatedTaskList = await this.taskListGateway.updateTaskList(
        projectId,
        taskListId,
        updates
      );
      if (updatedTaskList) {
        for (const project of this.projectStoreRef.projects) {
          const listIndex = project.taskLists.findIndex((l) => l.id === taskListId);
          if (listIndex !== -1) {
            project.taskLists[listIndex] = {
              ...project.taskLists[listIndex],
              ...updatedTaskList
            };
            // 更新された TaskListWithTasks を返す
            return project.taskLists[listIndex];
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to update task list:', error);
      return null;
    }
  }

  /**
   * タスクリストを削除
   */
  async deleteTaskList(taskListId: string) {
    try {
      // taskListIdからprojectIdを取得
      const projectId = this.queries.getProjectIdByListId(taskListId);
      if (!projectId) {
        throw new Error(`タスクリストID ${taskListId} に対応するプロジェクトが見つかりません。`);
      }

      const success = await this.taskListGateway.deleteTaskList(projectId, taskListId);
      if (success) {
        for (const project of this.projectStoreRef.projects) {
          const listIndex = project.taskLists.findIndex((l) => l.id === taskListId);
          if (listIndex !== -1) {
            project.taskLists.splice(listIndex, 1);
            // 削除されたタスクリストが選択されていた場合はクリア
            if (this.selection.selectedListId === taskListId) {
              this.selection.selectList(null);
              this.selection.selectTask(null);
              this.selection.selectSubTask(null);
            }
            break;
          }
        }
      }
      return success;
    } catch (error) {
      console.error('Failed to delete task list:', error);
      return false;
    }
  }
}
