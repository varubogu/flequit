import type { TaskList } from '$lib/types/task-list';
import type { ProjectWithLists } from '$lib/types/project';
import type { Project } from '$lib/types/project';
import { dataService } from '$lib/services/data-service';
import { taskStore } from '$lib/stores/tasks.svelte';

export class ProjectsService {
  // プロジェクト作成
  static async createProject(projectData: {
    name: string;
    description?: string;
    color?: string;
    order_index?: number;
  }): Promise<Project | null> {
    try {
      const newProject = await dataService.createProject(projectData);
      // ローカルストアも更新
      await taskStore.addProject(projectData);
      return newProject;
    } catch (error) {
      console.error('Failed to create project:', error);
      return null;
    }
  }

  // プロジェクト更新
  static async updateProject(
    projectId: string,
    updates: {
      name?: string;
      description?: string;
      color?: string;
      order_index?: number;
      is_archived?: boolean;
    }
  ): Promise<Project | null> {
    try {
      const updatedProject = await dataService.updateProject(projectId, updates);
      if (!updatedProject) return null;

      // ローカルストアも更新
      await taskStore.updateProject(projectId, updates);
      return updatedProject;
    } catch (error) {
      console.error('Failed to update project:', error);
      return null;
    }
  }

  // プロジェクト削除
  static async deleteProject(projectId: string): Promise<boolean> {
    try {
      const success = await dataService.deleteProject(projectId);
      if (success) {
        // ローカルストアからも削除
        await taskStore.deleteProject(projectId);
      }
      return success;
    } catch (error) {
      console.error('Failed to delete project:', error);
      return false;
    }
  }

  // プロジェクト選択
  static selectProject(projectId: string | null): void {
    taskStore.selectProject(projectId);
  }

  // プロジェクトID取得（名前で検索）
  static getProjectIdByName(name: string): string | null {
    const project = taskStore.projects.find((p) => p.name === name);
    return project?.id || null;
  }

  // プロジェクト取得（ID指定）
  static getProjectById(projectId: string): Project | null {
    const project = taskStore.projects.find((p) => p.id === projectId);
    return project || null;
  }

  // プロジェクト取得（タスクリスト付き）
  static getProjectWithListsById(projectId: string): ProjectWithLists | null {
    const project = taskStore.projects.find((p) => p.id === projectId);
    if (!project) return null;

    return {
      ...project,
      taskLists: project.taskLists.map((list) => ({
        id: list.id,
        projectId: list.projectId,
        name: list.name,
        description: list.description,
        color: list.color,
        orderIndex: list.orderIndex,
        isArchived: list.isArchived,
        createdAt: list.createdAt,
        updatedAt: list.updatedAt
      }))
    };
  }

