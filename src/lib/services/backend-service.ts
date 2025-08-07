import { invoke } from '@tauri-apps/api/core';
import type {
  TaskStatus,
  ProjectTree,
  TaskListWithTasks,
  TaskWithSubTasks,
  SubTask,
  Tag,
  Task
} from '$lib/types/task';
// taskStore は遅延読み込みで使用

export interface PathConfig {
  data_dir?: string;
  backup_dir?: string;
  export_dir?: string;
  use_system_default: boolean;
}

export interface BackendService {
  greet: () => Promise<void>;
  createTask: (title: string, description: string) => Promise<Task>;
  getTask: (taskId: string) => Promise<Task | null>;
  getAllTasks: () => Promise<Task[]>;
  updateTask: (
    taskId: string,
    title?: string,
    description?: string,
    completed?: boolean
  ) => Promise<Task | null>;
  deleteTask: (taskId: string) => Promise<boolean>;
  getDocumentState: () => Promise<Uint8Array>;
  loadDocumentState: (data: Uint8Array) => Promise<void>;
  mergeDocument: (data: Uint8Array) => Promise<void>;
  saveDataToFile: (filePath: string) => Promise<void>;
  loadDataFromFile: (filePath: string) => Promise<void>;
  initializeSampleData: () => Promise<void>;
  getProjectTrees: () => Promise<ProjectTree[]>;
  loadProjectData: () => Promise<ProjectTree[]>;
  saveUserData: () => Promise<void>;

  // 拡張API
  createProject: (project: {
    name: string;
    description?: string;
    color?: string;
  }) => Promise<ProjectTree>;
  updateProject: (
    projectId: string,
    updates: { name?: string; description?: string; color?: string }
  ) => Promise<ProjectTree | null>;
  deleteProject: (projectId: string) => Promise<boolean>;

  createTaskList: (
    projectId: string,
    taskList: { name: string; description?: string; color?: string }
  ) => Promise<TaskListWithTasks>;
  updateTaskList: (
    taskListId: string,
    updates: { name?: string; description?: string; color?: string }
  ) => Promise<TaskListWithTasks | null>;
  deleteTaskList: (taskListId: string) => Promise<boolean>;

  createTaskWithSubTasks: (
    listId: string,
    task: Partial<TaskWithSubTasks>
  ) => Promise<TaskWithSubTasks>;
  updateTaskWithSubTasks: (
    taskId: string,
    updates: Partial<TaskWithSubTasks>
  ) => Promise<TaskWithSubTasks | null>;
  deleteTaskWithSubTasks: (taskId: string) => Promise<boolean>;

  // サブタスク管理
  createSubTask: (
    taskId: string,
    subTask: {
      title: string;
      description?: string;
      status?: string;
      priority?: number;
    }
  ) => Promise<SubTask>;
  updateSubTask: (
    subTaskId: string,
    updates: {
      title?: string;
      description?: string;
      status?: string;
      priority?: number;
    }
  ) => Promise<SubTask | null>;
  deleteSubTask: (subTaskId: string) => Promise<boolean>;

  // タグ管理
  createTag: (tag: { name: string; color?: string }) => Promise<Tag>;
  updateTag: (tagId: string, updates: { name?: string; color?: string }) => Promise<Tag | null>;
  deleteTag: (tagId: string) => Promise<boolean>;
  getAllTags: () => Promise<Tag[]>;
  addTagToTask: (taskId: string, tagId: string) => Promise<boolean>;
  removeTagFromTask: (taskId: string, tagId: string) => Promise<boolean>;
  addTagToSubTask: (subTaskId: string, tagId: string) => Promise<boolean>;
  removeTagFromSubTask: (subTaskId: string, tagId: string) => Promise<boolean>;

  autoSave: () => Promise<void>;

  // 一括操作API
  bulkUpdateTasks: (
    updates: Array<{ taskId: string; updates: Partial<TaskWithSubTasks> }>
  ) => Promise<TaskWithSubTasks[]>;
  bulkDeleteTasks: (taskIds: string[]) => Promise<boolean>;
  bulkMoveTasksToList: (taskIds: string[], targetListId: string) => Promise<boolean>;

