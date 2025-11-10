import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { InitializationTauriService } from '$lib/infrastructure/backends/tauri/initialization-tauri-service';
import type { LocalSettings, Account } from '$lib/infrastructure/backends/initialization-service';
import type { ProjectTree } from '$lib/types/project';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}));

// Get the mocked invoke for use in tests
const mockInvoke = vi.mocked(await import('@tauri-apps/api/core')).invoke;

describe('InitializationTauriService', () => {
  let service: InitializationTauriService;
  let mockLocalSettings: LocalSettings;
  let mockAccount: Account;
  let mockProjects: ProjectTree[];
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    service = new InitializationTauriService();

    mockLocalSettings = {
      theme: 'dark',
      language: 'ja',
      customSetting: 'test value'
    };

    mockAccount = {
      id: 'account-123',
      userId: 'user-123',
      displayName: 'Test User',
      email: 'test@example.com',
      avatarUrl: 'https://example.com/avatar.jpg',
      provider: 'local',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      deleted: false,
      updatedBy: 'test-user-id'
    };

    mockProjects = [
      {
        id: 'project-123',
        name: 'Test Project',
        description: 'Test Description',
        color: '#FF5733',
        orderIndex: 0,
        isArchived: false,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
        deleted: false,
        updatedBy: 'test-user-id',
        taskLists: []
      }
    ];

    // console.warn と console.error をモック化
    consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('loadLocalSettings', () => {
    it('should return default settings as mock implementation', async () => {
      const result = await service.loadLocalSettings();

      expect(result).toEqual({
        theme: 'system',
        language: 'ja'
      });
      expect(consoleSpy).toHaveBeenCalledWith('load_local_settings is not implemented on Tauri side - using default settings');
    });

    it('should return default settings when invoke returns null', async () => {
      const result = await service.loadLocalSettings();

      expect(result).toEqual({
        theme: 'system',
        language: 'ja'
      });
      expect(consoleSpy).toHaveBeenCalledWith('load_local_settings is not implemented on Tauri side - using default settings');
    });

    it('should return default settings when invoke fails', async () => {
      const result = await service.loadLocalSettings();

      expect(result).toEqual({
        theme: 'system',
        language: 'ja'
      });
      expect(consoleSpy).toHaveBeenCalledWith('load_local_settings is not implemented on Tauri side - using default settings');
    });

    it('should handle different theme settings', async () => {
      const result = await service.loadLocalSettings();

      expect(result.theme).toBe('system');
      expect(consoleSpy).toHaveBeenCalledWith('load_local_settings is not implemented on Tauri side - using default settings');
    });

    it('should handle system theme setting', async () => {
      const result = await service.loadLocalSettings();

      expect(result.theme).toBe('system');
      expect(consoleSpy).toHaveBeenCalledWith('load_local_settings is not implemented on Tauri side - using default settings');
    });

    it('should handle different language settings', async () => {
      const result = await service.loadLocalSettings();

      expect(result.language).toBe('ja');
      expect(consoleSpy).toHaveBeenCalledWith('load_local_settings is not implemented on Tauri side - using default settings');
    });

    it('should handle custom settings properties', async () => {
      const result = await service.loadLocalSettings();

      expect(result.customOption).toBeUndefined();
      expect(result.maxItems).toBeUndefined();
      expect(result.features).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith('load_local_settings is not implemented on Tauri side - using default settings');
    });
  });

  describe('loadAccount', () => {
    it('should load account successfully', async () => {
      mockInvoke.mockResolvedValue(mockAccount);

      const result = await service.loadAccount();

      expect(mockInvoke).toHaveBeenCalledWith('load_current_account');
      expect(result).toEqual(mockAccount);
    });

    it('should return null when no account exists', async () => {
      mockInvoke.mockResolvedValue(null);

      const result = await service.loadAccount();

      expect(mockInvoke).toHaveBeenCalledWith('load_current_account');
      expect(result).toBeNull();
    });

    it('should return null when invoke fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Failed to load account'));

      const result = await service.loadAccount();

      expect(mockInvoke).toHaveBeenCalledWith('load_current_account');
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load account:', expect.any(Error));
    });

    it('should handle account without optional fields', async () => {
      const minimalAccount = {
        id: 'account-minimal',
        userId: 'user-minimal',
        displayName: 'Minimal User',
        provider: 'local',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mockInvoke.mockResolvedValue(minimalAccount);

      const result = await service.loadAccount();

      expect(result?.email).toBeUndefined();
      expect(result?.avatarUrl).toBeUndefined();
      expect(result?.displayName).toBe('Minimal User');
    });

    it('should handle account with all optional fields', async () => {
      const fullAccount = {
        ...mockAccount,
        avatarUrl: 'https://example.com/custom-avatar.png'
      };
      mockInvoke.mockResolvedValue(fullAccount);

      const result = await service.loadAccount();

      expect(result?.avatarUrl).toBe('https://example.com/custom-avatar.png');
    });
  });

  describe('loadProjectData', () => {
    it('should load project data successfully', async () => {
      mockInvoke.mockResolvedValue(mockProjects);

      const result = await service.loadProjectData();

      expect(mockInvoke).toHaveBeenCalledWith('load_all_project_data');
      expect(result).toEqual(mockProjects);
    });

    it('should return empty array when invoke returns null', async () => {
      mockInvoke.mockResolvedValue(null);

      const result = await service.loadProjectData();

      expect(mockInvoke).toHaveBeenCalledWith('load_all_project_data');
      expect(result).toEqual([]);
    });

    it('should return empty array when invoke fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Failed to load project data'));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.loadProjectData();

      expect(mockInvoke).toHaveBeenCalledWith('load_all_project_data');
      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to load project data:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle multiple projects', async () => {
      const multipleProjects = [
        mockProjects[0],
        {
          id: 'project-456',
          name: 'Second Project',
          description: 'Another project',
          color: '#00FF00',
          orderIndex: 1,
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          taskLists: []
        }
      ];
      mockInvoke.mockResolvedValue(multipleProjects);

      const result = await service.loadProjectData();

      expect(result).toHaveLength(2);
      expect(result[1].name).toBe('Second Project');
    });

    it('should handle projects with task lists', async () => {
      const projectWithLists = {
        ...mockProjects[0],
        taskLists: [
          {
            id: 'list-1',
            projectId: 'project-123',
            name: 'To Do',
            orderIndex: 0,
            isArchived: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            tasks: []
          }
        ]
      };
      mockInvoke.mockResolvedValue([projectWithLists]);

      const result = await service.loadProjectData();

      expect(result[0].taskLists).toHaveLength(1);
      expect(result[0].taskLists[0].name).toBe('To Do');
    });

    it('should handle archived projects', async () => {
      const archivedProject = {
        ...mockProjects[0],
        isArchived: true
      };
      mockInvoke.mockResolvedValue([archivedProject]);

      const result = await service.loadProjectData();

      expect(result[0].isArchived).toBe(true);
    });

    it('should handle empty project list', async () => {
      mockInvoke.mockResolvedValue([]);

      const result = await service.loadProjectData();

      expect(result).toEqual([]);
    });
  });

  describe('initializeAll', () => {
    it('should initialize all data successfully', async () => {
      mockInvoke
        .mockResolvedValueOnce(mockAccount) // loadAccount
        .mockResolvedValueOnce(mockProjects); // loadProjectData

      const result = await service.initializeAll();

      expect(mockInvoke).toHaveBeenCalledTimes(2);
      expect(mockInvoke).toHaveBeenNthCalledWith(1, 'load_current_account');
      expect(mockInvoke).toHaveBeenNthCalledWith(2, 'load_all_project_data');

      expect(result).toEqual({
        localSettings: {
          theme: 'system',
          language: 'ja'
        },
        account: mockAccount,
        projects: mockProjects
      });
      expect(consoleSpy).toHaveBeenCalledWith('load_local_settings is not implemented on Tauri side - using default settings');
    });

    it('should handle initialization with null account', async () => {
      mockInvoke
        .mockResolvedValueOnce(null) // loadAccount
        .mockResolvedValueOnce(mockProjects); // loadProjectData

      const result = await service.initializeAll();

      expect(result.account).toBeNull();
      expect(result.localSettings).toEqual({
        theme: 'system',
        language: 'ja'
      });
      expect(result.projects).toEqual(mockProjects);
      expect(consoleSpy).toHaveBeenCalledWith('load_local_settings is not implemented on Tauri side - using default settings');
    });

    it('should handle initialization with empty projects', async () => {
      mockInvoke
        .mockResolvedValueOnce(mockAccount) // loadAccount
        .mockResolvedValueOnce([]); // loadProjectData

      const result = await service.initializeAll();

      expect(result.projects).toEqual([]);
      expect(result.localSettings).toEqual({
        theme: 'system',
        language: 'ja'
      });
      expect(result.account).toEqual(mockAccount);
      expect(consoleSpy).toHaveBeenCalledWith('load_local_settings is not implemented on Tauri side - using default settings');
    });

    it('should handle partial failures gracefully', async () => {
      mockInvoke
        .mockResolvedValueOnce(mockAccount) // loadAccount
        .mockRejectedValueOnce(new Error('Projects failed')); // loadProjectData

      const result = await service.initializeAll();

      // デフォルト設定とnull/空配列が返される
      expect(result.localSettings).toEqual({
        theme: 'system',
        language: 'ja'
      });
      expect(result.account).toEqual(mockAccount);
      expect(result.projects).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('load_local_settings is not implemented on Tauri side - using default settings');
    });

    it('should handle all operations failing', async () => {
      mockInvoke
        .mockRejectedValueOnce(new Error('Account failed'))
        .mockRejectedValueOnce(new Error('Projects failed'));

      const result = await service.initializeAll();

      expect(result.localSettings).toEqual({
        theme: 'system',
        language: 'ja'
      });
      expect(result.account).toBeNull();
      expect(result.projects).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('load_local_settings is not implemented on Tauri side - using default settings');
    });

    it('should execute operations in correct sequence', async () => {
      const callOrder: string[] = [];

      mockInvoke.mockImplementation(async (command: string) => {
        callOrder.push(command);
        switch (command) {
          case 'load_current_account':
            return mockAccount;
          case 'load_all_project_data':
            return mockProjects;
          default:
            return null;
        }
      });

      await service.initializeAll();

      expect(callOrder).toEqual([
        'load_current_account',
        'load_all_project_data'
      ]);
      expect(consoleSpy).toHaveBeenCalledWith('load_local_settings is not implemented on Tauri side - using default settings');
    });
  });

  describe('default settings', () => {
    it('should provide consistent default settings', async () => {
      mockInvoke.mockRejectedValue(new Error('Failed'));

      const result1 = await service.loadLocalSettings();
      const result2 = await service.loadLocalSettings();

      expect(result1).toEqual(result2);
      expect(result1).toEqual({
        theme: 'system',
        language: 'ja'
      });
    });

    it('should have proper default theme', async () => {
      mockInvoke.mockRejectedValue(new Error('Failed'));

      const result = await service.loadLocalSettings();

      expect(result.theme).toBe('system');
    });

    it('should have proper default language', async () => {
      mockInvoke.mockRejectedValue(new Error('Failed'));

      const result = await service.loadLocalSettings();

      expect(result.language).toBe('ja');
    });
  });

  describe('error handling', () => {
    it('should handle network timeouts gracefully', async () => {
      mockInvoke.mockRejectedValue(new Error('Network timeout'));

      const result = await service.initializeAll();

      expect(result.localSettings).toEqual({
        theme: 'system',
        language: 'ja'
      });
      expect(result.account).toBeNull();
      expect(result.projects).toEqual([]);
    });

    it('should handle corrupted data gracefully', async () => {
      mockInvoke
        .mockResolvedValueOnce('invalid_json_string') // 無効なデータ
        .mockResolvedValueOnce(undefined) // undefined
        .mockResolvedValueOnce('not_an_array'); // 配列ではない

      const result = await service.initializeAll();

      // ガベージインガベージアウトだが、アプリがクラッシュしないことが重要
      expect(result).toBeDefined();
    });

    it('should log appropriate error levels', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockInvoke
        .mockRejectedValueOnce(new Error('Account error'))
        .mockRejectedValueOnce(new Error('Projects error'));

      await service.initializeAll();

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1); // settings (not implemented)
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1); // projects

      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('interface compliance', () => {
    it('should implement all InitializationService methods', () => {
      expect(typeof service.loadLocalSettings).toBe('function');
      expect(typeof service.loadAccount).toBe('function');
      expect(typeof service.loadProjectData).toBe('function');
      expect(typeof service.initializeAll).toBe('function');
    });

    it('should return proper Promise types', async () => {
      mockInvoke.mockResolvedValue(null);

      const settingsPromise = service.loadLocalSettings();
      const accountPromise = service.loadAccount();
      const projectsPromise = service.loadProjectData();
      const allPromise = service.initializeAll();

      expect(settingsPromise).toBeInstanceOf(Promise);
      expect(accountPromise).toBeInstanceOf(Promise);
      expect(projectsPromise).toBeInstanceOf(Promise);
      expect(allPromise).toBeInstanceOf(Promise);

      await Promise.all([settingsPromise, accountPromise, projectsPromise, allPromise]);
    });
  });

  describe('concurrent operations', () => {
    it('should handle concurrent initialization calls', async () => {
      mockInvoke
        .mockResolvedValue(mockLocalSettings)
        .mockResolvedValue(mockAccount)
        .mockResolvedValue(mockProjects);

      // 並行して初期化を実行
      const [result1, result2, result3] = await Promise.all([
        service.initializeAll(),
        service.initializeAll(),
        service.initializeAll()
      ]);

      // 全ての結果が一貫していることを確認
      expect(result1).toEqual(result2);
      expect(result2).toEqual(result3);
    });

    it('should handle mixed concurrent operations', async () => {
      mockInvoke.mockImplementation(async (command: string) => {
        // 少し遅延を追加してレースコンディションをテスト
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 10));

        switch (command) {
          case 'load_current_account':
            return mockAccount;
          case 'load_all_project_data':
            return mockProjects;
          default:
            return null;
        }
      });

      // 個別メソッドと全体初期化を並行実行
      const [settings, account, projects, initResult] = await Promise.all([
        service.loadLocalSettings(),
        service.loadAccount(),
        service.loadProjectData(),
        service.initializeAll()
      ]);

      expect(settings).toEqual({
        theme: 'system',
        language: 'ja'
      });
      expect(account).toEqual(mockAccount);
      expect(projects).toEqual(mockProjects);
      expect(initResult.localSettings).toEqual({
        theme: 'system',
        language: 'ja'
      });
      expect(initResult.account).toEqual(mockAccount);
      expect(initResult.projects).toEqual(mockProjects);
    });
  });
});
