import type { Task, TaskWithSubTasks } from '$lib/types/task';
import type { ProjectTree } from '$lib/types/project';
import type { SubTask, SubTaskWithTags } from '$lib/types/sub-task';
import type { TaskList, TaskListWithTasks } from '$lib/types/task-list';
import type { Project } from '$lib/types/project';
import type { Tag } from '$lib/types/tag';
import type { RecurrenceRule } from '$lib/types/recurrence';
import type { TaskRecurrence, SubtaskRecurrence } from '$lib/types/recurrence-reference';
import type { Settings } from '$lib/types/settings';
import type { BackendService } from '$lib/infrastructure/backends/index';
import { resolveBackend } from '$lib/infrastructure/backend-client';
import type { BackendErrorContext } from '$lib/infrastructure/backend-error';
import { toBackendError } from '$lib/infrastructure/backend-error';

/**
 * データ管理の中間サービス層
 * UI層とバックエンド層の間の橋渡しを行う
 */
export class DataService {
  private async getBackend(): Promise<BackendService> {
    return resolveBackend();
  }

  private async executeWithBackend<T>(
    context: BackendErrorContext,
    action: (backend: BackendService) => Promise<T>
  ): Promise<T> {
    try {
      const backend = await this.getBackend();
      return await action(backend);
    } catch (error) {
      throw toBackendError(error, context);
    }
  }

  /**
   * タグIDリストをタグオブジェクトリストに変換します
   */
  private convertTagIdsToTags(tagIds: string[] | undefined, allTags: Tag[]): Tag[] {
    const safeIds = tagIds ?? [];
    const tagMap = new Map(allTags.map(tag => [tag.id, tag]));
    return safeIds.map(tagId => tagMap.get(tagId)).filter((tag): tag is Tag => tag !== undefined);
  }

