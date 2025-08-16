import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InitializationWebService } from '$lib/services/backend/web/initialization-web-service';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

// Mock sample data generator
vi.mock('$lib/data/sample-data', () => ({
  generateSampleData: vi.fn(() => [
    {
      id: 'sample-project-1',
      name: 'Sample Project',
      task_lists: [],
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01')
    }
  ])
}));

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('InitializationWebService', () => {
  let service: InitializationWebService;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    service = new InitializationWebService();
    consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('loadLocalSettings', () => {
    it('should return default settings and log warning when localStorage is empty', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = await service.loadLocalSettings();

      expect(result).toEqual({
        theme: 'system',
        language: 'ja'
      });
      expect(consoleSpy).toHaveBeenCalledWith('Web backend: loadLocalSettings - localStorage-based implementation (not fully implemented)');
    });

    it('should merge saved settings with defaults', async () => {
      const savedSettings = JSON.stringify({ theme: 'dark', customOption: true });
      localStorageMock.getItem.mockReturnValue(savedSettings);

      const result = await service.loadLocalSettings();

      expect(result).toEqual({
        theme: 'dark',
        language: 'ja',
        customOption: true
      });
    });

    it('should handle JSON parse errors gracefully', async () => {
      localStorageMock.getItem.mockReturnValue('invalid-json');

      const result = await service.loadLocalSettings();

      expect(result).toEqual({
        theme: 'system',
        language: 'ja'
      });
    });
  });

  describe('loadAccount', () => {
    it('should create and return default account when localStorage is empty', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = await service.loadAccount();

      expect(result).toEqual({
        id: 'web-user-1',
        name: 'Web Demo User',
        email: 'demo@example.com',
        created_at: expect.any(Date),
        updated_at: expect.any(Date)
      });
      expect(localStorageMock.setItem).toHaveBeenCalledWith('flequit_account', expect.any(String));
      expect(consoleSpy).toHaveBeenCalledWith('Web backend: loadAccount - localStorage-based mock implementation (not fully implemented)');
    });

    it('should return saved account from localStorage', async () => {
      const savedAccount = {
        id: 'saved-user',
        name: 'Saved User',
        email: 'saved@example.com',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedAccount));

      const result = await service.loadAccount();

      expect(result).toEqual({
        id: 'saved-user',
        name: 'Saved User',
        email: 'saved@example.com',
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-01T00:00:00Z')
      });
    });

    it('should handle errors gracefully', async () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const result = await service.loadAccount();

      expect(result).toBeNull();
    });
  });

  describe('loadProjectData', () => {
    it('should return sample data and save to localStorage when empty', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = await service.loadProjectData();

      expect(result).toEqual([
        {
          id: 'sample-project-1',
          name: 'Sample Project',
          task_lists: [],
          created_at: expect.any(Date),
          updated_at: expect.any(Date)
        }
      ]);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('flequit_projects', expect.any(String));
      expect(consoleSpy).toHaveBeenCalledWith('Web backend: loadProjectData - localStorage with sample data (not fully implemented)');
    });

    it('should return sample data when localStorage throws error', async () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const result = await service.loadProjectData();

      expect(result).toEqual([
        expect.objectContaining({
          id: 'sample-project-1',
          name: 'Sample Project'
        })
      ]);
    });
  });

  describe('initializeAll', () => {
    it('should initialize all components and log warning', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = await service.initializeAll();

      expect(result).toEqual({
        localSettings: {
          theme: 'system',
          language: 'ja'
        },
        account: {
          id: 'web-user-1',
          name: 'Web Demo User',
          email: 'demo@example.com',
          created_at: expect.any(Date),
          updated_at: expect.any(Date)
        },
        projects: expect.any(Array)
      });
      expect(consoleSpy).toHaveBeenCalledWith('Web backend: initializeAll - combined initialization with localStorage (not fully implemented)');
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
      localStorageMock.getItem.mockReturnValue(null);

      const [settings, account, projects, initResult] = await Promise.all([
        service.loadLocalSettings(),
        service.loadAccount(),
        service.loadProjectData(),
        service.initializeAll()
      ]);

      expect(settings).toBeDefined();
      expect(account).toBeDefined();
      expect(projects).toBeDefined();
      expect(initResult).toBeDefined();
    });
  });

  describe('localStorage interaction', () => {
    it('should call localStorage.getItem for each method', async () => {
      await service.loadLocalSettings();
      await service.loadAccount();
      await service.loadProjectData();

      expect(localStorageMock.getItem).toHaveBeenCalledWith('flequit_local_settings');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('flequit_account');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('flequit_projects');
    });

    it('should handle localStorage unavailability gracefully', async () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });

      const result = await service.initializeAll();

      expect(result).toBeDefined();
      expect(result.localSettings).toEqual({
        theme: 'system',
        language: 'ja'
      });
    });
  });
});