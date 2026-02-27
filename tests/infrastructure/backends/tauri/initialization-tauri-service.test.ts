import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { InitializationTauriService } from '$lib/infrastructure/backends/tauri/initialization-tauri-service';
import type { LocalSettings, Account } from '$lib/infrastructure/backends/initialization-service';
import type { ProjectTree } from '$lib/types/project';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}));

const mockInvoke = vi.mocked(await import('@tauri-apps/api/core')).invoke;

describe('InitializationTauriService', () => {
  let service: InitializationTauriService;
  let mockLocalSettings: LocalSettings;
  let mockAccount: Account;
  let mockProjects: ProjectTree[];
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

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

    vi.clearAllMocks();
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('loadLocalSettings', () => {
    it('should load and merge local settings successfully', async () => {
      mockInvoke.mockResolvedValue(mockLocalSettings);

      const result = await service.loadLocalSettings();

      expect(mockInvoke).toHaveBeenCalledWith('load_local_settings');
      expect(result).toEqual(mockLocalSettings);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should use default language when language is missing', async () => {
      mockInvoke.mockResolvedValue({ theme: 'dark' });

      const result = await service.loadLocalSettings();

      expect(result).toEqual({
        theme: 'dark',
        language: 'ja'
      });
    });

    it('should normalize invalid theme to system', async () => {
      mockInvoke.mockResolvedValue({ theme: 'invalid', language: 'en' });

      const result = await service.loadLocalSettings();

      expect(result).toEqual({
        theme: 'system',
        language: 'en'
      });
    });

    it('should normalize empty language to default language', async () => {
      mockInvoke.mockResolvedValue({ theme: 'light', language: '' });

      const result = await service.loadLocalSettings();

      expect(result).toEqual({
        theme: 'light',
        language: 'ja'
      });
    });

    it('should return default settings when invoke fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Failed to load local settings'));

      const result = await service.loadLocalSettings();

      expect(result).toEqual({
        theme: 'system',
        language: 'ja'
      });
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to load local settings:',
        expect.any(Error)
      );
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
      expect(consoleWarnSpy).toHaveBeenCalledWith('Failed to load account:', expect.any(Error));
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

      const result = await service.loadProjectData();

      expect(mockInvoke).toHaveBeenCalledWith('load_all_project_data');
      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to load project data:',
        expect.any(Error)
      );
    });

    it('should hydrate date strings in project data', async () => {
      const projectsWithDateStrings = [
        {
          ...mockProjects[0],
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      ];
      mockInvoke.mockResolvedValue(projectsWithDateStrings);

      const result = await service.loadProjectData();

      expect(result[0].createdAt).toBeInstanceOf(Date);
      expect(result[0].updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('initializeAll', () => {
    it('should initialize all data successfully', async () => {
      mockInvoke
        .mockResolvedValueOnce(mockLocalSettings)
        .mockResolvedValueOnce(mockAccount)
        .mockResolvedValueOnce(mockProjects);

      const result = await service.initializeAll();

      expect(mockInvoke).toHaveBeenCalledTimes(3);
      expect(mockInvoke).toHaveBeenNthCalledWith(1, 'load_local_settings');
      expect(mockInvoke).toHaveBeenNthCalledWith(2, 'load_current_account');
      expect(mockInvoke).toHaveBeenNthCalledWith(3, 'load_all_project_data');

      expect(result).toEqual({
        localSettings: mockLocalSettings,
        account: mockAccount,
        projects: mockProjects
      });
    });

    it('should handle initialization with null account', async () => {
      mockInvoke
        .mockResolvedValueOnce(mockLocalSettings)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockProjects);

      const result = await service.initializeAll();

      expect(result.localSettings).toEqual(mockLocalSettings);
      expect(result.account).toBeNull();
      expect(result.projects).toEqual(mockProjects);
    });

    it('should handle initialization with empty projects', async () => {
      mockInvoke
        .mockResolvedValueOnce(mockLocalSettings)
        .mockResolvedValueOnce(mockAccount)
        .mockResolvedValueOnce([]);

      const result = await service.initializeAll();

      expect(result.localSettings).toEqual(mockLocalSettings);
      expect(result.account).toEqual(mockAccount);
      expect(result.projects).toEqual([]);
    });

    it('should handle project loading failure gracefully', async () => {
      mockInvoke
        .mockResolvedValueOnce(mockLocalSettings)
        .mockResolvedValueOnce(mockAccount)
        .mockRejectedValueOnce(new Error('Projects failed'));

      const result = await service.initializeAll();

      expect(result.localSettings).toEqual(mockLocalSettings);
      expect(result.account).toEqual(mockAccount);
      expect(result.projects).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load project data:', expect.any(Error));
    });

    it('should handle all operations failing', async () => {
      mockInvoke
        .mockRejectedValueOnce(new Error('Settings failed'))
        .mockRejectedValueOnce(new Error('Account failed'))
        .mockRejectedValueOnce(new Error('Projects failed'));

      const result = await service.initializeAll();

      expect(result.localSettings).toEqual({
        theme: 'system',
        language: 'ja'
      });
      expect(result.account).toBeNull();
      expect(result.projects).toEqual([]);
      expect(consoleWarnSpy).toHaveBeenCalledWith('Failed to load local settings:', expect.any(Error));
      expect(consoleWarnSpy).toHaveBeenCalledWith('Failed to load account:', expect.any(Error));
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load project data:', expect.any(Error));
    });

    it('should execute operations in correct sequence', async () => {
      const callOrder: string[] = [];

      mockInvoke.mockImplementation(async (command: string) => {
        callOrder.push(command);
        switch (command) {
          case 'load_local_settings':
            return mockLocalSettings;
          case 'load_current_account':
            return mockAccount;
          case 'load_all_project_data':
            return mockProjects;
          default:
            return null;
        }
      });

      await service.initializeAll();

      expect(callOrder).toEqual(['load_local_settings', 'load_current_account', 'load_all_project_data']);
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
      mockInvoke.mockResolvedValue({ theme: 'invalid-theme', language: 'ja' });

      const result = await service.loadLocalSettings();

      expect(result.theme).toBe('system');
    });

    it('should have proper default language', async () => {
      mockInvoke.mockResolvedValue({ theme: 'system', language: '' });

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
        .mockResolvedValueOnce('invalid_json_string')
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce('not_an_array');

      const result = await service.initializeAll();

      expect(result).toBeDefined();
    });

    it('should log appropriate error levels', async () => {
      mockInvoke
        .mockRejectedValueOnce(new Error('Settings error'))
        .mockRejectedValueOnce(new Error('Account error'))
        .mockRejectedValueOnce(new Error('Projects error'));

      await service.initializeAll();

      expect(consoleWarnSpy).toHaveBeenCalledTimes(2);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
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
      mockInvoke.mockImplementation(async (command: string) => {
        switch (command) {
          case 'load_local_settings':
            return mockLocalSettings;
          case 'load_current_account':
            return mockAccount;
          case 'load_all_project_data':
            return mockProjects;
          default:
            return null;
        }
      });

      const [result1, result2, result3] = await Promise.all([
        service.initializeAll(),
        service.initializeAll(),
        service.initializeAll()
      ]);

      expect(result1).toEqual(result2);
      expect(result2).toEqual(result3);
    });

    it('should handle mixed concurrent operations', async () => {
      mockInvoke.mockImplementation(async (command: string) => {
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 10));

        switch (command) {
          case 'load_local_settings':
            return mockLocalSettings;
          case 'load_current_account':
            return mockAccount;
          case 'load_all_project_data':
            return mockProjects;
          default:
            return null;
        }
      });

      const [settings, account, projects, initResult] = await Promise.all([
        service.loadLocalSettings(),
        service.loadAccount(),
        service.loadProjectData(),
        service.initializeAll()
      ]);

      expect(settings).toEqual(mockLocalSettings);
      expect(account).toEqual(mockAccount);
      expect(projects).toEqual(mockProjects);
      expect(initResult.localSettings).toEqual(mockLocalSettings);
      expect(initResult.account).toEqual(mockAccount);
      expect(initResult.projects).toEqual(mockProjects);
    });
  });
});
