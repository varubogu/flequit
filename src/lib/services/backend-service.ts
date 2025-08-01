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
import { taskStore } from '$lib/stores/tasks.svelte';

interface BackendService {
  greet: () => Promise<void>;
  createTask: (title: string, description: string) => Promise<Task>;
  getTask: (taskId: string) => Promise<Task | null>;
  getAllTasks: () => Promise<Task[]>;
  updateTask: (taskId: string, title?: string, description?: string, completed?: boolean) => Promise<Task | null>;
  deleteTask: (taskId: string) => Promise<boolean>;
  getDocumentState: () => Promise<Uint8Array>;
  loadDocumentState: (data: Uint8Array) => Promise<void>;
  mergeDocument: (data: Uint8Array) => Promise<void>;
  saveDataToFile: (filePath: string) => Promise<void>;
  loadDataFromFile: (filePath: string) => Promise<void>;
  initializeSampleData: () => Promise<void>;
  getProjectTrees: () => Promise<ProjectTree[]>;
  loadProjectData: () => Promise<ProjectTree[]>;
  saveUserData: () => void;
}

// 型変換ヘルパー関数（timestamp -> Date）
function convertTimestampToDate(timestamp: number): Date {
  return new Date(timestamp);
}

// TauriからのProjectTreeデータをフロントエンド型に変換
function convertProjectTree(project: any): ProjectTree {
  return {
    ...project,
    created_at: convertTimestampToDate(project.created_at),
    updated_at: convertTimestampToDate(project.updated_at),
    task_lists: project.task_lists.map(convertTaskList)
  };
}

function convertTaskList(list: any): TaskListWithTasks {
  return {
    ...list,
    created_at: convertTimestampToDate(list.created_at),
    updated_at: convertTimestampToDate(list.updated_at),
    tasks: list.tasks.map(convertTask)
  };
}

function convertTask(task: any): TaskWithSubTasks {
  return {
    ...task,
    status: task.status as TaskStatus,
    start_date: task.start_date ? convertTimestampToDate(task.start_date) : undefined,
    end_date: task.end_date ? convertTimestampToDate(task.end_date) : undefined,
    created_at: convertTimestampToDate(task.created_at),
    updated_at: convertTimestampToDate(task.updated_at),
    sub_tasks: task.sub_tasks.map(convertSubTask),
    tags: task.tags.map(convertTag)
  };
}

function convertSubTask(subtask: any): SubTask {
  return {
    ...subtask,
    status: subtask.status as TaskStatus,
    start_date: subtask.start_date ? convertTimestampToDate(subtask.start_date) : undefined,
    end_date: subtask.end_date ? convertTimestampToDate(subtask.end_date) : undefined,
    created_at: convertTimestampToDate(subtask.created_at),
    updated_at: convertTimestampToDate(subtask.updated_at),
    tags: subtask.tags.map(convertTag)
  };
}

function convertTag(tag: any): Tag {
  return {
    ...tag,
    created_at: convertTimestampToDate(tag.created_at),
    updated_at: convertTimestampToDate(tag.updated_at)
  };
}

async function isTauriEnvironment(): Promise<boolean> {
  // @ts-ignore
  return typeof window !== 'undefined' && window.__TAURI_INTERNALS__;
}

export const backendService = (): BackendService => {
  // TODO: より良い方法があれば改善
  // @ts-ignore
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
      updateTask: async (taskId: string, title?: string, description?: string, completed?: boolean) => {
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
        const projects: any[] = await invoke('get_project_trees');
        return projects.map(convertProjectTree);
      },
      loadProjectData: async () => {
        // Tauri版：ファイルから読み込み、なければサンプルデータを初期化
        try {
          await invoke('load_data_from_file', { filePath: './data/tasks.automerge' });
          const rawProjects: any[] = await invoke('get_project_trees');
          return rawProjects.map(convertProjectTree);
        } catch (error) {
          // ファイルが存在しない場合はサンプルデータを初期化
          console.log('Creating sample data for Tauri:', error);
          await invoke('initialize_sample_data');
          await invoke('save_data_to_file', { filePath: './data/tasks.automerge' });
          const rawProjects: any[] = await invoke('get_project_trees');
          return rawProjects.map(convertProjectTree);
        }
      },
      saveUserData: () => {
        console.log('Saving user data...', taskStore.projects);
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
      updateTask: async (taskId: string, title?: string, description?: string, completed?: boolean) => {
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
      saveUserData: () => {
        console.log('Saving user data...', taskStore.projects);
      }
    };
  }
}
