import { invoke } from '@tauri-apps/api/core';
import type { ProjectTree } from '$lib/types/task';
import { createProjectService, type ProjectService } from './project-service';
import { createTaskService, type TaskService } from './task-service';
import { createSubTaskService, type SubTaskService } from './subtask-service';
import { createTagService, type TagService } from './tag-service';
import { convertProjectTree, isTauriEnvironment } from './common';

export interface PathConfig {
  data_dir?: string;
  backup_dir?: string;
  export_dir?: string;
  use_system_default: boolean;
}

export interface BackendService extends ProjectService, TaskService, SubTaskService, TagService {
  greet: () => Promise<void>;
  getDocumentState: () => Promise<Uint8Array>;
  loadDocumentState: (data: Uint8Array) => Promise<void>;
  mergeDocument: (data: Uint8Array) => Promise<void>;
  saveDataToFile: (filePath: string) => Promise<void>;
  loadDataFromFile: (filePath: string) => Promise<void>;
  initializeSampleData: () => Promise<void>;
  getProjectTrees: () => Promise<ProjectTree[]>;
  loadProjectData: () => Promise<ProjectTree[]>;
  saveUserData: () => Promise<void>;

  autoSave: () => Promise<void>;

  enableAutoSave: () => Promise<void>;
  disableAutoSave: () => Promise<void>;
  getAutoSaveStatus: () => Promise<boolean>;

  exportData: (filePath?: string, format?: 'json' | 'automerge') => Promise<void>;
  importData: (filePath: string, format?: 'json' | 'automerge') => Promise<void>;
  createBackup: (backupPath?: string) => Promise<string>;
  restoreFromBackup: (backupPath: string) => Promise<void>;
  listBackups: () => Promise<string[]>;

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

class BackendServiceImpl implements BackendService {
  private projectService: ProjectService = createProjectService();
  private taskService: TaskService = createTaskService();
  private subTaskService: SubTaskService = createSubTaskService();
  private tagService: TagService = createTagService();

  createProject = this.projectService.createProject.bind(this.projectService);
  updateProject = this.projectService.updateProject.bind(this.projectService);
  deleteProject = this.projectService.deleteProject.bind(this.projectService);

  createTask = this.taskService.createTask.bind(this.taskService);
  getTask = this.taskService.getTask.bind(this.taskService);
  getAllTasks = this.taskService.getAllTasks.bind(this.taskService);
  updateTask = this.taskService.updateTask.bind(this.taskService);
  deleteTask = this.taskService.deleteTask.bind(this.taskService);
  createTaskList = this.taskService.createTaskList.bind(this.taskService);
  updateTaskList = this.taskService.updateTaskList.bind(this.taskService);
  deleteTaskList = this.taskService.deleteTaskList.bind(this.taskService);
  createTaskWithSubTasks = this.taskService.createTaskWithSubTasks.bind(this.taskService);
  updateTaskWithSubTasks = this.taskService.updateTaskWithSubTasks.bind(this.taskService);
  deleteTaskWithSubTasks = this.taskService.deleteTaskWithSubTasks.bind(this.taskService);
  bulkUpdateTasks = this.taskService.bulkUpdateTasks.bind(this.taskService);
  bulkDeleteTasks = this.taskService.bulkDeleteTasks.bind(this.taskService);
  bulkMoveTasksToList = this.taskService.bulkMoveTasksToList.bind(this.taskService);

  createSubTask = this.subTaskService.createSubTask.bind(this.subTaskService);
  updateSubTask = this.subTaskService.updateSubTask.bind(this.subTaskService);
  deleteSubTask = this.subTaskService.deleteSubTask.bind(this.subTaskService);

  createTag = this.tagService.createTag.bind(this.tagService);
  updateTag = this.tagService.updateTag.bind(this.tagService);
  deleteTag = this.tagService.deleteTag.bind(this.tagService);
  getAllTags = this.tagService.getAllTags.bind(this.tagService);
  addTagToTask = this.tagService.addTagToTask.bind(this.tagService);
  removeTagFromTask = this.tagService.removeTagFromTask.bind(this.tagService);
  addTagToSubTask = this.tagService.addTagToSubTask.bind(this.tagService);
  removeTagFromSubTask = this.tagService.removeTagFromSubTask.bind(this.tagService);