  // 全プロジェクト取得
  static getAllProjects(): Project[] {
    return taskStore.projects.map((project) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      color: project.color,
      orderIndex: project.orderIndex,
      isArchived: project.isArchived,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    }));
  }

  // プロジェクト検索（名前による部分一致）
  static searchProjectsByName(searchTerm: string): Project[] {
    const lowercaseSearch = searchTerm.toLowerCase();
    return this.getAllProjects().filter(
      (project) =>
        project.name.toLowerCase().includes(lowercaseSearch) ||
        (project.description && project.description.toLowerCase().includes(lowercaseSearch))
    );
  }

  // プロジェクト並べ替え
  static async reorderProjects(fromIndex: number, toIndex: number): Promise<void> {
    await taskStore.reorderProjects(fromIndex, toIndex);
  }

  // プロジェクト位置移動
  static async moveProjectToPosition(projectId: string, targetIndex: number): Promise<void> {
    await taskStore.moveProjectToPosition(projectId, targetIndex);
  }

  // タスクリスト作成
  static async createTaskList(
    projectId: string,
    taskListData: {
      name: string;
      description?: string;
      color?: string;
      order_index?: number;
    }
  ): Promise<TaskList | null> {
    try {
      const newTaskList = await dataService.createTaskList(projectId, taskListData);
      // ローカルストアも更新
      await taskStore.addTaskList(projectId, taskListData);
      return newTaskList;
    } catch (error) {
      console.error('Failed to create task list:', error);
      return null;
    }
  }

  // タスクリスト更新
  static async updateTaskList(
    taskListId: string,
    updates: {
      name?: string;
      description?: string;
      color?: string;
      order_index?: number;
      is_archived?: boolean;
      project_id?: string;
    }
  ): Promise<TaskList | null> {
    try {
      // taskListIdからprojectIdを取得
      const projectId = taskStore.getProjectIdByListId(taskListId);
      if (!projectId) {
        throw new Error(`タスクリストID ${taskListId} に対応するプロジェクトが見つかりません。`);
      }

      const updatedTaskList = await dataService.updateTaskList(projectId, taskListId, updates);
      if (!updatedTaskList) return null;

      // ローカルストアも更新
      await taskStore.updateTaskList(taskListId, updates);
      return updatedTaskList;
    } catch (error) {
      console.error('Failed to update task list:', error);
      return null;
    }
  }

  // タスクリスト削除
  static async deleteTaskList(taskListId: string): Promise<boolean> {
    try {
      // taskListIdからprojectIdを取得
      const projectId = taskStore.getProjectIdByListId(taskListId);
      if (!projectId) {
        throw new Error(`タスクリストID ${taskListId} に対応するプロジェクトが見つかりません。`);
      }

      const success = await dataService.deleteTaskList(projectId, taskListId);
      if (success) {
        // ローカルストアからも削除
        await taskStore.deleteTaskList(taskListId);
      }
      return success;
    } catch (error) {
      console.error('Failed to delete task list:', error);
      return false;
    }
  }

  // タスクリスト選択
  static selectTaskList(listId: string | null): void {
    taskStore.selectList(listId);
  }

  // タスクリストID取得（名前で検索）
  static getTaskListIdByName(projectId: string, name: string): string | null {
    const project = taskStore.projects.find((p) => p.id === projectId);
    if (!project) return null;

    const taskList = project.taskLists.find((list) => list.name === name);
    return taskList?.id || null;
  }

  // タスクリスト取得（ID指定）
  static getTaskListById(taskListId: string): TaskList | null {
    for (const project of taskStore.projects) {
      const taskList = project.taskLists.find((list) => list.id === taskListId);
      if (taskList) {
        return {
          id: taskList.id,
          projectId: taskList.projectId,
          name: taskList.name,
          description: taskList.description,
          color: taskList.color,
          orderIndex: taskList.orderIndex,
          isArchived: taskList.isArchived,
          createdAt: taskList.createdAt,
          updatedAt: taskList.updatedAt
        };
      }
    }
    return null;
  }

  // プロジェクト内の全タスクリスト取得
  static getTaskListsByProjectId(projectId: string): TaskList[] {
    const project = taskStore.projects.find((p) => p.id === projectId);
    if (!project) return [];

    return project.taskLists.map((list) => ({
      id: list.id,
      projectId: list.projectId,
      name: list.name,
      description: list.description,
      color: list.color,
      orderIndex: list.orderIndex,
      isArchived: list.isArchived,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt
    }));
  }

  // タスクリスト検索（名前による部分一致）
  static searchTaskListsByName(searchTerm: string, projectId?: string): TaskList[] {
    const lowercaseSearch = searchTerm.toLowerCase();
    const projects = projectId
      ? taskStore.projects.filter((p) => p.id === projectId)
      : taskStore.projects;

    const foundTaskLists: TaskList[] = [];

    for (const project of projects) {
      const matchingLists = project.taskLists.filter(
        (list) =>
          list.name.toLowerCase().includes(lowercaseSearch) ||
          (list.description && list.description.toLowerCase().includes(lowercaseSearch))
      );

      foundTaskLists.push(
        ...matchingLists.map((list) => ({
          id: list.id,
          projectId: list.projectId,
          name: list.name,
          description: list.description,
          color: list.color,
          orderIndex: list.orderIndex,
          isArchived: list.isArchived,
          createdAt: list.createdAt,
          updatedAt: list.updatedAt
        }))
      );
    }

    return foundTaskLists;
  }

  // タスクリスト並べ替え
  static async reorderTaskLists(
    projectId: string,
    fromIndex: number,
    toIndex: number
  ): Promise<void> {
    await taskStore.reorderTaskLists(projectId, fromIndex, toIndex);
  }

  // タスクリストをプロジェクト間移動
  static async moveTaskListToProject(
    taskListId: string,
    targetProjectId: string,
    targetIndex?: number
  ): Promise<void> {
    await taskStore.moveTaskListToProject(taskListId, targetProjectId, targetIndex);
  }

  // タスクリスト位置移動
  static async moveTaskListToPosition(
    taskListId: string,
    targetProjectId: string,
    targetIndex: number
  ): Promise<void> {
    await taskStore.moveTaskListToPosition(taskListId, targetProjectId, targetIndex);
  }

  // タスクリストのタスク数取得
  static getTaskCountByListId(taskListId: string): number {
    for (const project of taskStore.projects) {
      const taskList = project.taskLists.find((list) => list.id === taskListId);
      if (taskList) {
        return taskList.tasks.length;
      }
    }
    return 0;
  }

  // プロジェクトのタスク数取得
  static getTaskCountByProjectId(projectId: string): number {
    const project = taskStore.projects.find((p) => p.id === projectId);
    if (!project) return 0;

    return project.taskLists.reduce((total, list) => total + list.tasks.length, 0);
  }

  // 選択中のプロジェクトID取得
  static getSelectedProjectId(): string | null {
    return taskStore.selectedProjectId;
  }

  // 選択中のタスクリストID取得
  static getSelectedTaskListId(): string | null {
    return taskStore.selectedListId;
  }

  // プロジェクトとタスクリストのペア検索
  static findProjectAndTaskListByTaskId(
    taskId: string
  ): { project: Project; taskList: TaskList } | null {
    const result = taskStore.getTaskProjectAndList(taskId);
    if (!result) return null;

    return {
      project: {
        id: result.project.id,
        name: result.project.name,
        description: result.project.description,
        color: result.project.color,
        orderIndex: result.project.orderIndex,
        isArchived: result.project.isArchived,
        createdAt: result.project.createdAt,
        updatedAt: result.project.updatedAt
      },
      taskList: {
        id: result.taskList.id,
        projectId: result.taskList.projectId,
        name: result.taskList.name,
        description: result.taskList.description,
        color: result.taskList.color,
        orderIndex: result.taskList.orderIndex,
        isArchived: result.taskList.isArchived,
        createdAt: result.taskList.createdAt,
        updatedAt: result.taskList.updatedAt
      }
    };
  }

  // アーカイブ済みプロジェクトのフィルタリング
  static getActiveProjects(): Project[] {
    return this.getAllProjects().filter((project) => !project.isArchived);
  }

  // アーカイブ済みタスクリストのフィルタリング
  static getActiveTaskListsByProjectId(projectId: string): TaskList[] {
    return this.getTaskListsByProjectId(projectId).filter((list) => !list.isArchived);
  }

  // プロジェクトのアーカイブ状態変更
  static async archiveProject(projectId: string, isArchived: boolean): Promise<boolean> {
    const result = await this.updateProject(projectId, { is_archived: isArchived });
    return result !== null;
  }

  // タスクリストのアーカイブ状態変更
  static async archiveTaskList(taskListId: string, isArchived: boolean): Promise<boolean> {
    const result = await this.updateTaskList(taskListId, { is_archived: isArchived });
    return result !== null;
  }
}
