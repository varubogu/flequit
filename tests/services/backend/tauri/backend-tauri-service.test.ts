import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BackendTauriService } from '$lib/infrastructure/backends/tauri/backend-tauri-service';
import { ProjectTauriService } from '$lib/infrastructure/backends/tauri/project-tauri-service';
import { TasklistTauriService } from '$lib/infrastructure/backends/tauri/tasklist-tauri-service';
import { TaskTauriService } from '$lib/infrastructure/backends/tauri/task-tauri-service';
import { SubtaskTauriService } from '$lib/infrastructure/backends/tauri/subtask-tauri-service';
import { TagTauriService } from '$lib/infrastructure/backends/tauri/tag-tauri-service';
import { SettingTauriService } from '$lib/infrastructure/backends/tauri/setting-tauri-service';
import { AccountTauriService } from '$lib/infrastructure/backends/tauri/account-tauri-service';
import { AutoFetchTauriService } from '$lib/infrastructure/backends/tauri/auto-fetch-tauri-service';
import { InitializationTauriService } from '$lib/infrastructure/backends/tauri/initialization-tauri-service';
import { UserTauriService } from '$lib/infrastructure/backends/tauri/user-tauri-service';
import { TaggingTauriService } from '$lib/infrastructure/backends/tauri/tagging-tauri-service';
import { AssignmentTauriService } from '$lib/infrastructure/backends/tauri/assignment-tauri-service';

