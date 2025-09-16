import type { Task } from '$lib/types/task';
import type { ProjectTree } from '$lib/types/project';
import type { SubTask } from '$lib/types/sub-task';
import type { TaskList, TaskListWithTasks } from '$lib/types/task-list';
import type { Project } from '$lib/types/project';
import type { Tag } from '$lib/types/tag';
import type { RecurrenceRule } from '$lib/types/recurrence-rule';
import type { TaskRecurrence } from '$lib/types/task-recurrence';
import type { SubtaskRecurrence } from '$lib/types/subtask-recurrence';
import type { Settings } from '$lib/types/settings';
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
      orderIndex: projectData.order_index ?? 0,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date()
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
      projectId: projectId,
      name: taskListData.name,
      description: taskListData.description,
      color: taskListData.color,
      orderIndex: taskListData.order_index ?? 0,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await backend.tasklist.create(projectId, newTaskList);
    return newTaskList;
  }

  async updateTaskList(
    projectId: string,
    taskListId: string,
    updates: Partial<TaskList>
  ): Promise<TaskList | null> {
    const backend = await this.getBackend();

    // Patch形式でのupdateに変更
    const patchData = {
      ...updates,
      updated_at: new Date()
    };

    const success = await backend.tasklist.update(projectId, taskListId, patchData);

    if (success) {
      // 更新後のデータを取得して返す
      return await backend.tasklist.get(projectId, taskListId);
    }
    return null;
  }

  async deleteTaskList(projectId: string, taskListId: string): Promise<boolean> {
    const backend = await this.getBackend();
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
      listId: listId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    // タスクデータに含まれるproject_idを使用
    const projectId = newTask.projectId;
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
    const patchData = {
      ...updates,
      plan_start_date: updates.planStartDate?.toISOString() ?? undefined,
      plan_end_date: updates.planEndDate?.toISOString() ?? undefined,
      do_start_date: updates.doStartDate?.toISOString() ?? undefined,
      do_end_date: updates.doEndDate?.toISOString() ?? undefined
    } as any;

    // tagsはオブジェクト配列として保持（フロントエンドではtag_idsは使用しない）

    console.log('DataService: calling backend.task.update');
    // タスクIDからプロジェクトIDを取得（他のメソッドと一貫性を保つ）
    const projectId = await this.getProjectIdByTaskId(taskId);
    if (!projectId) {
      throw new Error(`タスクID ${taskId} に対応するプロジェクトが見つかりません。`);
    }
    const success = await backend.task.update(projectId, taskId, patchData);
    console.log('DataService: backend.task.update result:', success);

    if (success) {
      // 更新後のデータを取得して返す
      return await backend.task.get(projectId, taskId);
    }
    return null;
  }

  async deleteTask(taskId: string, projectId?: string): Promise<boolean> {
    const backend = await this.getBackend();
    // プロジェクトIDが指定されていない場合のみ推定を試みる
    let actualProjectId: string = projectId || '';
    if (!actualProjectId) {
      const foundProjectId = await this.getProjectIdByTaskId(taskId);
      if (!foundProjectId) {
        throw new Error(`タスクID ${taskId} に対応するプロジェクトが見つかりません。`);
      }
      actualProjectId = foundProjectId;
    }
    return await backend.task.delete(actualProjectId, taskId);
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
      taskId: taskId,
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
      orderIndex: 0,
      completed: false,
      assignedUserIds: [],
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date()
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
      planStartDate: updates.planStartDate ? updates.planStartDate.toISOString() : updates.planStartDate,
      planEndDate: updates.planEndDate ? updates.planEndDate.toISOString() : updates.planEndDate,
      updatedAt: new Date()
    } as Partial<SubTask>;

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

  async deleteSubTask(subTaskId: string, projectId?: string): Promise<boolean> {
    const backend = await this.getBackend();
    // プロジェクトIDが指定されていない場合のみ推定を試みる
    let actualProjectId: string = projectId || '';
    if (!actualProjectId) {
      const foundProjectId = await this.getProjectIdBySubTaskId(subTaskId);
      if (!foundProjectId) {
        throw new Error(`サブタスクID ${subTaskId} に対応するプロジェクトが見つかりません。`);
      }
      actualProjectId = foundProjectId;
    }
    return await backend.subtask.delete(actualProjectId, subTaskId);
  }

  // タグ管理
  async createTag(tagData: { name: string; color?: string; order_index?: number }, projectId?: string): Promise<Tag> {
    const backend = await this.getBackend();
    const newTag: Tag = {
      id: crypto.randomUUID(),
      name: tagData.name,
      color: tagData.color,
      orderIndex: tagData.order_index || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    // プロジェクトIDが指定されていない場合のみ、選択中のプロジェクトIDを取得
    const actualProjectId = projectId || this.getProjectId();
    await backend.tag.create(actualProjectId, newTag);
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

  async deleteTaskWithSubTasks(taskId: string, projectId: string): Promise<boolean> {
    const backend = await this.getBackend();
    return await backend.task.delete(projectId, taskId);
  }

  async addTagToSubTask(subTaskId: string, tagId: string): Promise<void> {
    const backend = await this.getBackend();
    console.log('DataService: addTagToSubTask called', { subTaskId, tagId });

    // サブタスクIDからプロジェクトIDを取得
    const projectId = await this.getProjectIdBySubTaskId(subTaskId);
    if (!projectId) {
      throw new Error(`サブタスクID ${subTaskId} に対応するプロジェクトが見つかりません。`);
    }

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
          createdAt: new Date(),
          updatedAt: new Date()
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

    // サブタスクIDからプロジェクトIDを取得
    const projectId = await this.getProjectIdBySubTaskId(subTaskId);
    if (!projectId) {
      throw new Error(`サブタスクID ${subTaskId} に対応するプロジェクトが見つかりません。`);
    }

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
      taskLists: []
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

  // 繰り返しルール管理
  async createRecurrenceRule(rule: RecurrenceRule): Promise<boolean> {
    const backend = await this.getBackend();
    return await backend.recurrenceRule.create(rule);
  }

  async getRecurrenceRule(ruleId: string): Promise<RecurrenceRule | null> {
    const backend = await this.getBackend();
    return await backend.recurrenceRule.get(ruleId);
  }

  async getAllRecurrenceRules(): Promise<RecurrenceRule[]> {
    const backend = await this.getBackend();
    return await backend.recurrenceRule.getAll();
  }

  async updateRecurrenceRule(rule: RecurrenceRule): Promise<boolean> {
    const backend = await this.getBackend();
    return await backend.recurrenceRule.update(rule);
  }

  async deleteRecurrenceRule(ruleId: string): Promise<boolean> {
    const backend = await this.getBackend();
    return await backend.recurrenceRule.delete(ruleId);
  }

  // タスク繰り返し管理
  async createTaskRecurrence(taskRecurrence: TaskRecurrence): Promise<boolean> {
    const backend = await this.getBackend();
    return await backend.taskRecurrence.create(taskRecurrence);
  }

  async getTaskRecurrenceByTaskId(taskId: string): Promise<TaskRecurrence | null> {
    const backend = await this.getBackend();
    return await backend.taskRecurrence.getByTaskId(taskId);
  }

  async deleteTaskRecurrence(taskId: string): Promise<boolean> {
    const backend = await this.getBackend();
    return await backend.taskRecurrence.delete(taskId);
  }

  // サブタスク繰り返し管理
  async createSubtaskRecurrence(subtaskRecurrence: SubtaskRecurrence): Promise<boolean> {
    const backend = await this.getBackend();
    return await backend.subtaskRecurrence.create(subtaskRecurrence);
  }

  async getSubtaskRecurrenceBySubtaskId(subtaskId: string): Promise<SubtaskRecurrence | null> {
    const backend = await this.getBackend();
    return await backend.subtaskRecurrence.getBySubtaskId(subtaskId);
  }

  async deleteSubtaskRecurrence(subtaskId: string): Promise<boolean> {
    const backend = await this.getBackend();
    return await backend.subtaskRecurrence.delete(subtaskId);
  }

  // 設定管理
  async loadSettings(): Promise<Settings | null> {
    const backend = await this.getBackend();
    return await backend.settingsManagement.loadSettings();
  }

  async saveSettings(settings: Settings): Promise<boolean> {
    const backend = await this.getBackend();
    return await backend.settingsManagement.saveSettings(settings);
  }

  async settingsFileExists(): Promise<boolean> {
    const backend = await this.getBackend();
    return await backend.settingsManagement.settingsFileExists();
  }

  async initializeSettingsWithDefaults(): Promise<boolean> {
    const backend = await this.getBackend();
    return await backend.settingsManagement.initializeSettingsWithDefaults();
  }

  async getSettingsFilePath(): Promise<string> {
    const backend = await this.getBackend();
    return await backend.settingsManagement.getSettingsFilePath();
  }

  async updateSettingsPartially(partialSettings: Partial<Settings>): Promise<Settings | null> {
    const backend = await this.getBackend();
    return await backend.settingsManagement.updateSettingsPartially(partialSettings);
  }

  async addCustomDueDay(days: number): Promise<boolean> {
    const backend = await this.getBackend();
    return await backend.settingsManagement.addCustomDueDay(days);
  }
}

// シングルトンインスタンス
export const dataService = new DataService();
