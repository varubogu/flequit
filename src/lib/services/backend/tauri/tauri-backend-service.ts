import type { BackendService } from '$lib/services/backend/index';
import { TauriProjectService } from './project-tauri-service';
import { TauriTaskListService } from './tasklist-tauri-service';
import { TauriTaskService } from './task-tauri-service';
import { TauriSubTaskService } from './subtask-tauri-service';
import { TauriTagService } from './tag-tauri-service';
import { TauriSettingService } from './setting-tauri-service';
import { TauriAccountService } from './account-tauri-service';
import { TauriAutoFetchService } from './tauri-auto-fetch-service';
import { TauriInitializationService } from './tauri-initialization-service';

/**
 * Tauri環境用のBackendService統合実装
 */
export class TauriBackendService implements BackendService {
  public readonly project = new TauriProjectService();
  public readonly tasklist = new TauriTaskListService();
  public readonly task = new TauriTaskService();
  public readonly subtask = new TauriSubTaskService();
  public readonly tag = new TauriTagService();
  public readonly setting = new TauriSettingService();
  public readonly account = new TauriAccountService();
  public readonly autoFetch = new TauriAutoFetchService();
  public readonly initialization = new TauriInitializationService();
}
