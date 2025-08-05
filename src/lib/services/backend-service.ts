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

  autoSave: () => Promise<void>;
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

      autoSave: async () => {
        return await invoke('auto_save');
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

      autoSave: async () => {
        // Web版では何もしない（エラーも出さない）
        console.log('Web backend: Auto-save skipped (not implemented)');
      }
    };
  }
};
