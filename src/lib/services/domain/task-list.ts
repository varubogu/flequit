import type { TaskList, TaskListWithTasks } from '$lib/types/task-list';
import { resolveBackend } from '$lib/infrastructure/backend-client';
import { errorHandler } from '$lib/stores/error-handler.svelte';
import { TaskMutations } from '$lib/services/domain/task';
import { projectStore } from '$lib/stores/project-store.svelte';
import { selectionStore } from '$lib/stores/selection-store.svelte';
import type { ProjectTree } from '$lib/types/project';

/**
 * タスクリストドメインサービス（CRUD操作）
 *
 * 責務:
 * 1. バックエンドへの登録 (resolveBackend経由)
 * 2. タスクリストCRUD操作
 */
export const TaskListService = {
  /**
   * 新しいタスクリストを作成します
   */
  async createTaskList(
    projectId: string,
    taskListData: {
      name: string;
      description?: string;
      color?: string;
      order_index?: number;
    }
  ): Promise<TaskList> {
    const newTaskList: TaskList = {
      id: crypto.randomUUID(),
      projectId: projectId,
      name: taskListData.name,
      description: taskListData.description,
      color: taskListData.color,
      orderIndex: taskListData.order_index ?? 0,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      const backend = await resolveBackend();
      await backend.tasklist.create(projectId, newTaskList);
      return newTaskList;
    } catch (error) {
      console.error('Failed to create task list:', error);
      errorHandler.addSyncError('タスクリスト作成', 'tasklist', newTaskList.id, error);
      throw error;
    }
  },

  /**
   * タスクリストを更新します
   */
  async updateTaskList(
    projectId: string,
    taskListId: string,
    updates: Partial<TaskList>
  ): Promise<TaskList | null> {
    try {
      const backend = await resolveBackend();

      const patchData = {
        ...updates,
        updated_at: new Date()
      };

      const success = await backend.tasklist.update(projectId, taskListId, patchData);

      if (success) {
        return await backend.tasklist.get(projectId, taskListId);
      }
      return null;
    } catch (error) {
      console.error('Failed to update task list:', error);
      errorHandler.addSyncError('タスクリスト更新', 'tasklist', taskListId, error);
      throw error;
    }
  },

  /**
   * タスクリストを削除します
   */
  async deleteTaskList(projectId: string, taskListId: string): Promise<boolean> {
    try {
      const backend = await resolveBackend();
      return await backend.tasklist.delete(projectId, taskListId);
    } catch (error) {
      console.error('Failed to delete task list:', error);
      errorHandler.addSyncError('タスクリスト削除', 'tasklist', taskListId, error);
      throw error;
    }
  },

  /**
   * タスクリストWithTasksを作成します（TaskStore互換）
   */
  async createTaskListWithTasks(
    projectId: string,
    taskListData: {
      name: string;
      description?: string;
      color?: string;
      order_index?: number;
    }
  ): Promise<TaskListWithTasks> {
    const taskList = await this.createTaskList(projectId, taskListData);
    return {
      ...taskList,
      tasks: []
    };
  },

  /**
   * タスクを追加します（UIロジック）
   */
  async addNewTask(title: string): Promise<string | null> {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return null;
    }

    const targetListId = this.resolveTargetListId();
    if (!targetListId) {
      return null;
    }

    const mutationService = new TaskMutations();
    const newTask = await mutationService.addTask(targetListId, {
      title: trimmedTitle
    });

    return newTask ? newTask.id : null;
  },

  /**
   * タスク数のテキストを取得します
   */
  getTaskCountText(count: number): string {
    return `${count} task${count !== 1 ? 's' : ''}`;
  },

  /**
   * 対象となるタスクリストIDを解決します
   */
  resolveTargetListId(): string | null {
    if (selectionStore.selectedListId) {
      return selectionStore.selectedListId;
    }

    const selectedProject = this.getSelectedProject();
    const listFromProject = selectedProject?.taskLists?.[0];
    if (listFromProject) {
      return listFromProject.id;
    }

    return this.findFirstAvailableList();
  },

  /**
   * 選択中のプロジェクトを取得します（内部用）
   */
  getSelectedProject(): ProjectTree | null {
    const projectId = selectionStore.selectedProjectId;
    if (!projectId) {
      return null;
    }
    return projectStore.getProjectById(projectId);
  },

  /**
   * 最初に利用可能なリストを検索します（内部用）
   */
  findFirstAvailableList(): string | null {
    for (const project of projectStore.projects) {
      if (project.taskLists?.length) {
        return project.taskLists[0].id;
      }
    }
    return null;
  }
};
