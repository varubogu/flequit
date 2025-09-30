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
import { UserWebService } from './user-web-service';
import { TaggingWebService } from './tagging-web-service';
import { AssignmentWebService } from './assignment-web-service';
import { RecurrenceRuleWebService } from './recurrence-rule-web-service';
import { TaskRecurrenceWebService } from './task-recurrence-web-service';
import { SubtaskRecurrenceWebService } from './subtask-recurrence-web-service';
import { SettingsManagementWebService } from './settings-management-web-service';

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
  public readonly user = new UserWebService();
  public readonly tagging = new TaggingWebService();
  public readonly assignment = new AssignmentWebService();
  public readonly recurrenceRule = new RecurrenceRuleWebService();
  public readonly taskRecurrence = new TaskRecurrenceWebService();
  public readonly subtaskRecurrence = new SubtaskRecurrenceWebService();
  public readonly settingsManagement = new SettingsManagementWebService();
}
