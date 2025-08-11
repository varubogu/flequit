import type { BackendService } from '$lib/services/backend/index';
import { WebProjectService } from './project-web-service';
import { WebTaskListService } from './tasklist-web-service';
import { WebTaskService } from './task-web-service';
import { WebSubTaskService } from './subtask-web-service';
import { WebTagService } from './tag-web-service';
import { WebSettingService } from './setting-web-service';
import { WebAccountService } from './account-web-service';
import { WebAutoFetchService } from './web-auto-fetch-service';
import { WebInitializationService } from './web-initialization-service';

/**
 * Web環境用のBackendService統合実装
 */
export class WebBackendService implements BackendService {
  public readonly project = new WebProjectService();
  public readonly tasklist = new WebTaskListService();
  public readonly task = new WebTaskService();
  public readonly subtask = new WebSubTaskService();
  public readonly tag = new WebTagService();
  public readonly setting = new WebSettingService();
  public readonly account = new WebAccountService();
  public readonly autoFetch = new WebAutoFetchService();
  public readonly initialization = new WebInitializationService();
}