  // 自動保存制御
  enableAutoSave: () => Promise<void>;
  disableAutoSave: () => Promise<void>;
  getAutoSaveStatus: () => Promise<boolean>;

  // 拡張ファイル操作
  exportData: (filePath?: string, format?: 'json' | 'automerge') => Promise<void>;
  importData: (filePath: string, format?: 'json' | 'automerge') => Promise<void>;
  createBackup: (backupPath?: string) => Promise<string>;
  restoreFromBackup: (backupPath: string) => Promise<void>;
  listBackups: () => Promise<string[]>;

  // パス管理
  getCurrentDataDir: () => Promise<string>;
  getCurrentBackupDir: () => Promise<string>;
  getCurrentExportDir: () => Promise<string>;
  getSystemDefaultDataDir: () => Promise<string>;
  getPathConfig: () => Promise<PathConfig>;
  updatePathConfig: (config: PathConfig) => Promise<void>;
  setCustomDataDir: (path: string) => Promise<void>;
  resetToSystemDefault: () => Promise<void>;
  validatePath: (path: string) => Promise<boolean>;
  ensureDirectories: () => Promise<void>;
}

// 型変換ヘルパー関数（timestamp -> Date）
function convertTimestampToDate(timestamp: number): Date {
  return new Date(timestamp);
}

// TauriからのProjectTreeデータをフロントエンド型に変換
function convertProjectTree(project: unknown): ProjectTree {
  const proj = project as Record<string, unknown>;
  return {
    ...proj,
    created_at: convertTimestampToDate(proj.created_at as number),
    updated_at: convertTimestampToDate(proj.updated_at as number),
    task_lists: (proj.task_lists as unknown[]).map(convertTaskList)
  } as ProjectTree;
}

function convertTaskList(list: unknown): TaskListWithTasks {
  const taskList = list as Record<string, unknown>;
  return {
    ...taskList,
    created_at: convertTimestampToDate(taskList.created_at as number),
    updated_at: convertTimestampToDate(taskList.updated_at as number),
    tasks: (taskList.tasks as unknown[]).map(convertTask)
  } as TaskListWithTasks;
}

function convertTask(task: unknown): TaskWithSubTasks {
  const taskData = task as Record<string, unknown>;
  return {
    ...taskData,
    status: taskData.status as TaskStatus,
    start_date: taskData.start_date
      ? convertTimestampToDate(taskData.start_date as number)
      : undefined,
    end_date: taskData.end_date ? convertTimestampToDate(taskData.end_date as number) : undefined,
    created_at: convertTimestampToDate(taskData.created_at as number),
    updated_at: convertTimestampToDate(taskData.updated_at as number),
    sub_tasks: (taskData.sub_tasks as unknown[]).map(convertSubTask),
    tags: (taskData.tags as unknown[]).map(convertTag)
  } as TaskWithSubTasks;
}

function convertSubTask(subtask: unknown): SubTask {
  const subTaskData = subtask as Record<string, unknown>;
  return {
    ...subTaskData,
    status: subTaskData.status as TaskStatus,
    start_date: subTaskData.start_date
      ? convertTimestampToDate(subTaskData.start_date as number)
      : undefined,
    end_date: subTaskData.end_date
      ? convertTimestampToDate(subTaskData.end_date as number)
      : undefined,
    created_at: convertTimestampToDate(subTaskData.created_at as number),
    updated_at: convertTimestampToDate(subTaskData.updated_at as number),
    tags: (subTaskData.tags as unknown[]).map(convertTag)
  } as SubTask;
}

function convertTag(tag: unknown): Tag {
  const tagData = tag as Record<string, unknown>;
  return {
    ...tagData,
    created_at: convertTimestampToDate(tagData.created_at as number),
    updated_at: convertTimestampToDate(tagData.updated_at as number)
  } as Tag;
}

// isTauriEnvironment関数は未使用のためコメントアウト
// async function isTauriEnvironment(): Promise<boolean> {
//   return typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__;
// }