  /**
   * タスクのtagIdsをtagsに変換してTaskWithSubTasksに変換します
   */
  private convertTaskToTaskWithSubTasks(task: Task, allTags: Tag[], subTasks: SubTask[]): TaskWithSubTasks {
    const tags = this.convertTagIdsToTags(task.tagIds, allTags);
    const subTasksWithTags: SubTaskWithTags[] = subTasks.map(subTask => ({
      ...subTask,
      tags: this.convertTagIdsToTags(subTask.tagIds, allTags)
    }));

    return {
      ...task,
      tags,
      subTasks: subTasksWithTags
    };
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

  async updateTask(
    projectId: string,
    taskId: string,
    updates: Partial<Task>
  ): Promise<Task | null> {
    const patchData = {
      ...updates,
      plan_start_date: updates.planStartDate?.toISOString() ?? undefined,
      plan_end_date: updates.planEndDate?.toISOString() ?? undefined,
      do_start_date: updates.doStartDate?.toISOString() ?? undefined,
      do_end_date: updates.doEndDate?.toISOString() ?? undefined
    } as Record<string, unknown>;

    if (updates.recurrenceRule !== undefined) {
      patchData.recurrence_rule = updates.recurrenceRule;
    }

    return this.executeWithBackend(
      { operation: 'タスク更新', resourceType: 'task', resourceId: taskId },
      async (backend) => {
        const success = await backend.task.update(projectId, taskId, patchData);
        if (!success) {
          return null;
        }
        return backend.task.get(projectId, taskId);
      }
    );
  }

  async deleteTask(projectId: string, taskId: string): Promise<boolean> {
    return this.executeWithBackend(
      { operation: 'タスク削除', resourceType: 'task', resourceId: taskId },
      async (backend) => backend.task.delete(projectId, taskId)
    );
  }

  // サブタスク管理
  async createSubTask(
    projectId: string,
    taskId: string,
    subTaskData: {
      title: string;
      description?: string;
      status?: string;
      priority?: number;
    }
  ): Promise<SubTask> {
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
      tagIds: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await this.executeWithBackend(
      { operation: 'サブタスク作成', resourceType: 'subtask', resourceId: newSubTask.id },
      async (backend) => {
        await backend.subtask.create(projectId, newSubTask);
      }
    );
    return newSubTask;
  }

  async updateSubTask(
    projectId: string,
    subTaskId: string,
    updates: Partial<SubTask>
  ): Promise<SubTask | null> {
    const patchData = {
      ...updates,
      plan_start_date: updates.planStartDate?.toISOString() ?? undefined,
      plan_end_date: updates.planEndDate?.toISOString() ?? undefined,
      do_start_date: updates.doStartDate?.toISOString() ?? undefined,
      do_end_date: updates.doEndDate?.toISOString() ?? undefined,
      updated_at: new Date()
    } as Record<string, unknown>;

    if (updates.recurrenceRule !== undefined) {
      patchData.recurrence_rule = updates.recurrenceRule;
    }

    return this.executeWithBackend(
      { operation: 'サブタスク更新', resourceType: 'subtask', resourceId: subTaskId },
      async (backend) => {
        const success = await backend.subtask.update(projectId, subTaskId, patchData);
        if (!success) {
          return null;
        }
        return backend.subtask.get(projectId, subTaskId);
      }
    );
  }

  async deleteSubTask(projectId: string, subTaskId: string): Promise<boolean> {
    return this.executeWithBackend(
      { operation: 'サブタスク削除', resourceType: 'subtask', resourceId: subTaskId },
      async (backend) => backend.subtask.delete(projectId, subTaskId)
    );
  }

  // タグ管理
  async createTag(projectId: string, tagData: { name: string; color?: string; order_index?: number }): Promise<Tag> {
    const backend = await this.getBackend();
    const newTag: Tag = {
      id: crypto.randomUUID(),
      name: tagData.name,
      color: tagData.color,
      orderIndex: tagData.order_index || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await backend.tag.create(projectId, newTag);
    return newTag;
  }

  async updateTag(projectId: string, tagId: string, updates: Partial<Tag>): Promise<Tag | null> {
    const backend = await this.getBackend();
    console.log('DataService: updateTag called with backends:', backend.constructor.name);

    // Patch形式でのupdateに変更
    const patchData = {
      ...updates,
      updated_at: new Date()
    };

    console.log('DataService: calling backends.tag.update');
    const success = await backend.tag.update(projectId, tagId, patchData);
    console.log('DataService: backends.tag.update result:', success);

    if (success) {
      // 更新後のデータを取得して返す
      return await backend.tag.get(projectId, tagId);
    }
    return null;
  }

  async deleteTag(projectId: string, tagId: string): Promise<boolean> {
    const backend = await this.getBackend();
    return await backend.tag.delete(projectId, tagId);
  }

  // 複合操作（TaskStoreで使用されているメソッド）
  async createTaskWithSubTasks(listId: string, task: Task): Promise<void> {
    await this.createTask(listId, task);
  }

  async updateTaskWithSubTasks(
    projectId: string,
    taskId: string,
    updates: Record<string, unknown>
  ): Promise<void> {
    await this.updateTask(projectId, taskId, updates as Partial<Task>);
  }

  async deleteTaskWithSubTasks(projectId: string, taskId: string): Promise<boolean> {
    return this.deleteTask(projectId, taskId);
  }

  async addTagToSubTask(projectId: string, subTaskId: string, tagId: string): Promise<void> {
    await this.executeWithBackend(
      { operation: 'サブタスクタグ追加', resourceType: 'subtask', resourceId: subTaskId },
      async (backend) => {
        const subTask = await backend.subtask.get(projectId, subTaskId);
        const tag = await backend.tag.get(projectId, tagId);

        if (!subTask || !tag) {
          console.warn('addTagToSubTask is deprecated and requires existing entities.');
          return;
        }

        console.warn('addTagToSubTask is deprecated, use tasks.svelte.ts addTagToSubTask instead');
      }
    );
  }

  async removeTagFromSubTask(projectId: string, subTaskId: string, tagId: string): Promise<void> {
    await this.executeWithBackend(
      { operation: 'サブタスクタグ削除', resourceType: 'subtask', resourceId: subTaskId },
      async (backend) => {
        const subTask = await backend.subtask.get(projectId, subTaskId);
        if (!subTask) {
          console.warn('removeTagFromSubTask is deprecated and subtask not found.');
          return;
        }
        console.warn('removeTagFromSubTask is deprecated, use tasks.svelte.ts removeTagFromSubTask instead');
      }
    );
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
      taskLists: [],
      allTags: []  // 空のタグ配列を追加
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
  async createRecurrenceRule(projectId: string, rule: RecurrenceRule): Promise<boolean> {
    const backend = await this.getBackend();
    return await backend.recurrenceRule.create(projectId, rule);
  }

  async getRecurrenceRule(projectId: string, ruleId: string): Promise<RecurrenceRule | null> {
    const backend = await this.getBackend();
    return await backend.recurrenceRule.get(projectId, ruleId);
  }

  async getAllRecurrenceRules(projectId: string): Promise<RecurrenceRule[]> {
    const backend = await this.getBackend();
    return await backend.recurrenceRule.getAll(projectId);
  }

  async updateRecurrenceRule(projectId: string, rule: RecurrenceRule): Promise<boolean> {
    const backend = await this.getBackend();
    return await backend.recurrenceRule.update(projectId, rule);
  }

  async deleteRecurrenceRule(projectId: string, ruleId: string): Promise<boolean> {
    const backend = await this.getBackend();
    return await backend.recurrenceRule.delete(projectId, ruleId);
  }

  // タスク繰り返し管理
  async createTaskRecurrence(projectId: string, taskRecurrence: TaskRecurrence): Promise<boolean> {
    const backend = await this.getBackend();
    return await backend.taskRecurrence.create(projectId, taskRecurrence);
  }

  async getTaskRecurrenceByTaskId(projectId: string, taskId: string): Promise<TaskRecurrence | null> {
    const backend = await this.getBackend();
    return await backend.taskRecurrence.getByTaskId(projectId, taskId);
  }

  async deleteTaskRecurrence(projectId: string, taskId: string): Promise<boolean> {
    const backend = await this.getBackend();
    return await backend.taskRecurrence.delete(projectId, taskId);
  }

  // サブタスク繰り返し管理
  async createSubtaskRecurrence(projectId: string, subtaskRecurrence: SubtaskRecurrence): Promise<boolean> {
    const backend = await this.getBackend();
    return await backend.subtaskRecurrence.create(projectId, subtaskRecurrence);
  }

  async getSubtaskRecurrenceBySubtaskId(projectId: string, subtaskId: string): Promise<SubtaskRecurrence | null> {
    const backend = await this.getBackend();
    return await backend.subtaskRecurrence.getBySubtaskId(projectId, subtaskId);
  }

  async deleteSubtaskRecurrence(projectId: string, subtaskId: string): Promise<boolean> {
    const backend = await this.getBackend();
    return await backend.subtaskRecurrence.delete(projectId, subtaskId);
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