  async greet() {
    if (isTauriEnvironment()) {
      const message = await invoke('greet', { name: 'World' });
      console.log(`tauri.greet ${message}`);
    } else {
      console.log('tauri not available');
    }
  }

  async getDocumentState(): Promise<Uint8Array> {
    if (isTauriEnvironment()) {
      return await invoke('get_document_state');
    } else {
      console.log('getDocumentState called in web mode');
      throw new Error('Not implemented for web mode');
    }
  }

  async loadDocumentState(data: Uint8Array): Promise<void> {
    if (isTauriEnvironment()) {
      await invoke('load_document_state', { data: Array.from(data) });
    } else {
      console.log('loadDocumentState called in web mode', { data });
      throw new Error('Not implemented for web mode');
    }
  }

  async mergeDocument(data: Uint8Array): Promise<void> {
    if (isTauriEnvironment()) {
      await invoke('merge_document', { data: Array.from(data) });
    } else {
      console.log('mergeDocument called in web mode', { data });
      throw new Error('Not implemented for web mode');
    }
  }

  async saveDataToFile(filePath: string): Promise<void> {
    if (isTauriEnvironment()) {
      await invoke('save_data_to_file', { filePath });
    } else {
      console.log('saveDataToFile called in web mode', { filePath });
      throw new Error('Not implemented for web mode');
    }
  }

  async loadDataFromFile(filePath: string): Promise<void> {
    if (isTauriEnvironment()) {
      await invoke('load_data_from_file', { filePath });
    } else {
      console.log('loadDataFromFile called in web mode', { filePath });
      throw new Error('Not implemented for web mode');
    }
  }

  async initializeSampleData(): Promise<void> {
    if (isTauriEnvironment()) {
      await invoke('initialize_sample_data');
    } else {
      console.log('initializeSampleData called in web mode');
      throw new Error('Not implemented for web mode');
    }
  }

  async getProjectTrees() {
    if (isTauriEnvironment()) {
      const projects = (await invoke('get_project_trees')) as unknown[];
      return projects.map(convertProjectTree);
    } else {
      console.log('getProjectTrees called in web mode');
      throw new Error('Not implemented for web mode');
    }
  }

  async loadProjectData() {
    if (isTauriEnvironment()) {
      try {
        await invoke('load_data_from_file', { filePath: './data/tasks.automerge' });
        const rawProjects = (await invoke('get_project_trees')) as unknown[];
        return rawProjects.map(convertProjectTree);
      } catch (error) {
        console.log('Creating sample data for Tauri:', error);
        await invoke('initialize_sample_data');
        await invoke('save_data_to_file', { filePath: './data/tasks.automerge' });
        const rawProjects = (await invoke('get_project_trees')) as unknown[];
        return rawProjects.map(convertProjectTree);
      }
    } else {
      const { generateSampleData } = await import('$lib/data/sample-data');
      return generateSampleData();
    }
  }

  async saveUserData() {
    const { taskStore } = await import('$lib/stores/tasks.svelte');
    console.log('Saving user data...', taskStore.projects);
  }

  async autoSave(): Promise<void> {
    if (isTauriEnvironment()) {
      await invoke('auto_save');
    } else {
      console.log('Web backend: Auto-save skipped (not implemented)');
    }
  }

  async enableAutoSave() {
    if (isTauriEnvironment()) {
      const { autoSaveManager } = await import('$lib/stores/auto-save.svelte');
      autoSaveManager.enable();
    } else {
      console.log('Web backend: enableAutoSave not implemented');
    }
  }

  async disableAutoSave() {
    if (isTauriEnvironment()) {
      const { autoSaveManager } = await import('$lib/stores/auto-save.svelte');
      autoSaveManager.disable();
    } else {
      console.log('Web backend: disableAutoSave not implemented');
    }
  }

  async getAutoSaveStatus() {
    if (isTauriEnvironment()) {
      const { autoSaveManager } = await import('$lib/stores/auto-save.svelte');
      return autoSaveManager.isEnabled;
    } else {
      console.log('Web backend: getAutoSaveStatus not implemented');
      return false;
    }
  }

