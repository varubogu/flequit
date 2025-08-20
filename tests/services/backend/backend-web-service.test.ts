import { describe, it, expect, beforeEach } from 'vitest';
import { BackendWebService } from '$lib/services/backend/web/backend-web-service';
import { ProjectWebService } from '$lib/services/backend/web/project-web-service';
import { TasklistWebService } from '$lib/services/backend/web/tasklist-web-service';
import { TaskWebService } from '$lib/services/backend/web/task-web-service';
import { SubtaskWebService } from '$lib/services/backend/web/subtask-web-service';
import { TagWebService } from '$lib/services/backend/web/tag-web-service';
import { SettingWebService } from '$lib/services/backend/web/setting-web-service';
import { AccountWebService } from '$lib/services/backend/web/account-web-service';
import { AutoFetchWebService } from '$lib/services/backend/web/auto-fetch-web-service';
import { InitializationWebService } from '$lib/services/backend/web/initialization-web-service';

describe('BackendWebService', () => {
  let service: BackendWebService;

  beforeEach(() => {
    service = new BackendWebService();
  });

  describe('service initialization', () => {
    it('should initialize all required services', () => {
      expect(service.project).toBeInstanceOf(ProjectWebService);
      expect(service.tasklist).toBeInstanceOf(TasklistWebService);
      expect(service.task).toBeInstanceOf(TaskWebService);
      expect(service.subtask).toBeInstanceOf(SubtaskWebService);
      expect(service.tag).toBeInstanceOf(TagWebService);
      expect(service.setting).toBeInstanceOf(SettingWebService);
      expect(service.account).toBeInstanceOf(AccountWebService);
      expect(service.autoFetch).toBeInstanceOf(AutoFetchWebService);
      expect(service.initialization).toBeInstanceOf(InitializationWebService);
    });

    it('should have all services as readonly properties', () => {
      const originalProject = service.project;

      expect(service.project).toBe(originalProject);

      // 各サービスが独立したインスタンスであることを確認
      expect(service.project).not.toBe(service.tasklist);
      expect(service.task).not.toBe(service.subtask);
      expect(service.tag).not.toBe(service.setting);
      expect(service.account).not.toBe(service.autoFetch);
      expect(service.initialization).not.toBe(service.project);
    });
  });

  describe('BackendService interface compliance', () => {
    it('should implement all required service properties', () => {
      expect(service).toHaveProperty('project');
      expect(service).toHaveProperty('tasklist');
      expect(service).toHaveProperty('task');
      expect(service).toHaveProperty('subtask');
      expect(service).toHaveProperty('tag');
      expect(service).toHaveProperty('setting');
      expect(service).toHaveProperty('account');
      expect(service).toHaveProperty('autoFetch');
      expect(service).toHaveProperty('initialization');
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
    });
  });

  describe('service integration', () => {
    it('should provide working project service', () => {
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
  });

  describe('service interactions', () => {
    it('should have independent service instances', () => {
      const services = [
        service.project,
        service.tasklist,
        service.task,
        service.subtask,
        service.tag,
        service.setting,
        service.account,
        service.autoFetch,
        service.initialization
      ];

      for (let i = 0; i < services.length; i++) {
        for (let j = i + 1; j < services.length; j++) {
          expect(services[i]).not.toBe(services[j]);
        }
      }
    });

    it('should allow concurrent access to different services', () => {
      const projectService = service.project;
      const taskService = service.task;
      const settingService = service.setting;

      expect(projectService).toBeDefined();
      expect(taskService).toBeDefined();
      expect(settingService).toBeDefined();

      expect(projectService).not.toBe(taskService);
      expect(taskService).not.toBe(settingService);
      expect(settingService).not.toBe(projectService);
    });
  });

  describe('multiple instances', () => {
    it('should create independent service instances', () => {
      const service1 = new BackendWebService();
      const service2 = new BackendWebService();

      expect(service1).not.toBe(service2);
      expect(service1.project).not.toBe(service2.project);
      expect(service1.autoFetch).not.toBe(service2.autoFetch);
    });

    it('should allow multiple service instances to coexist', () => {
      const service1 = new BackendWebService();
      const service2 = new BackendWebService();

      expect(service1.project).toBeInstanceOf(ProjectWebService);
      expect(service2.project).toBeInstanceOf(ProjectWebService);
      expect(service1.project).not.toBe(service2.project);
    });
  });

  describe('service type validation', () => {
    it('should have correct service types', () => {
      expect(service.project.constructor.name).toBe('ProjectWebService');
      expect(service.tasklist.constructor.name).toBe('TasklistWebService');
      expect(service.task.constructor.name).toBe('TaskWebService');
      expect(service.subtask.constructor.name).toBe('SubtaskWebService');
      expect(service.tag.constructor.name).toBe('TagWebService');
      expect(service.setting.constructor.name).toBe('SettingWebService');
      expect(service.account.constructor.name).toBe('AccountWebService');
      expect(service.autoFetch.constructor.name).toBe('AutoFetchWebService');
      expect(service.initialization.constructor.name).toBe('InitializationWebService');
    });

    it('should maintain prototype chain integrity', () => {
      expect(service.project instanceof ProjectWebService).toBe(true);
      expect(service.tasklist instanceof TasklistWebService).toBe(true);
      expect(service.task instanceof TaskWebService).toBe(true);
      expect(service.subtask instanceof SubtaskWebService).toBe(true);
      expect(service.tag instanceof TagWebService).toBe(true);
      expect(service.setting instanceof SettingWebService).toBe(true);
      expect(service.account instanceof AccountWebService).toBe(true);
      expect(service.autoFetch instanceof AutoFetchWebService).toBe(true);
      expect(service.initialization instanceof InitializationWebService).toBe(true);
    });
  });

  describe('property enumeration', () => {
    it('should handle property enumeration', () => {
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
        'initialization'
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
      expect(Object.prototype.hasOwnProperty.call(service, 'nonExistentProperty')).toBe(false);
    });
  });
});
