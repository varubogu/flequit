import type { Task } from '$lib/types/task';
import type { ProjectTree } from '$lib/types/project';
import type { SubTask, SubTaskPatch } from '$lib/types/sub-task';
import type { TaskListWithTasks } from '$lib/types/task-list';
import type { TaskList } from '$lib/types/task-list';
import type { Project } from '$lib/types/project';
import type { Tag } from '$lib/types/tag';
import { getBackendService } from '$lib/services/backend/index';
import type { BackendService } from '$lib/services/backend/index';
import { ProjectsService } from '$lib/services/projects-service';

/**
 * データ管理の中間サービス層
 * UI層とバックエンド層の間の橋渡しを行う
 */
export class DataService {
  private backend: BackendService | null = null;

  private async getBackend(): Promise<BackendService> {
    if (!this.backend) {
      this.backend = await getBackendService();
    }
    return this.backend;
  }

  /**
   * 現在選択中のプロジェクトIDを取得します
   * プロジェクト固有の操作に必要なprojectIdを提供します
   */
  private getProjectId(): string {
    const projectId = ProjectsService.getSelectedProjectId();
    if (!projectId) {
      throw new Error('プロジェクトが選択されていません。先にプロジェクトを選択してください。');
    }
    return projectId;
  }

  /**
   * タスクIDからプロジェクトIDを取得します
   * サブタスク作成時に親タスクのプロジェクトIDを取得するために使用します
   */
  private async getProjectIdByTaskId(taskId: string): Promise<string | null> {
    // TaskStoreからタスクを検索してプロジェクトIDを取得
    const { taskStore } = await import('$lib/stores/tasks.svelte');
    return taskStore.getProjectIdByTaskId(taskId);
  }

  /**
   * サブタスクIDからプロジェクトIDを取得します
   * サブタスク更新・削除時に親タスクのプロジェクトIDを取得するために使用します
   */
  private async getProjectIdBySubTaskId(subTaskId: string): Promise<string | null> {
    // TaskStoreからサブタスクを検索してプロジェクトIDを取得
    const { taskStore } = await import('$lib/stores/tasks.svelte');
    return taskStore.getProjectIdBySubTaskId(subTaskId);
  }


  // プロジェクトデータの読み込み
  async loadProjectData(): Promise<ProjectTree[]> {
    const backend = await this.getBackend();
    return await backend.initialization.loadProjectData();
  }

  // 完全な初期化実行
  async initializeAll() {
    const backend = await this.getBackend();
    return await backend.initialization.initializeAll();
  }

