import type { Task } from '$lib/types/task';
import type { ProjectTree } from '$lib/types/project';
import type { SubTask } from '$lib/types/sub-task';
import type { TaskListWithTasks } from '$lib/types/task-list';
import type { TaskList } from '$lib/types/task-list';
import type { Project } from '$lib/types/project';
import type { Tag } from '$lib/types/tag';
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
    const project = await backend.project.get(projectId);

    // Web環境では既存データが取得できないため、更新データのみでProjectオブジェクトを構築
    const updatedProject = project
      ? {
          ...project,
          ...updates,
          updated_at: new Date()
        }
      : ({
          id: projectId,
          ...updates,
          updated_at: new Date()
        } as Project);

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
    await backend.tasklist.create(newTaskList);
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
    const taskList = await backend.tasklist.get(taskListId);

    // Web環境では既存データが取得できないため、更新データのみでTaskListオブジェクトを構築
    const updatedTaskList = taskList
      ? {
          ...taskList,
          ...updates,
          updated_at: new Date()
        }
      : ({
          id: taskListId,
          ...updates,
          updated_at: new Date()
        } as TaskList);

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
    console.log('DataService: updateTask called with backend:', backend.constructor.name);
    const task = await backend.task.get(taskId);

    // Web環境では既存データが取得できないため、更新データのみでTaskオブジェクトを構築
    const updatedTask = task
      ? {
          ...task,
          ...updates,
          updated_at: new Date()
        }
      : ({
          id: taskId,
          ...updates,
          updated_at: new Date()
        } as Task);

    console.log('DataService: calling backend.task.update');
    const success = await backend.task.update(updatedTask);
    console.log('DataService: backend.task.update result:', success);
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
    console.log('DataService: updateSubTask called with backend:', backend.constructor.name);
    const subTask = await backend.subtask.get(subTaskId);

    // Web環境では既存データが取得できないため、更新データのみでSubTaskオブジェクトを構築
    const updatedSubTask = subTask
      ? {
          ...subTask,
          ...updates,
          updated_at: new Date()
        }
      : ({
          id: subTaskId,
          ...updates,
          updated_at: new Date()
        } as SubTask);

    console.log('DataService: calling backend.subtask.update');
    const success = await backend.subtask.update(updatedSubTask);
    console.log('DataService: backend.subtask.update result:', success);
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
    console.log('DataService: updateTag called with backend:', backend.constructor.name);
    const tag = await backend.tag.get(tagId);

    // Web環境では既存データが取得できないため、更新データのみでTagオブジェクトを構築
    const updatedTag = tag
      ? {
          ...tag,
          ...updates,
          updated_at: new Date()
        }
      : ({
          id: tagId,
          ...updates,
          updated_at: new Date()
        } as Tag);

    console.log('DataService: calling backend.tag.update');
    const success = await backend.tag.update(updatedTag);
    console.log('DataService: backend.tag.update result:', success);
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

  async addTagToSubTask(subTaskId: string, tagId: string): Promise<void> {
    const backend = await this.getBackend();
    console.log('DataService: addTagToSubTask called', { subTaskId, tagId });

    // 既存のサブタスクを取得
    const subTask = await backend.subtask.get(subTaskId);

    // タグオブジェクトを取得
    const tag = await backend.tag.get(tagId);

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
    const subTask = await backend.subtask.get(subTaskId);

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
