import type { BackendService } from '$lib/services/backend/index';
import { ProjectWebService } from './project-web-service';
import { TasklistWebService } from './tasklist-web-service';
import { TaskWebService } from './task-web-service';
import { SubtaskWebService } from './subtask-web-service';
import { TagWebService } from './tag-web-service';
import { SettingWebService } from './setting-web-service';
import { AccountWebService } from './account-web-service';
import { AutoFetchWebService } from './auto-fetch-web-service';
import { InitializationWebService } from './initialization-web-service';

/**
 * Web環境用のBackendService統合実装
 */
export class BackendWebService implements BackendService {
  public readonly project = new ProjectWebService();
  public readonly tasklist = new TasklistWebService();
  public readonly task = new TaskWebService();
  public readonly subtask = new SubtaskWebService();
  public readonly tag = new TagWebService();
  public readonly setting = new SettingWebService();
  public readonly account = new AccountWebService();
  public readonly autoFetch = new AutoFetchWebService();
  public readonly initialization = new InitializationWebService();
}