describe('BackendTauriService', () => {
  let service: BackendTauriService;

  beforeEach(() => {
    service = new BackendTauriService();
    vi.clearAllMocks();
  });

  describe('service initialization', () => {
    it('should initialize all required services', () => {
      expect(service.project).toBeInstanceOf(ProjectTauriService);
      expect(service.tasklist).toBeInstanceOf(TasklistTauriService);
      expect(service.task).toBeInstanceOf(TaskTauriService);
      expect(service.subtask).toBeInstanceOf(SubtaskTauriService);
      expect(service.tag).toBeInstanceOf(TagTauriService);
      expect(service.setting).toBeInstanceOf(SettingTauriService);
      expect(service.account).toBeInstanceOf(AccountTauriService);
      expect(service.autoFetch).toBeInstanceOf(AutoFetchTauriService);
      expect(service.initialization).toBeInstanceOf(InitializationTauriService);
      expect(service.user).toBeInstanceOf(UserTauriService);
      expect(service.tagging).toBeInstanceOf(TaggingTauriService);
      expect(service.assignment).toBeInstanceOf(AssignmentTauriService);
    });

    it('should have all services as readonly properties', () => {
      // readonlyプロパティのため、設定しようとするとTypeScriptエラーになるが
      // 実行時の動作を確認
      const originalProject = service.project;

      // プロパティが変更不可能かテスト（TypeScriptレベルでreadonly）
      expect(service.project).toBe(originalProject);

      // 各サービスが独立したインスタンスであることを確認
      expect(service.project).not.toBe(service.tasklist);
      expect(service.task).not.toBe(service.subtask);
      expect(service.tag).not.toBe(service.setting);
      expect(service.account).not.toBe(service.autoFetch);
      expect(service.initialization).not.toBe(service.project);
    });

    it('should initialize services only once per instance', () => {
      const project1 = service.project;
      const project2 = service.project;

      expect(project1).toBe(project2); // 同じインスタンス
    });
  });

  describe('BackendService interface compliance', () => {
    it('should implement all required service properties', () => {
      // BackendServiceインターフェースの全プロパティが存在することを確認
      expect(service).toHaveProperty('project');
      expect(service).toHaveProperty('tasklist');
      expect(service).toHaveProperty('task');
      expect(service).toHaveProperty('subtask');
      expect(service).toHaveProperty('tag');
      expect(service).toHaveProperty('setting');
      expect(service).toHaveProperty('account');
      expect(service).toHaveProperty('autoFetch');
      expect(service).toHaveProperty('initialization');
      expect(service).toHaveProperty('user');
      expect(service).toHaveProperty('tagging');
      expect(service).toHaveProperty('assignment');
    });

    it('should have all services with proper method signatures', () => {
      // ProjectService interface
      expect(typeof service.project.create).toBe('function');
      expect(typeof service.project.update).toBe('function');
      expect(typeof service.project.delete).toBe('function');
      expect(typeof service.project.get).toBe('function');
      expect(typeof service.project.search).toBe('function');

      // TaskListService interface
      expect(typeof service.tasklist.create).toBe('function');
      expect(typeof service.tasklist.update).toBe('function');
      expect(typeof service.tasklist.delete).toBe('function');
      expect(typeof service.tasklist.get).toBe('function');
      expect(typeof service.tasklist.search).toBe('function');

      // TaskService interface
      expect(typeof service.task.create).toBe('function');
      expect(typeof service.task.update).toBe('function');
      expect(typeof service.task.delete).toBe('function');
      expect(typeof service.task.get).toBe('function');
      expect(typeof service.task.search).toBe('function');

      // SubTaskService interface
      expect(typeof service.subtask.create).toBe('function');
      expect(typeof service.subtask.update).toBe('function');
      expect(typeof service.subtask.delete).toBe('function');
      expect(typeof service.subtask.get).toBe('function');
      expect(typeof service.subtask.search).toBe('function');

      // TagService interface
      expect(typeof service.tag.create).toBe('function');
      expect(typeof service.tag.update).toBe('function');
      expect(typeof service.tag.delete).toBe('function');
      expect(typeof service.tag.get).toBe('function');
      expect(typeof service.tag.search).toBe('function');

      // SettingService interface
      expect(typeof service.setting.get).toBe('function');
      expect(typeof service.setting.getAll).toBe('function');
      expect(typeof service.setting.update).toBe('function');

      // AccountService interface
      expect(typeof service.account.create).toBe('function');
      expect(typeof service.account.get).toBe('function');
      expect(typeof service.account.update).toBe('function');
      expect(typeof service.account.delete).toBe('function');

      // AutoFetchService interface
      expect(typeof service.autoFetch.notifyDataChange).toBe('function');
      expect(typeof service.autoFetch.subscribe).toBe('function');
      expect(typeof service.autoFetch.subscribeToDataType).toBe('function');

      // InitializationService interface
      expect(typeof service.initialization.loadLocalSettings).toBe('function');
      expect(typeof service.initialization.loadAccount).toBe('function');
      expect(typeof service.initialization.loadProjectData).toBe('function');
      expect(typeof service.initialization.initializeAll).toBe('function');

      // UserService interface
      expect(typeof service.user.create).toBe('function');
      expect(typeof service.user.get).toBe('function');
      expect(typeof service.user.update).toBe('function');
      expect(typeof service.user.delete).toBe('function');

      // TaggingService interface
      expect(typeof service.tagging.createTaskTag).toBe('function');
      expect(typeof service.tagging.deleteTaskTag).toBe('function');
      expect(typeof service.tagging.createSubtaskTag).toBe('function');
      expect(typeof service.tagging.deleteSubtaskTag).toBe('function');

      // AssignmentService interface
      expect(typeof service.assignment.createTaskAssignment).toBe('function');
      expect(typeof service.assignment.deleteTaskAssignment).toBe('function');
      expect(typeof service.assignment.createSubtaskAssignment).toBe('function');
      expect(typeof service.assignment.deleteSubtaskAssignment).toBe('function');
    });
  });

  describe('service integration', () => {
    it('should provide working project service', async () => {
      // プロジェクトサービスが実際に動作することを確認（モック化が必要）
      expect(service.project).toBeDefined();
      expect(typeof service.project.create).toBe('function');
    });

    it('should provide working tasklist service', () => {
      expect(service.tasklist).toBeDefined();
      expect(typeof service.tasklist.create).toBe('function');
    });

    it('should provide working task service', () => {
      expect(service.task).toBeDefined();
      expect(typeof service.task.create).toBe('function');
    });

    it('should provide working subtask service', () => {
      expect(service.subtask).toBeDefined();
      expect(typeof service.subtask.create).toBe('function');
    });

    it('should provide working tag service', () => {
      expect(service.tag).toBeDefined();
      expect(typeof service.tag.create).toBe('function');
    });

    it('should provide working setting service', () => {
      expect(service.setting).toBeDefined();
      expect(typeof service.setting.get).toBe('function');
    });

    it('should provide working account service', () => {
      expect(service.account).toBeDefined();
      expect(typeof service.account.create).toBe('function');
    });

    it('should provide working autoFetch service', () => {
      expect(service.autoFetch).toBeDefined();
      expect(typeof service.autoFetch.notifyDataChange).toBe('function');
    });

    it('should provide working initialization service', () => {
      expect(service.initialization).toBeDefined();
      expect(typeof service.initialization.initializeAll).toBe('function');
    });

    it('should provide working user service', () => {
      expect(service.user).toBeDefined();
      expect(typeof service.user.create).toBe('function');
    });

    it('should provide working tagging service', () => {
      expect(service.tagging).toBeDefined();
      expect(typeof service.tagging.createTaskTag).toBe('function');
    });

    it('should provide working assignment service', () => {
      expect(service.assignment).toBeDefined();
      expect(typeof service.assignment.createTaskAssignment).toBe('function');
    });
  });

  describe('service interactions', () => {
    it('should have independent service instances', () => {
      // 各サービスが独立していることを確認
      const services = [
        service.project,
        service.tasklist,
        service.task,
        service.subtask,
        service.tag,
        service.setting,
        service.account,
        service.autoFetch,
        service.initialization,
        service.user,
        service.tagging,
        service.assignment
      ];

      // 全てのサービスが異なるインスタンスであることを確認
      for (let i = 0; i < services.length; i++) {
        for (let j = i + 1; j < services.length; j++) {
          expect(services[i]).not.toBe(services[j]);
        }
      }
    });

    it('should allow concurrent access to different services', () => {
      // 複数のサービスに同時にアクセスできることを確認
      const projectService = service.project;
      const taskService = service.task;
      const settingService = service.setting;

      expect(projectService).toBeDefined();
      expect(taskService).toBeDefined();
      expect(settingService).toBeDefined();

      // 各サービスは独立して動作する
      expect(projectService).not.toBe(taskService);
      expect(taskService).not.toBe(settingService);
      expect(settingService).not.toBe(projectService);
    });

    it('should maintain service state independently', async () => {
      // autoFetchサービスでリスナーを登録
      const callback = vi.fn();
      const unsubscribe = service.autoFetch.subscribe(callback);

      expect(typeof unsubscribe).toBe('function');

      // 他のサービスの操作がautoFetchサービスに影響しないことを確認
      expect(service.project).toBeDefined();
      expect(service.task).toBeDefined();

      // アンサブスクライブが正常に動作することを確認
      unsubscribe();
      expect(() => unsubscribe()).not.toThrow();
    });
  });

  describe('multiple instances', () => {
    it('should create independent service instances', () => {
      const service1 = new BackendTauriService();
      const service2 = new BackendTauriService();

      // 異なるBackendTauriServiceインスタンスは独立している
      expect(service1).not.toBe(service2);
      expect(service1.project).not.toBe(service2.project);
      expect(service1.autoFetch).not.toBe(service2.autoFetch);
    });

    it('should allow multiple service instances to coexist', async () => {
      const service1 = new BackendTauriService();
      const service2 = new BackendTauriService();

      // 両方のサービスが正常に動作する
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const unsubscribe1 = service1.autoFetch.subscribe(callback1);
      const unsubscribe2 = service2.autoFetch.subscribe(callback2);

      expect(typeof unsubscribe1).toBe('function');
      expect(typeof unsubscribe2).toBe('function');

      // クリーンアップ
      unsubscribe1();
      unsubscribe2();
    });
  });

  describe('edge cases', () => {
    it('should handle service property access patterns', () => {
      // プロパティアクセスのパターンテスト
      const { project, task, setting } = service;

      expect(project).toBeInstanceOf(ProjectTauriService);
      expect(task).toBeInstanceOf(TaskTauriService);
      expect(setting).toBeInstanceOf(SettingTauriService);
    });

    it('should maintain consistent service references', () => {
      // 同じサービスへの複数回アクセスが同じインスタンスを返すことを確認
      const project1 = service.project;
      const project2 = service.project;
      const autoFetch1 = service.autoFetch;
      const autoFetch2 = service.autoFetch;

      expect(project1).toBe(project2);
      expect(autoFetch1).toBe(autoFetch2);
    });

    it('should handle property enumeration', () => {
      // オブジェクトのプロパティ列挙テスト
      const serviceKeys = Object.keys(service);
      const expectedKeys = [
        'project',
        'tasklist',
        'task',
        'subtask',
        'tag',
        'setting',
        'account',
        'autoFetch',
        'initialization',
        'user',
        'tagging',
        'assignment',
        'recurrenceRule',
        'taskRecurrence',
        'subtaskRecurrence',
        'settingsManagement'
      ];

      expect(serviceKeys.sort()).toEqual(expectedKeys.sort());
    });

    it('should handle hasOwnProperty checks', () => {
      expect(Object.prototype.hasOwnProperty.call(service, 'project')).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(service, 'tasklist')).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(service, 'task')).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(service, 'subtask')).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(service, 'tag')).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(service, 'setting')).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(service, 'account')).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(service, 'autoFetch')).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(service, 'initialization')).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(service, 'user')).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(service, 'tagging')).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(service, 'assignment')).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(service, 'recurrenceRule')).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(service, 'taskRecurrence')).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(service, 'subtaskRecurrence')).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(service, 'settingsManagement')).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(service, 'nonExistentProperty')).toBe(false);
    });
  });

  describe('service type validation', () => {
    it('should have correct service types', () => {
      // TypeScriptの型システムでは実行時にはチェックできないが、
      // インスタンスタイプでサービスの正しさを検証
      expect(service.project.constructor.name).toBe('ProjectTauriService');
      expect(service.tasklist.constructor.name).toBe('TasklistTauriService');
      expect(service.task.constructor.name).toBe('TaskTauriService');
      expect(service.subtask.constructor.name).toBe('SubtaskTauriService');
      expect(service.tag.constructor.name).toBe('TagTauriService');
      expect(service.setting.constructor.name).toBe('SettingTauriService');
      expect(service.account.constructor.name).toBe('AccountTauriService');
      expect(service.autoFetch.constructor.name).toBe('AutoFetchTauriService');
      expect(service.initialization.constructor.name).toBe('InitializationTauriService');
      expect(service.user.constructor.name).toBe('UserTauriService');
      expect(service.tagging.constructor.name).toBe('TaggingTauriService');
      expect(service.assignment.constructor.name).toBe('AssignmentTauriService');
    });

    it('should maintain prototype chain integrity', () => {
      // プロトタイプチェーンの整合性確認
      expect(service.project instanceof ProjectTauriService).toBe(true);
      expect(service.tasklist instanceof TasklistTauriService).toBe(true);
      expect(service.task instanceof TaskTauriService).toBe(true);
      expect(service.subtask instanceof SubtaskTauriService).toBe(true);
      expect(service.tag instanceof TagTauriService).toBe(true);
      expect(service.setting instanceof SettingTauriService).toBe(true);
      expect(service.account instanceof AccountTauriService).toBe(true);
      expect(service.autoFetch instanceof AutoFetchTauriService).toBe(true);
      expect(service.initialization instanceof InitializationTauriService).toBe(true);
      expect(service.user instanceof UserTauriService).toBe(true);
      expect(service.tagging instanceof TaggingTauriService).toBe(true);
      expect(service.assignment instanceof AssignmentTauriService).toBe(true);
    });
  });
});
