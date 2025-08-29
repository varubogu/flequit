import type { BackendService } from '$lib/services/backend/index';
import { ProjectTauriService } from './project-tauri-service';
import { TasklistTauriService } from './tasklist-tauri-service';
import { TaskTauriService } from './task-tauri-service';
import { SubtaskTauriService } from './subtask-tauri-service';
import { TagTauriService } from './tag-tauri-service';
import { SettingTauriService } from './setting-tauri-service';
import { AccountTauriService } from './account-tauri-service';
import { AutoFetchTauriService } from './auto-fetch-tauri-service';
import { InitializationTauriService } from './initialization-tauri-service';
import { UserTauriService } from './user-tauri-service';
import { TaggingTauriService } from './tagging-tauri-service';
import { AssignmentTauriService } from './assignment-tauri-service';

/**
 * Tauri環境用のBackendService統合実装
 */
export class BackendTauriService implements BackendService {
  public readonly project = new ProjectTauriService();
  public readonly tasklist = new TasklistTauriService();
  public readonly task = new TaskTauriService();
  public readonly subtask = new SubtaskTauriService();
  public readonly tag = new TagTauriService();
  public readonly setting = new SettingTauriService();
  public readonly account = new AccountTauriService();
  public readonly autoFetch = new AutoFetchTauriService();
  public readonly initialization = new InitializationTauriService();
  public readonly user = new UserTauriService();
  public readonly tagging = new TaggingTauriService();
  public readonly assignment = new AssignmentTauriService();
}