  // プロジェクト管理
  async createProject(projectData: {
    name: string;
    description?: string;
    color?: string;
    order_index?: number;
  }): Promise<Project> {
    const backend = await this.getBackend();
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: projectData.name,
      description: projectData.description,
      color: projectData.color,
      order_index: projectData.order_index ?? 0,
      is_archived: false,
      created_at: new Date(),
      updated_at: new Date()
    };
    await backend.project.create(newProject);
    return newProject;
  }

  async updateProject(
    projectId: string,
    updates: {
      name?: string;
      description?: string;
      color?: string;
      order_index?: number;
      is_archived?: boolean;
    }
  ): Promise<Project | null> {
    const backend = await this.getBackend();

    // Patch形式でのupdateに変更
    const patchData = {
      ...updates,
      updated_at: new Date()
    };

    const success = await backend.project.update(projectId, patchData);

    if (success) {
      // 更新後のデータを取得して返す
      return await backend.project.get(projectId);
    }
    return null;
  }

  async deleteProject(projectId: string): Promise<boolean> {
    const backend = await this.getBackend();
    return await backend.project.delete(projectId);
  }

  // タスクリスト管理
  async createTaskList(
    projectId: string,
    taskListData: {
      name: string;
      description?: string;
      color?: string;
      order_index?: number;
    }
  ): Promise<TaskList> {
    const backend = await this.getBackend();
    const newTaskList: TaskList = {
      id: crypto.randomUUID(),
      project_id: projectId,
      name: taskListData.name,
      description: taskListData.description,
      color: taskListData.color,
      order_index: taskListData.order_index ?? 0,
      is_archived: false,
      created_at: new Date(),
      updated_at: new Date()
    };
    await backend.tasklist.create(projectId, newTaskList);
    return newTaskList;
  }

  async updateTaskList(
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
    const backend = await this.getBackend();

    // Patch形式でのupdateに変更
    const patchData = {
      ...updates,
      updated_at: new Date()
    };

    const projectId = this.getProjectId();
    const success = await backend.tasklist.update(projectId, taskListId, patchData);

    if (success) {
      // 更新後のデータを取得して返す
      return await backend.tasklist.get(projectId, taskListId);
    }
    return null;
  }

  async deleteTaskList(taskListId: string): Promise<boolean> {
    const backend = await this.getBackend();
    const projectId = this.getProjectId();
    return await backend.tasklist.delete(projectId, taskListId);
  }

  // タスク管理
  async createTask(
    listId: string,
    taskData: Omit<Task, 'id' | 'list_id' | 'created_at' | 'updated_at'>
  ): Promise<Task> {
    const backend = await this.getBackend();
    const newTask: Task = {
      id: crypto.randomUUID(),
      ...taskData,
      list_id: listId,
      created_at: new Date(),
      updated_at: new Date()
    };
    // タスクデータに含まれるproject_idを使用
    const projectId = newTask.project_id;
    if (!projectId) {
      throw new Error('タスクにproject_idが設定されていません。');
    }
    await backend.task.create(projectId, newTask);
    return newTask;
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task | null> {
    const backend = await this.getBackend();
    console.log('DataService: updateTask called with backend:', backend.constructor.name);

    // TaskPatch形式でのupdateに変更（Date型をstring型に変換）
    const patchData: import('$lib/types/task').TaskPatch = {
      ...updates,
      plan_start_date: updates.plan_start_date?.toISOString() ?? undefined,
      plan_end_date: updates.plan_end_date?.toISOString() ?? undefined,
      do_start_date: updates.do_start_date?.toISOString() ?? undefined,
      do_end_date: updates.do_end_date?.toISOString() ?? undefined
    };

    // tagsはオブジェクト配列として保持（フロントエンドではtag_idsは使用しない）

    console.log('DataService: calling backend.task.update');
    const projectId = this.getProjectId();
    const success = await backend.task.update(projectId, taskId, patchData);
    console.log('DataService: backend.task.update result:', success);

    if (success) {
      // 更新後のデータを取得して返す
      return await backend.task.get(projectId, taskId);
    }
    return null;
  }

  async deleteTask(taskId: string): Promise<boolean> {
    const backend = await this.getBackend();
    const projectId = this.getProjectId();
    return await backend.task.delete(projectId, taskId);
  }

  // サブタスク管理
  async createSubTask(
    taskId: string,
    subTaskData: {
      title: string;
      description?: string;
      status?: string;
      priority?: number;
    }
  ): Promise<SubTask> {
    const backend = await this.getBackend();
    const newSubTask: SubTask = {
      id: crypto.randomUUID(),
      task_id: taskId,
      title: subTaskData.title,
      description: subTaskData.description,
      status:
        (subTaskData.status as
          | 'not_started'
          | 'in_progress'
          | 'waiting'
          | 'completed'
          | 'cancelled') || 'not_started',
      priority: subTaskData.priority,
      order_index: 0,
      completed: false,
      assigned_user_ids: [],
      tags: [],
      created_at: new Date(),
      updated_at: new Date()
    };
    // 親タスクからプロジェクトIDを取得
    const projectId = await this.getProjectIdByTaskId(taskId);
    if (!projectId) {
      throw new Error(`タスクID ${taskId} に対応するプロジェクトが見つかりません。`);
    }
    await backend.subtask.create(projectId, newSubTask);
    return newSubTask;
  }

  async updateSubTask(subTaskId: string, updates: Partial<SubTask>): Promise<SubTask | null> {
    const backend = await this.getBackend();
    console.log('DataService: updateSubTask called with backend:', backend.constructor.name);

    // Patch形式でのupdateに変更（Date型をstring型に変換）
    const patchData = {
      ...updates,
      plan_start_date: updates.plan_start_date ? updates.plan_start_date.toISOString() : updates.plan_start_date,
      plan_end_date: updates.plan_end_date ? updates.plan_end_date.toISOString() : updates.plan_end_date,
      updated_at: new Date()
    } as SubTaskPatch;

    console.log('DataService: calling backend.subtask.update');
    // サブタスクIDからプロジェクトIDを取得
    const projectId = await this.getProjectIdBySubTaskId(subTaskId);
    if (!projectId) {
      throw new Error(`サブタスクID ${subTaskId} に対応するプロジェクトが見つかりません。`);
    }
    const success = await backend.subtask.update(projectId, subTaskId, patchData);
    console.log('DataService: backend.subtask.update result:', success);

    if (success) {
      // 更新後のデータを取得して返す
      return await backend.subtask.get(projectId, subTaskId);
    }
    return null;
  }

  async deleteSubTask(subTaskId: string): Promise<boolean> {
    const backend = await this.getBackend();
    // サブタスクIDからプロジェクトIDを取得
    const projectId = await this.getProjectIdBySubTaskId(subTaskId);
    if (!projectId) {
      throw new Error(`サブタスクID ${subTaskId} に対応するプロジェクトが見つかりません。`);
    }
    return await backend.subtask.delete(projectId, subTaskId);
  }

  // タグ管理
  async createTag(tagData: { name: string; color?: string; order_index?: number }): Promise<Tag> {
    const backend = await this.getBackend();
    const newTag: Tag = {
      id: crypto.randomUUID(),
      name: tagData.name,
      color: tagData.color,
      order_index: tagData.order_index || 0,
      created_at: new Date(),
      updated_at: new Date()
    };
    const projectId = this.getProjectId();
    await backend.tag.create(projectId, newTag);
    return newTag;
  }

  async updateTag(tagId: string, updates: Partial<Tag>): Promise<Tag | null> {
    const backend = await this.getBackend();
    console.log('DataService: updateTag called with backend:', backend.constructor.name);

    // Patch形式でのupdateに変更
    const patchData = {
      ...updates,
      updated_at: new Date()
    };

    console.log('DataService: calling backend.tag.update');
    const projectId = this.getProjectId();
    const success = await backend.tag.update(projectId, tagId, patchData);
    console.log('DataService: backend.tag.update result:', success);

    if (success) {
      // 更新後のデータを取得して返す
      return await backend.tag.get(projectId, tagId);
    }
    return null;
  }

  async deleteTag(tagId: string): Promise<boolean> {
    const backend = await this.getBackend();
    const projectId = this.getProjectId();
    return await backend.tag.delete(projectId, tagId);
  }

  // 複合操作（TaskStoreで使用されているメソッド）
  async createTaskWithSubTasks(listId: string, task: Task): Promise<void> {
    await this.createTask(listId, task);
  }

  async updateTaskWithSubTasks(taskId: string, updates: Record<string, unknown>): Promise<void> {
    // tagsプロパティを含む更新に対応
    await this.updateTask(taskId, updates);
  }

  async deleteTaskWithSubTasks(taskId: string): Promise<void> {
    await this.deleteTask(taskId);
  }

  async addTagToSubTask(subTaskId: string, tagId: string): Promise<void> {
    const backend = await this.getBackend();
    console.log('DataService: addTagToSubTask called', { subTaskId, tagId });

    // 既存のサブタスクを取得
    const projectId = this.getProjectId();
    const subTask = await backend.subtask.get(projectId, subTaskId);

    // タグオブジェクトを取得
    const tag = await backend.tag.get(projectId, tagId);

    // Web環境では既存データが取得できないため、仮のタグオブジェクトまたは取得したタグで更新
    if (!subTask) {
      console.log('DataService: SubTask not found in backend (Web environment), updating with tag');
      const tagToUse =
        tag ||
        ({
          id: tagId,
          name: `Tag-${tagId}`, // 仮の名前
          created_at: new Date(),
          updated_at: new Date()
        } as Tag);
      await this.updateSubTask(subTaskId, { tags: [tagToUse] });
      return;
    }

    if (!tag) {
      console.warn('DataService: Tag not found for addTagToSubTask', tagId);
      return;
    }

    // タグが既に存在しない場合のみ追加
    const currentTags = subTask.tags || [];
    const tagExists = currentTags.some((t) => t.id === tagId);
    if (!tagExists) {
      const updatedTags = [...currentTags, tag];
      await this.updateSubTask(subTaskId, { tags: updatedTags });
    }
  }

  async removeTagFromSubTask(subTaskId: string, tagId: string): Promise<void> {
    const backend = await this.getBackend();
    console.log('DataService: removeTagFromSubTask called', { subTaskId, tagId });

    // 既存のサブタスクを取得
    const projectId = this.getProjectId();
    const subTask = await backend.subtask.get(projectId, subTaskId);

    // Web環境では既存データが取得できないため、空のタグ配列で更新
    if (!subTask) {
      console.log(
        'DataService: SubTask not found in backend (Web environment), attempting tag removal'
      );
      await this.updateSubTask(subTaskId, { tags: [] });
      return;
    }

    // タグIDが存在する場合のみ削除
    const currentTags = subTask.tags || [];
    const filteredTags = currentTags.filter((tag) => tag.id !== tagId);
    if (filteredTags.length !== currentTags.length) {
      await this.updateSubTask(subTaskId, { tags: filteredTags });
    }
  }

  // TaskStore向けの型変換メソッド
  async createProjectTree(projectData: {
    name: string;
    description?: string;
    color?: string;
    order_index?: number;
  }): Promise<ProjectTree> {
    const project = await this.createProject(projectData);
    return {
      ...project,
      task_lists: []
    };
  }

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
  }
}

// シングルトンインスタンス
export const dataService = new DataService();