export const backendService = (): BackendService => {
  // TODO: より良い方法があれば改善
  // @ts-expect-error - Tauri環境でのみ利用可能
  if (window.__TAURI_INTERNALS__) {
    return {
      greet: async () => {
        const message = await invoke('greet', { name: 'World' });
        console.log(`tauri.greet ${message}`);
      },
      createTask: async (title: string, description: string) => {
        return await invoke('create_task', { title, description });
      },
      getTask: async (taskId: string) => {
        return await invoke('get_task', { taskId });
      },
      getAllTasks: async () => {
        return await invoke('get_all_tasks');
      },
      updateTask: async (
        taskId: string,
        title?: string,
        description?: string,
        completed?: boolean
      ) => {
        return await invoke('update_task', { taskId, title, description, completed });
      },
      deleteTask: async (taskId: string) => {
        return await invoke('delete_task', { taskId });
      },
      getDocumentState: async () => {
        return await invoke('get_document_state');
      },
      loadDocumentState: async (data: Uint8Array) => {
        return await invoke('load_document_state', { data: Array.from(data) });
      },
      mergeDocument: async (data: Uint8Array) => {
        return await invoke('merge_document', { data: Array.from(data) });
      },
      saveDataToFile: async (filePath: string) => {
        return await invoke('save_data_to_file', { filePath });
      },
      loadDataFromFile: async (filePath: string) => {
        return await invoke('load_data_from_file', { filePath });
      },
      initializeSampleData: async () => {
        return await invoke('initialize_sample_data');
      },
      getProjectTrees: async () => {
        const projects = (await invoke('get_project_trees')) as unknown[];
        return projects.map(convertProjectTree);
      },
      loadProjectData: async () => {
        // Tauri版：ファイルから読み込み、なければサンプルデータを初期化
        try {
          await invoke('load_data_from_file', { filePath: './data/tasks.automerge' });
          const rawProjects = (await invoke('get_project_trees')) as unknown[];
          return rawProjects.map(convertProjectTree);
        } catch (error) {
          // ファイルが存在しない場合はサンプルデータを初期化
          console.log('Creating sample data for Tauri:', error);
          await invoke('initialize_sample_data');
          await invoke('save_data_to_file', { filePath: './data/tasks.automerge' });
          const rawProjects = (await invoke('get_project_trees')) as unknown[];
          return rawProjects.map(convertProjectTree);
        }
      },
      saveUserData: async () => {
        const { taskStore } = await import('$lib/stores/tasks.svelte');
        console.log('Saving user data...', taskStore.projects);
      },

      // 拡張API実装
      createProject: async (project: { name: string; description?: string; color?: string }) => {
        const result = await invoke('create_project', {
          name: project.name,
          description: project.description,
          color: project.color
        });
        return convertProjectTree(result);
      },

      updateProject: async (
        projectId: string,
        updates: { name?: string; description?: string; color?: string }
      ) => {
        const result = await invoke('update_project', {
          projectId,
          name: updates.name,
          description: updates.description,
          color: updates.color
        });
        return result ? convertProjectTree(result) : null;
      },

      deleteProject: async (projectId: string) => {
        return await invoke('delete_project', { projectId });
      },

      createTaskList: async (
        projectId: string,
        taskList: { name: string; description?: string; color?: string }
      ) => {
        const result = await invoke('create_task_list', {
          projectId,
          name: taskList.name,
          description: taskList.description,
          color: taskList.color
        });
        return convertTaskList(result);
      },

      updateTaskList: async (
        taskListId: string,
        updates: { name?: string; description?: string; color?: string }
      ) => {
        const result = await invoke('update_task_list', {
          taskListId,
          name: updates.name,
          description: updates.description,
          color: updates.color
        });
        return result ? convertTaskList(result) : null;
      },

      deleteTaskList: async (taskListId: string) => {
        return await invoke('delete_task_list', { taskListId });
      },

      createTaskWithSubTasks: async (listId: string, task: Partial<TaskWithSubTasks>) => {
        const result = await invoke('create_task_with_subtasks', {
          listId,
          title: task.title || '',
          description: task.description,
          status: task.status,
          priority: task.priority,
          startDate: task.start_date?.getTime(),
          endDate: task.end_date?.getTime()
        });
        return convertTask(result);
      },

      updateTaskWithSubTasks: async (taskId: string, updates: Partial<TaskWithSubTasks>) => {
        const result = await invoke('update_task_with_subtasks', {
          taskId,
          title: updates.title,
          description: updates.description,
          status: updates.status,
          priority: updates.priority,
          startDate: updates.start_date?.getTime(),
          endDate: updates.end_date?.getTime()
        });
        return result ? convertTask(result) : null;
      },

      deleteTaskWithSubTasks: async (taskId: string) => {
        return await invoke('delete_task_with_subtasks', { taskId });
      },

      // サブタスク管理
      createSubTask: async (
        taskId: string,
        subTask: { title: string; description?: string; status?: string; priority?: number }
      ) => {
        const result = await invoke('create_subtask', {
          taskId,
          title: subTask.title,
          description: subTask.description,
          status: subTask.status,
          priority: subTask.priority
        });
        return convertSubTask(result);
      },

      updateSubTask: async (
        subTaskId: string,
        updates: { title?: string; description?: string; status?: string; priority?: number }
      ) => {
        const result = await invoke('update_subtask', {
          subtaskId: subTaskId,
          title: updates.title,
          description: updates.description,
          status: updates.status,
          priority: updates.priority
        });
        return result ? convertSubTask(result) : null;
      },

      deleteSubTask: async (subTaskId: string) => {
        return await invoke('delete_subtask', { subtaskId: subTaskId });
      },

      // タグ管理
      createTag: async (tag: { name: string; color?: string }) => {
        const result = await invoke('create_tag', {
          name: tag.name,
          color: tag.color
        });
        return convertTag(result);
      },

      updateTag: async (tagId: string, updates: { name?: string; color?: string }) => {
        const result = await invoke('update_tag', {
          tagId,
          name: updates.name,
          color: updates.color
        });
        return result ? convertTag(result) : null;
      },

      deleteTag: async (tagId: string) => {
        return await invoke('delete_tag', { tagId });
      },

      getAllTags: async () => {
        const result = await invoke('get_all_tags');
        return (result as unknown[]).map(convertTag);
      },

      addTagToTask: async (taskId: string, tagId: string) => {
        return await invoke('add_tag_to_task', { taskId, tagId });
      },

      removeTagFromTask: async (taskId: string, tagId: string) => {
        return await invoke('remove_tag_from_task', { taskId, tagId });
      },

      addTagToSubTask: async (subTaskId: string, tagId: string) => {
        return await invoke('add_tag_to_subtask', { subtaskId: subTaskId, tagId });
      },

      removeTagFromSubTask: async (subTaskId: string, tagId: string) => {
        return await invoke('remove_tag_from_subtask', { subtaskId: subTaskId, tagId });
      },

      autoSave: async () => {
        return await invoke('auto_save');
      },

      // 一括操作API (Tauri版)
      bulkUpdateTasks: async (updates) => {
        const results = [];
        const errors: Array<{ taskId: string; error: Error }> = [];

        for (const { taskId, updates: taskUpdates } of updates) {
          try {
            const result = await invoke('update_task_with_subtasks', {
              taskId,
              title: taskUpdates.title,
              description: taskUpdates.description,
              status: taskUpdates.status,
              priority: taskUpdates.priority,
              startDate: taskUpdates.start_date?.getTime(),
              endDate: taskUpdates.end_date?.getTime()
            });
            if (result) {
              results.push(convertTask(result));
            }
          } catch (error) {
            console.error(`Failed to update task ${taskId}:`, error);
            errors.push({
              taskId,
              error: error instanceof Error ? error : new Error(String(error))
            });
          }
        }

        // エラーがある場合は統合エラーとして報告
        if (errors.length > 0) {
          const { errorHandler } = await import('$lib/stores/error-handler.svelte');
          errorHandler.addSyncError(
            '一括タスク更新',
            'bulk_operation',
            `${errors.length}/${updates.length} failed`,
            new Error(`Failed to update ${errors.length} tasks`)
          );
        }

        return results;
      },

      bulkDeleteTasks: async (taskIds) => {
        let allSucceeded = true;
        const errors: Array<{ taskId: string; error: Error }> = [];

        for (const taskId of taskIds) {
          try {
            const success = await invoke('delete_task_with_subtasks', { taskId });
            if (!success) {
              allSucceeded = false;
              errors.push({ taskId, error: new Error('Delete operation returned false') });
            }
          } catch (error) {
            console.error(`Failed to delete task ${taskId}:`, error);
            allSucceeded = false;
            errors.push({
              taskId,
              error: error instanceof Error ? error : new Error(String(error))
            });
          }
        }

        // エラーがある場合は統合エラーとして報告
        if (errors.length > 0) {
          const { errorHandler } = await import('$lib/stores/error-handler.svelte');
          errorHandler.addSyncError(
            '一括タスク削除',
            'bulk_operation',
            `${errors.length}/${taskIds.length} failed`,
            new Error(`Failed to delete ${errors.length} tasks`)
          );
        }

        return allSucceeded;
      },

      bulkMoveTasksToList: async (taskIds, targetListId) => {
        // Tauri側でbulk_move_tasksコマンドを実装する必要がある
        try {
          return await invoke('bulk_move_tasks', { taskIds, targetListId });
        } catch (error) {
          console.error('Failed to bulk move tasks:', error);
          return false;
        }
      },

      // 自動保存制御 (Tauri版)
      enableAutoSave: async () => {
        // AutoSaveManagerを動的にインポート
        const { autoSaveManager } = await import('$lib/stores/auto-save.svelte');
        autoSaveManager.enable();
      },

      disableAutoSave: async () => {
        // AutoSaveManagerを動的にインポート
        const { autoSaveManager } = await import('$lib/stores/auto-save.svelte');
        autoSaveManager.disable();
      },

      getAutoSaveStatus: async () => {
        // AutoSaveManagerを動的にインポート
        const { autoSaveManager } = await import('$lib/stores/auto-save.svelte');
        return autoSaveManager.isEnabled;
      },

      // 拡張ファイル操作 (Tauri版)
      exportData: async (filePath, format = 'automerge') => {
        if (format === 'json') {
          return await invoke('export_data_json', { filePath });
        } else {
          return await invoke('save_data_to_file', { filePath });
        }
      },

      importData: async (filePath, format = 'automerge') => {
        if (format === 'json') {
          return await invoke('import_data_json', { filePath });
        } else {
          return await invoke('load_data_from_file', { filePath });
        }
      },

      createBackup: async (backupPath) => {
        if (backupPath) {
          // カスタムパスでバックアップ作成
          await invoke('save_data_to_file', { filePath: backupPath });
          return backupPath;
        } else {
          // デフォルトパスでバックアップ作成
          return await invoke('create_backup');
        }
      },

      restoreFromBackup: async (backupPath) => {
        return await invoke('restore_from_backup', { backupPath });
      },

      listBackups: async () => {
        return await invoke('list_backups');
      },

      // パス管理 (Tauri版)
      getCurrentDataDir: async () => {
        return await invoke('get_current_data_dir');
      },

      getCurrentBackupDir: async () => {
        return await invoke('get_current_backup_dir');
      },

      getCurrentExportDir: async () => {
        return await invoke('get_current_export_dir');
      },

      getSystemDefaultDataDir: async () => {
        return await invoke('get_system_default_data_dir');
      },

      getPathConfig: async () => {
        return await invoke('get_path_config');
      },

      updatePathConfig: async (config) => {
        return await invoke('update_path_config', { newConfig: config });
      },

      setCustomDataDir: async (path) => {
        return await invoke('set_custom_data_dir', { path });
      },

      resetToSystemDefault: async () => {
        return await invoke('reset_to_system_default');
      },

      validatePath: async (path) => {
        return await invoke('validate_path', { path });
      },

      ensureDirectories: async () => {
        return await invoke('ensure_directories');
      }
    };
  } else {
    return {
      greet: async () => {
        console.log('tauri not available');
      },
      createTask: async (title: string, description: string) => {
        console.log('createTask called in web mode', { title, description });
        throw new Error('Not implemented for web mode');
      },
      getTask: async (taskId: string) => {
        console.log('getTask called in web mode', { taskId });
        throw new Error('Not implemented for web mode');
      },
      getAllTasks: async () => {
        console.log('getAllTasks called in web mode');
        throw new Error('Not implemented for web mode');
      },
      updateTask: async (
        taskId: string,
        title?: string,
        description?: string,
        completed?: boolean
      ) => {
        console.log('updateTask called in web mode', { taskId, title, description, completed });
        throw new Error('Not implemented for web mode');
      },
      deleteTask: async (taskId: string) => {
        console.log('deleteTask called in web mode', { taskId });
        throw new Error('Not implemented for web mode');
      },
      getDocumentState: async () => {
        console.log('getDocumentState called in web mode');
        throw new Error('Not implemented for web mode');
      },
      loadDocumentState: async (data: Uint8Array) => {
        console.log('loadDocumentState called in web mode', { data });
        throw new Error('Not implemented for web mode');
      },
      mergeDocument: async (data: Uint8Array) => {
        console.log('mergeDocument called in web mode', { data });
        throw new Error('Not implemented for web mode');
      },
      saveDataToFile: async (filePath: string) => {
        console.log('saveDataToFile called in web mode', { filePath });
        throw new Error('Not implemented for web mode');
      },
      loadDataFromFile: async (filePath: string) => {
        console.log('loadDataFromFile called in web mode', { filePath });
        throw new Error('Not implemented for web mode');
      },
      initializeSampleData: async () => {
        console.log('initializeSampleData called in web mode');
        throw new Error('Not implemented for web mode');
      },
      getProjectTrees: async (): Promise<ProjectTree[]> => {
        console.log('getProjectTrees called in web mode');
        throw new Error('Not implemented for web mode');
      },
      loadProjectData: async (): Promise<ProjectTree[]> => {
        // Web版：sample-data.tsからサンプルデータを取得
        const { generateSampleData } = await import('$lib/data/sample-data');
        return generateSampleData();
      },
      saveUserData: async () => {
        const { taskStore } = await import('$lib/stores/tasks.svelte');
        console.log('Saving user data...', taskStore.projects);
      },

      // Web版用のスタブ実装（空の処理）
      createProject: async (project: { name: string; description?: string; color?: string }) => {
        console.log('Web backend: createProject not implemented', project);
        // ダミーのプロジェクトを返す
        return {
          id: crypto.randomUUID(),
          name: project.name,
          description: project.description || '',
          color: project.color || '#3b82f6',
          order_index: 0,
          is_archived: false,
          created_at: new Date(),
          updated_at: new Date(),
          task_lists: []
        };
      },

      updateProject: async (
        projectId: string,
        updates: { name?: string; description?: string; color?: string }
      ) => {
        console.log('Web backend: updateProject not implemented', { projectId, updates });
        // ダミーの更新されたプロジェクトを返す（テスト用）
        return {
          id: projectId,
          name: updates.name || 'Updated Project',
          description: updates.description || '',
          color: updates.color || '#3b82f6',
          order_index: 0,
          is_archived: false,
          created_at: new Date(),
          updated_at: new Date(),
          task_lists: []
        };
      },

      deleteProject: async (projectId: string) => {
        console.log('Web backend: deleteProject not implemented', { projectId });
        return true;
      },

      createTaskList: async (
        projectId: string,
        taskList: { name: string; description?: string; color?: string }
      ) => {
        console.log('Web backend: createTaskList not implemented', { projectId, taskList });
        // ダミーのタスクリストを返す
        return {
          id: crypto.randomUUID(),
          name: taskList.name,
          description: taskList.description || '',
          color: taskList.color,
          project_id: projectId,
          order_index: 0,
          is_archived: false,
          created_at: new Date(),
          updated_at: new Date(),
          tasks: []
        };
      },

      updateTaskList: async (
        taskListId: string,
        updates: { name?: string; description?: string; color?: string }
      ) => {
        console.log('Web backend: updateTaskList not implemented', { taskListId, updates });
        // ダミーの更新されたタスクリストを返す（テスト用）
        return {
          id: taskListId,
          name: updates.name || 'Updated TaskList',
          description: updates.description || '',
          color: updates.color,
          project_id: 'dummy-project-id',
          order_index: 0,
          is_archived: false,
          created_at: new Date(),
          updated_at: new Date(),
          tasks: []
        };
      },

      deleteTaskList: async (taskListId: string) => {
        console.log('Web backend: deleteTaskList not implemented', { taskListId });
        return true;
      },

      createTaskWithSubTasks: async (listId: string, task: Partial<TaskWithSubTasks>) => {
        console.log('Web backend: createTaskWithSubTasks not implemented', { listId, task });
        // ダミーのタスクを返す
        return {
          id: crypto.randomUUID(),
          title: task.title || '',
          description: task.description,
          status: task.status || 'not_started',
          priority: task.priority || 0,
          list_id: listId,
          order_index: 0,
          is_archived: false,
          created_at: new Date(),
          updated_at: new Date(),
          sub_tasks: [],
          tags: []
        };
      },

      updateTaskWithSubTasks: async (taskId: string, updates: Partial<TaskWithSubTasks>) => {
        console.log('Web backend: updateTaskWithSubTasks not implemented', { taskId, updates });
        return null;
      },

      deleteTaskWithSubTasks: async (taskId: string) => {
        console.log('Web backend: deleteTaskWithSubTasks not implemented', { taskId });
        return true;
      },

      // サブタスク管理（Web版スタブ実装）
      createSubTask: async (
        taskId: string,
        subTask: { title: string; description?: string; status?: string; priority?: number }
      ) => {
        console.log('Web backend: createSubTask not implemented', { taskId, subTask });
        // ダミーのサブタスクを返す（テスト用）
        return {
          id: crypto.randomUUID(),
          task_id: taskId,
          title: subTask.title,
          description: subTask.description,
          status: (subTask.status as TaskStatus) || 'not_started',
          priority: subTask.priority,
          start_date: undefined,
          end_date: undefined,
          order_index: 0,
          is_archived: false,
          tags: [],
          created_at: new Date(),
          updated_at: new Date()
        };
      },

      updateSubTask: async (
        subTaskId: string,
        updates: { title?: string; description?: string; status?: string; priority?: number }
      ) => {
        console.log('Web backend: updateSubTask not implemented', { subTaskId, updates });
        // ダミーの更新されたサブタスクを返す（テスト用）
        return {
          id: subTaskId,
          task_id: 'dummy-task-id',
          title: updates.title || 'Updated SubTask',
          description: updates.description,
          status: (updates.status as TaskStatus) || 'not_started',
          priority: updates.priority,
          start_date: undefined,
          end_date: undefined,
          order_index: 0,
          is_archived: false,
          tags: [],
          created_at: new Date(),
          updated_at: new Date()
        };
      },

      deleteSubTask: async (subTaskId: string) => {
        console.log('Web backend: deleteSubTask not implemented', { subTaskId });
        return true;
      },

      // タグ管理（Web版スタブ実装）
      createTag: async (tag: { name: string; color?: string }) => {
        console.log('Web backend: createTag not implemented', tag);
        // ダミーのタグを返す（テスト用）
        return {
          id: crypto.randomUUID(),
          name: tag.name,
          color: tag.color,
          created_at: new Date(),
          updated_at: new Date()
        };
      },

      updateTag: async (tagId: string, updates: { name?: string; color?: string }) => {
        console.log('Web backend: updateTag not implemented', { tagId, updates });
        // ダミーの更新されたタグを返す（テスト用）
        return {
          id: tagId,
          name: updates.name || 'Updated Tag',
          color: updates.color,
          created_at: new Date(),
          updated_at: new Date()
        };
      },

      deleteTag: async (tagId: string) => {
        console.log('Web backend: deleteTag not implemented', { tagId });
        return true;
      },

      getAllTags: async () => {
        console.log('Web backend: getAllTags not implemented');
        return [];
      },

      addTagToTask: async (taskId: string, tagId: string) => {
        console.log('Web backend: addTagToTask not implemented', { taskId, tagId });
        return true;
      },

      removeTagFromTask: async (taskId: string, tagId: string) => {
        console.log('Web backend: removeTagFromTask not implemented', { taskId, tagId });
        return true;
      },

      addTagToSubTask: async (subTaskId: string, tagId: string) => {
        console.log('Web backend: addTagToSubTask not implemented', { subTaskId, tagId });
        return true;
      },

      removeTagFromSubTask: async (subTaskId: string, tagId: string) => {
        console.log('Web backend: removeTagFromSubTask not implemented', { subTaskId, tagId });
        return true;
      },

      autoSave: async () => {
        // Web版では何もしない（エラーも出さない）
        console.log('Web backend: Auto-save skipped (not implemented)');
      },

      // 一括操作API (Web版スタブ実装)
      bulkUpdateTasks: async (updates) => {
        console.log('Web backend: bulkUpdateTasks not implemented', updates);
        return [];
      },

      bulkDeleteTasks: async (taskIds) => {
        console.log('Web backend: bulkDeleteTasks not implemented', taskIds);
        return false;
      },

      bulkMoveTasksToList: async (taskIds, targetListId) => {
        console.log('Web backend: bulkMoveTasksToList not implemented', { taskIds, targetListId });
        return false;
      },

      // 自動保存制御 (Web版)
      enableAutoSave: async () => {
        console.log('Web backend: enableAutoSave not implemented');
      },

      disableAutoSave: async () => {
        console.log('Web backend: disableAutoSave not implemented');
      },

      getAutoSaveStatus: async () => {
        console.log('Web backend: getAutoSaveStatus not implemented');
        return false;
      },

      // 拡張ファイル操作 (Web版スタブ実装)
      exportData: async (filePath, format) => {
        console.log('Web backend: exportData not implemented', { filePath, format });
      },

      importData: async (filePath, format) => {
        console.log('Web backend: importData not implemented', { filePath, format });
      },

      createBackup: async (backupPath) => {
        console.log('Web backend: createBackup not implemented', backupPath);
        return 'backup-not-implemented';
      },

      restoreFromBackup: async (backupPath) => {
        console.log('Web backend: restoreFromBackup not implemented', backupPath);
      },

      listBackups: async () => {
        console.log('Web backend: listBackups not implemented');
        return [];
      },

      // パス管理 (Web版 - 未実装)
      getCurrentDataDir: async () => {
        console.log('Web backend: getCurrentDataDir not implemented');
        return './data';
      },

      getCurrentBackupDir: async () => {
        console.log('Web backend: getCurrentBackupDir not implemented');
        return './backups';
      },

      getCurrentExportDir: async () => {
        console.log('Web backend: getCurrentExportDir not implemented');
        return './exports';
      },

      getSystemDefaultDataDir: async () => {
        console.log('Web backend: getSystemDefaultDataDir not implemented');
        return './data';
      },

      getPathConfig: async () => {
        console.log('Web backend: getPathConfig not implemented');
        return {
          data_dir: './data',
          backup_dir: './backups',
          export_dir: './exports',
          use_system_default: true
        };
      },

      updatePathConfig: async (config) => {
        console.log('Web backend: updatePathConfig not implemented', config);
      },

      setCustomDataDir: async (path) => {
        console.log('Web backend: setCustomDataDir not implemented', path);
      },

      resetToSystemDefault: async () => {
        console.log('Web backend: resetToSystemDefault not implemented');
      },

      validatePath: async (path) => {
        console.log('Web backend: validatePath not implemented', path);
        return true;
      },

      ensureDirectories: async () => {
        console.log('Web backend: ensureDirectories not implemented');
      }
    };
  }
};
