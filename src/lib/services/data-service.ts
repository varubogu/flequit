import type {
  ProjectTree,
  Task,
  SubTask,
  Project,
  TaskList,
  TaskListWithTasks,
  Tag
} from '$lib/types/task';
import { getBackendService } from '$lib/services/backend/index';
import type { BackendService } from '$lib/services/backend/index';

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

  // プロジェクトデータの読み込み
  async loadProjectData(): Promise<ProjectTree[]> {
    // TODO: バックエンドサービスにloadProjectDataメソッドを実装後、適切に呼び出す
    // 現在は空配列を返す
    return [];
  }

  // 自動保存
  async autoSave(): Promise<void> {
    // TODO: バックエンドサービスにautoSaveメソッドを実装後、適切に呼び出す
  }

  // プロジェクト管理
  async createProject(projectData: {
    name: string;
    description?: string;
    color?: string;
  }): Promise<Project> {
    const backend = await this.getBackend();
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: projectData.name,
      description: projectData.description,
      color: projectData.color,
      order_index: 0,
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
    }
  ): Promise<Project | null> {
    const backend = await this.getBackend();
    const project = await backend.project.get(projectId);
    if (!project) return null;

    const updatedProject = {
      ...project,
      ...updates,
      updated_at: new Date()
    };

    const success = await backend.project.update(updatedProject);
    return success ? updatedProject : null;
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
    }
  ): Promise<TaskList> {
    const backend = await this.getBackend();
    const newTaskList: TaskList = {
      id: crypto.randomUUID(),
      project_id: projectId,
      name: taskListData.name,
      description: taskListData.description,
      color: taskListData.color,
      order_index: 0,
      is_archived: false,
      created_at: new Date(),
      updated_at: new Date()
    };
    await backend.tasklist.create(newTaskList);
    return newTaskList;
  }

  async updateTaskList(
    taskListId: string,
    updates: {
      name?: string;
      description?: string;
      color?: string;
    }
  ): Promise<TaskList | null> {
    const backend = await this.getBackend();
    const taskList = await backend.tasklist.get(taskListId);
    if (!taskList) return null;

    const updatedTaskList = {
      ...taskList,
      ...updates,
      updated_at: new Date()
    };

    const success = await backend.tasklist.update(updatedTaskList);
    return success ? updatedTaskList : null;
  }

  async deleteTaskList(taskListId: string): Promise<boolean> {
    const backend = await this.getBackend();
    return await backend.tasklist.delete(taskListId);
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
    await backend.task.create(newTask);
    return newTask;
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task | null> {
    const backend = await this.getBackend();
    const task = await backend.task.get(taskId);
    if (!task) return null;

    const updatedTask = {
      ...task,
      ...updates,
      updated_at: new Date()
    };

    const success = await backend.task.update(updatedTask);
    return success ? updatedTask : null;
  }

  async deleteTask(taskId: string): Promise<boolean> {
    const backend = await this.getBackend();
    return await backend.task.delete(taskId);
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
      tags: [],
      created_at: new Date(),
      updated_at: new Date()
    };
    await backend.subtask.create(newSubTask);
    return newSubTask;
  }

  async updateSubTask(subTaskId: string, updates: Partial<SubTask>): Promise<SubTask | null> {
    const backend = await this.getBackend();
    const subTask = await backend.subtask.get(subTaskId);
    if (!subTask) return null;

    const updatedSubTask = {
      ...subTask,
      ...updates,
      updated_at: new Date()
    };

    const success = await backend.subtask.update(updatedSubTask);
    return success ? updatedSubTask : null;
  }

  async deleteSubTask(subTaskId: string): Promise<boolean> {
    const backend = await this.getBackend();
    return await backend.subtask.delete(subTaskId);
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
    await backend.tag.create(newTag);
    return newTag;
  }

  async updateTag(tagId: string, updates: Partial<Tag>): Promise<Tag | null> {
    const backend = await this.getBackend();
    const tag = await backend.tag.get(tagId);
    if (!tag) return null;

    const updatedTag = {
      ...tag,
      ...updates,
      updated_at: new Date()
    };

    const success = await backend.tag.update(updatedTag);
    return success ? updatedTag : null;
  }

  async deleteTag(tagId: string): Promise<boolean> {
    const backend = await this.getBackend();
    return await backend.tag.delete(tagId);
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async addTagToSubTask(_subTaskId: string, _tagId: string): Promise<void> {
    // TODO: バックエンドサービスにaddTagToSubTaskメソッドを実装後、適切に呼び出す
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async removeTagFromSubTask(_subTaskId: string, _tagId: string): Promise<void> {
    // TODO: バックエンドサービスにremoveTagFromSubTaskメソッドを実装後、適切に呼び出す
  }

  // TaskStore向けの型変換メソッド
  async createProjectTree(projectData: {
    name: string;
    description?: string;
    color?: string;
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
