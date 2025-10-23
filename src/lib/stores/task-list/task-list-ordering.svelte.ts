import type { IProjectStore } from '$lib/types/store-interfaces';
import type { TaskList, TaskListWithTasks } from '$lib/types/task-list';
import type { ProjectTree } from '$lib/types/project';
import { TaskListService as TaskListCrudService } from '$lib/services/domain/task-list';
import { errorHandler } from '../error-handler.svelte';
import { SvelteDate } from 'svelte/reactivity';

/**
 * タスクリスト並び替え操作
 * 
 * 責務: タスクリストの順序変更、プロジェクト間移動
 */
export class TaskListOrdering {
  constructor(private projectStoreRef: IProjectStore) {}

  /**
   * プロジェクト内でタスクリストを並び替え
   */
  async reorderTaskLists(projectId: string, fromIndex: number, toIndex: number) {
    const project = this.projectStoreRef.projects.find((p) => p.id === projectId);
    if (
      !project ||
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= project.taskLists.length ||
      toIndex >= project.taskLists.length
    ) {
      return;
    }

    const [movedTaskList] = project.taskLists.splice(fromIndex, 1);
    project.taskLists.splice(toIndex, 0, movedTaskList);

    // Update order indices and sync to backends
    project.updatedAt = new SvelteDate();
    for (let index = 0; index < project.taskLists.length; index++) {
      const taskList = project.taskLists[index];
      taskList.orderIndex = index;
      taskList.updatedAt = new SvelteDate();

      try {
        await TaskListCrudService.updateTaskList(projectId, taskList.id, { orderIndex: index } as Partial<TaskList>);
      } catch (error) {
        console.error('Failed to sync task list order to backends:', error);
        errorHandler.addSyncError('タスクリスト順序更新', 'tasklist', taskList.id, error);
      }
    }
  }

  /**
   * タスクリストを別のプロジェクトに移動
   */
  async moveTaskListToProject(taskListId: string, targetProjectId: string, targetIndex?: number) {
    // Find and remove the task list from its current project
    let taskListToMove: TaskListWithTasks | null = null;
    let sourceProject: ProjectTree | null = null;

    for (const project of this.projectStoreRef.projects) {
      const projectTaskLists = project.taskLists || [];
      const taskListIndex = projectTaskLists.findIndex((tl) => tl.id === taskListId);
      if (taskListIndex !== -1) {
        taskListToMove = projectTaskLists[taskListIndex];
        sourceProject = project;
        project.taskLists = projectTaskLists;
        project.taskLists.splice(taskListIndex, 1);
        project.updatedAt = new SvelteDate();

        // Update order indices in source project and sync to backends
        for (let index = 0; index < (project.taskLists || []).length; index++) {
          const tl = project.taskLists[index];
          tl.orderIndex = index;
          tl.updatedAt = new SvelteDate();

        try {
          await TaskListCrudService.updateTaskList(project.id, tl.id, { orderIndex: index } as Partial<TaskList>);
        } catch (error) {
            console.error('Failed to sync source project task list order to backends:', error);
            errorHandler.addSyncError('タスクリスト順序更新（移動元）', 'tasklist', tl.id, error);
          }
        }
        break;
      }
    }

    if (!taskListToMove || !sourceProject) return;

    // Find target project and add the task list
    const targetProject = this.projectStoreRef.projects.find((p) => p.id === targetProjectId);
    if (!targetProject) {
      // Restore to original project if target not found
      if (!sourceProject.taskLists) sourceProject.taskLists = [] as TaskListWithTasks[];
      sourceProject.taskLists.push(taskListToMove);
      return;
    }

    // Update task list's project reference
    taskListToMove.projectId = targetProjectId;
    taskListToMove.updatedAt = new SvelteDate();

    // Insert at specified position or at the end
    if (
      targetIndex !== undefined &&
      targetIndex >= 0 &&
      targetIndex <= (targetProject.taskLists ? targetProject.taskLists.length : 0)
    ) {
      if (!targetProject.taskLists) targetProject.taskLists = [] as TaskListWithTasks[];
      targetProject.taskLists.splice(targetIndex, 0, taskListToMove);
    } else {
      if (!targetProject.taskLists) targetProject.taskLists = [] as TaskListWithTasks[];
      targetProject.taskLists.push(taskListToMove);
    }

    // Update order indices in target project and sync to backends
    targetProject.updatedAt = new SvelteDate();
    for (let index = 0; index < (targetProject.taskLists || []).length; index++) {
      const tl = targetProject.taskLists[index];
      tl.orderIndex = index;
      tl.updatedAt = new SvelteDate();

    try {
        await TaskListCrudService.updateTaskList(targetProject.id, tl.id, {
          orderIndex: index
        } as Partial<TaskList>);
      } catch (error) {
        console.error('Failed to sync target project task list order to backends:', error);
        errorHandler.addSyncError('タスクリスト順序更新（移動先）', 'tasklist', tl.id, error);
      }
    }
  }

  /**
   * タスクリストを指定位置に移動
   */
  async moveTaskListToPosition(taskListId: string, targetProjectId: string, targetIndex: number) {
    // Find current position
    let currentProject: ProjectTree | null = null;
    let currentIndex = -1;

    for (const project of this.projectStoreRef.projects) {
      const index = project.taskLists.findIndex((tl) => tl.id === taskListId);
      if (index !== -1) {
        currentProject = project;
        currentIndex = index;
        break;
      }
    }

    if (!currentProject || currentIndex === -1) return;

    if (currentProject.id === targetProjectId) {
      // Same project - just reorder
      await this.reorderTaskLists(targetProjectId, currentIndex, targetIndex);
    } else {
      // Different project - move
      await this.moveTaskListToProject(taskListId, targetProjectId, targetIndex);
    }
  }
}
