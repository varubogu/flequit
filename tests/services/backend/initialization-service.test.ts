import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { 
  InitializationService, 
  LocalSettings, 
  Account, 
  InitializationResult 
} from '$lib/services/backend/initialization-service';
import type { ProjectTree } from '$lib/types/project';

// モックの初期化サービス実装
class MockInitializationService implements InitializationService {
  // テスト用にモック化されたメソッド
  loadLocalSettings = vi.fn();
  loadAccount = vi.fn();
  loadProjectData = vi.fn();
  initializeAll = vi.fn();
}

describe('InitializationService Interface', () => {
  let service: MockInitializationService;
  let mockLocalSettings: LocalSettings;
  let mockAccount: Account;
  let mockProjects: ProjectTree[];
  let mockInitResult: InitializationResult;

  beforeEach(() => {
    service = new MockInitializationService();
    
    mockLocalSettings = {
      theme: 'dark',
      language: 'ja',
      customSetting: 'test value'
    };

    mockAccount = {
      id: 'account-123',
      name: 'Test User',
      email: 'test@example.com',
      profile_image: 'https://example.com/avatar.jpg',
      created_at: new Date('2024-01-01T00:00:00Z'),
      updated_at: new Date('2024-01-01T00:00:00Z')
    };

    mockProjects = [
      {
        id: 'project-123',
        name: 'Test Project',
        description: 'Test Description',
        color: '#FF5733',
        order_index: 0,
        is_archived: false,
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-01T00:00:00Z'),
        task_lists: []
      }
    ];

    mockInitResult = {
      localSettings: mockLocalSettings,
      account: mockAccount,
      projects: mockProjects
    };

    vi.clearAllMocks();
  });

  describe('loadLocalSettings', () => {
    it('should load local settings successfully', async () => {
      service.loadLocalSettings.mockResolvedValue(mockLocalSettings);

      const result = await service.loadLocalSettings();

      expect(service.loadLocalSettings).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockLocalSettings);
      expect(result.theme).toBe('dark');
      expect(result.language).toBe('ja');
    });

    it('should handle different theme settings', async () => {
      const lightSettings = { ...mockLocalSettings, theme: 'light' as const };
      service.loadLocalSettings.mockResolvedValue(lightSettings);

      const result = await service.loadLocalSettings();

      expect(result.theme).toBe('light');
    });

    it('should handle system theme setting', async () => {
      const systemSettings = { ...mockLocalSettings, theme: 'system' as const };
      service.loadLocalSettings.mockResolvedValue(systemSettings);

      const result = await service.loadLocalSettings();

      expect(result.theme).toBe('system');
    });

    it('should handle different language settings', async () => {
      const englishSettings = { ...mockLocalSettings, language: 'en' };
      service.loadLocalSettings.mockResolvedValue(englishSettings);

      const result = await service.loadLocalSettings();

      expect(result.language).toBe('en');
    });

    it('should handle custom settings', async () => {
      const customSettings = {
        ...mockLocalSettings,
        customOption: true,
        maxItems: 100,
        features: ['feature1', 'feature2']
      };
      service.loadLocalSettings.mockResolvedValue(customSettings);

      const result = await service.loadLocalSettings();

      expect(result.customOption).toBe(true);
      expect(result.maxItems).toBe(100);
      expect(result.features).toEqual(['feature1', 'feature2']);
    });

    it('should handle load settings failure', async () => {
      service.loadLocalSettings.mockRejectedValue(new Error('Settings load failed'));

      await expect(service.loadLocalSettings()).rejects.toThrow('Settings load failed');
    });
  });

  describe('loadAccount', () => {
    it('should load account successfully', async () => {
      service.loadAccount.mockResolvedValue(mockAccount);

      const result = await service.loadAccount();

      expect(service.loadAccount).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockAccount);
      expect(result?.name).toBe('Test User');
      expect(result?.email).toBe('test@example.com');
    });

    it('should return null when no account exists', async () => {
      service.loadAccount.mockResolvedValue(null);

      const result = await service.loadAccount();

      expect(result).toBeNull();
    });

    it('should handle account without optional fields', async () => {
      const minimalAccount = {
        id: 'account-minimal',
        name: 'Minimal User',
        created_at: new Date(),
        updated_at: new Date()
      };
      service.loadAccount.mockResolvedValue(minimalAccount);

      const result = await service.loadAccount();

      expect(result?.email).toBeUndefined();
      expect(result?.profile_image).toBeUndefined();
      expect(result?.name).toBe('Minimal User');
    });

    it('should handle account with all optional fields', async () => {
      const fullAccount = {
        ...mockAccount,
        profile_image: 'https://example.com/custom-avatar.png'
      };
      service.loadAccount.mockResolvedValue(fullAccount);

      const result = await service.loadAccount();

      expect(result?.profile_image).toBe('https://example.com/custom-avatar.png');
    });

    it('should handle load account failure', async () => {
      service.loadAccount.mockRejectedValue(new Error('Account load failed'));

      await expect(service.loadAccount()).rejects.toThrow('Account load failed');
    });
  });

  describe('loadProjectData', () => {
    it('should load project data successfully', async () => {
      service.loadProjectData.mockResolvedValue(mockProjects);

      const result = await service.loadProjectData();

      expect(service.loadProjectData).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockProjects);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Project');
    });

    it('should return empty array when no projects exist', async () => {
      service.loadProjectData.mockResolvedValue([]);

      const result = await service.loadProjectData();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle multiple projects', async () => {
      const multipleProjects = [
        mockProjects[0],
        {
          id: 'project-456',
          name: 'Second Project',
          description: 'Another project',
          color: '#00FF00',
          order_index: 1,
          is_archived: false,
          created_at: new Date(),
          updated_at: new Date(),
          task_lists: []
        }
      ];
      service.loadProjectData.mockResolvedValue(multipleProjects);

      const result = await service.loadProjectData();

      expect(result).toHaveLength(2);
      expect(result[1].name).toBe('Second Project');
    });

    it('should handle projects with task lists', async () => {
      const projectWithLists = {
        ...mockProjects[0],
        task_lists: [
          {
            id: 'list-1',
            project_id: 'project-123',
            name: 'To Do',
            order_index: 0,
            is_archived: false,
            created_at: new Date(),
            updated_at: new Date(),
            tasks: []
          }
        ]
      };
      service.loadProjectData.mockResolvedValue([projectWithLists]);

      const result = await service.loadProjectData();

      expect(result[0].task_lists).toHaveLength(1);
      expect(result[0].task_lists[0].name).toBe('To Do');
    });

    it('should handle archived projects', async () => {
      const archivedProject = {
        ...mockProjects[0],
        is_archived: true
      };
      service.loadProjectData.mockResolvedValue([archivedProject]);

      const result = await service.loadProjectData();

      expect(result[0].is_archived).toBe(true);
    });

    it('should handle load project data failure', async () => {
      service.loadProjectData.mockRejectedValue(new Error('Project data load failed'));

      await expect(service.loadProjectData()).rejects.toThrow('Project data load failed');
    });
  });

  describe('initializeAll', () => {
    it('should initialize all data successfully', async () => {
      service.initializeAll.mockResolvedValue(mockInitResult);

      const result = await service.initializeAll();

      expect(service.initializeAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockInitResult);
      expect(result.localSettings).toEqual(mockLocalSettings);
      expect(result.account).toEqual(mockAccount);
      expect(result.projects).toEqual(mockProjects);
    });

    it('should handle initialization with null account', async () => {
      const initResultWithNullAccount = {
        ...mockInitResult,
        account: null
      };
      service.initializeAll.mockResolvedValue(initResultWithNullAccount);

      const result = await service.initializeAll();

      expect(result.account).toBeNull();
      expect(result.localSettings).toEqual(mockLocalSettings);
      expect(result.projects).toEqual(mockProjects);
    });

    it('should handle initialization with empty projects', async () => {
      const initResultWithEmptyProjects = {
        ...mockInitResult,
        projects: []
      };
      service.initializeAll.mockResolvedValue(initResultWithEmptyProjects);

      const result = await service.initializeAll();

      expect(result.projects).toEqual([]);
      expect(result.localSettings).toEqual(mockLocalSettings);
      expect(result.account).toEqual(mockAccount);
    });

    it('should handle complex initialization scenario', async () => {
      const complexInitResult = {
        localSettings: {
          theme: 'system' as const,
          language: 'en',
          advancedFeatures: true,
          notifications: {
            email: true,
            push: false
          }
        },
        account: {
          id: 'account-complex',
          name: 'Complex User',
          email: 'complex@example.com',
          created_at: new Date(),
          updated_at: new Date()
        },
        projects: [
          {
            id: 'project-complex',
            name: 'Complex Project',
            description: 'A complex project with multiple lists',
            color: '#8A2BE2',
            order_index: 0,
            is_archived: false,
            created_at: new Date(),
            updated_at: new Date(),
            task_lists: [
              {
                id: 'list-1',
                project_id: 'project-complex',
                name: 'Backlog',
                order_index: 0,
                is_archived: false,
                created_at: new Date(),
                updated_at: new Date(),
                tasks: []
              }
            ]
          }
        ]
      };
      service.initializeAll.mockResolvedValue(complexInitResult);

      const result = await service.initializeAll();

      expect(result.localSettings.theme).toBe('system');
      expect(result.localSettings.advancedFeatures).toBe(true);
      expect(result.account?.name).toBe('Complex User');
      expect(result.projects[0].task_lists).toHaveLength(1);
    });

    it('should handle initialization failure', async () => {
      service.initializeAll.mockRejectedValue(new Error('Initialization failed'));

      await expect(service.initializeAll()).rejects.toThrow('Initialization failed');
    });

    it('should verify proper initialization order when called sequentially', async () => {
      // 最初の初期化
      service.initializeAll.mockResolvedValueOnce(mockInitResult);
      const firstResult = await service.initializeAll();
      
      // 2回目の初期化（再初期化のシナリオ）
      const updatedResult = {
        ...mockInitResult,
        localSettings: { ...mockLocalSettings, theme: 'light' as const }
      };
      service.initializeAll.mockResolvedValueOnce(updatedResult);
      const secondResult = await service.initializeAll();

      expect(service.initializeAll).toHaveBeenCalledTimes(2);
      expect(firstResult.localSettings.theme).toBe('dark');
      expect(secondResult.localSettings.theme).toBe('light');
    });
  });

  describe('interface contract compliance', () => {
    it('should implement all required methods', () => {
      expect(typeof service.loadLocalSettings).toBe('function');
      expect(typeof service.loadAccount).toBe('function');
      expect(typeof service.loadProjectData).toBe('function');
      expect(typeof service.initializeAll).toBe('function');
    });

    it('should return proper Promise types', async () => {
      service.loadLocalSettings.mockResolvedValue(mockLocalSettings);
      service.loadAccount.mockResolvedValue(mockAccount);
      service.loadProjectData.mockResolvedValue(mockProjects);
      service.initializeAll.mockResolvedValue(mockInitResult);

      const settingsPromise = service.loadLocalSettings();
      const accountPromise = service.loadAccount();
      const projectsPromise = service.loadProjectData();
      const allPromise = service.initializeAll();

      expect(settingsPromise).toBeInstanceOf(Promise);
      expect(accountPromise).toBeInstanceOf(Promise);
      expect(projectsPromise).toBeInstanceOf(Promise);
      expect(allPromise).toBeInstanceOf(Promise);

      const [settings, account, projects, all] = await Promise.all([
        settingsPromise,
        accountPromise,
        projectsPromise,
        allPromise
      ]);

      expect(settings).toEqual(mockLocalSettings);
      expect(account).toEqual(mockAccount);
      expect(projects).toEqual(mockProjects);
      expect(all).toEqual(mockInitResult);
    });
  });
});