  async exportData(filePath?: string, format: 'json' | 'automerge' = 'automerge'): Promise<void> {
    if (isTauriEnvironment()) {
      if (format === 'json') {
        await invoke('export_data_json', { filePath });
      } else {
        await invoke('save_data_to_file', { filePath });
      }
    } else {
      console.log('Web backend: exportData not implemented', { filePath, format });
    }
  }

  async importData(filePath: string, format: 'json' | 'automerge' = 'automerge'): Promise<void> {
    if (isTauriEnvironment()) {
      if (format === 'json') {
        await invoke('import_data_json', { filePath });
      } else {
        await invoke('load_data_from_file', { filePath });
      }
    } else {
      console.log('Web backend: importData not implemented', { filePath, format });
    }
  }

  async createBackup(backupPath?: string): Promise<string> {
    if (isTauriEnvironment()) {
      if (backupPath) {
        await invoke('save_data_to_file', { filePath: backupPath });
        return backupPath;
      } else {
        return await invoke('create_backup');
      }
    } else {
      console.log('Web backend: createBackup not implemented', backupPath);
      return 'backup-not-implemented';
    }
  }

  async restoreFromBackup(backupPath: string): Promise<void> {
    if (isTauriEnvironment()) {
      await invoke('restore_from_backup', { backupPath });
    } else {
      console.log('Web backend: restoreFromBackup not implemented', backupPath);
    }
  }

  async listBackups(): Promise<string[]> {
    if (isTauriEnvironment()) {
      return await invoke('list_backups');
    } else {
      console.log('Web backend: listBackups not implemented');
      return [];
    }
  }

  async getCurrentDataDir(): Promise<string> {
    if (isTauriEnvironment()) {
      return await invoke('get_current_data_dir');
    } else {
      console.log('Web backend: getCurrentDataDir not implemented');
      return './data';
    }
  }

  async getCurrentBackupDir(): Promise<string> {
    if (isTauriEnvironment()) {
      return await invoke('get_current_backup_dir');
    } else {
      console.log('Web backend: getCurrentBackupDir not implemented');
      return './backups';
    }
  }

  async getCurrentExportDir(): Promise<string> {
    if (isTauriEnvironment()) {
      return await invoke('get_current_export_dir');
    } else {
      console.log('Web backend: getCurrentExportDir not implemented');
      return './exports';
    }
  }

  async getSystemDefaultDataDir(): Promise<string> {
    if (isTauriEnvironment()) {
      return await invoke('get_system_default_data_dir');
    } else {
      console.log('Web backend: getSystemDefaultDataDir not implemented');
      return './data';
    }
  }

  async getPathConfig(): Promise<PathConfig> {
    if (isTauriEnvironment()) {
      return await invoke('get_path_config');
    } else {
      console.log('Web backend: getPathConfig not implemented');
      return {
        data_dir: './data',
        backup_dir: './backups',
        export_dir: './exports',
        use_system_default: true
      };
    }
  }

  async updatePathConfig(config: PathConfig): Promise<void> {
    if (isTauriEnvironment()) {
      await invoke('update_path_config', { newConfig: config });
    } else {
      console.log('Web backend: updatePathConfig not implemented', config);
    }
  }

  async setCustomDataDir(path: string): Promise<void> {
    if (isTauriEnvironment()) {
      await invoke('set_custom_data_dir', { path });
    } else {
      console.log('Web backend: setCustomDataDir not implemented', path);
    }
  }

  async resetToSystemDefault(): Promise<void> {
    if (isTauriEnvironment()) {
      await invoke('reset_to_system_default');
    } else {
      console.log('Web backend: resetToSystemDefault not implemented');
    }
  }

  async validatePath(path: string): Promise<boolean> {
    if (isTauriEnvironment()) {
      return await invoke('validate_path', { path });
    } else {
      console.log('Web backend: validatePath not implemented', path);
      return true;
    }
  }

  async ensureDirectories(): Promise<void> {
    if (isTauriEnvironment()) {
      await invoke('ensure_directories');
    } else {
      console.log('Web backend: ensureDirectories not implemented');
    }
  }
}

export const backendService = (): BackendService => {
  return new BackendServiceImpl();
};