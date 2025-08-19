import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { Setting } from '$lib/types/settings';

// Mock backend service
const mockBackendService = {
  setting: {
    getAll: vi.fn()
  }
};

vi.mock('$lib/services/backend', () => ({
  getBackendService: vi.fn(() => Promise.resolve(mockBackendService))
}));

describe('SettingsInitService', () => {
  let service: typeof import('$lib/services/settings-init-service').settingsInitService;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  const mockSettings: Setting[] = [
    {
      id: 'setting_1',
      key: 'locale',
      value: 'en',
      data_type: 'string',
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01')
    },
    {
      id: 'setting_2',
      key: 'theme',
      value: 'dark',
      data_type: 'string',
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01')
    },
    {
      id: 'setting_3',
      key: 'sidebar_collapsed',
      value: 'true',
      data_type: 'boolean',
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01')
    },
    {
      id: 'setting_4',
      key: 'sidebar_width',
      value: '300',
      data_type: 'number',
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01')
    }
  ];

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Reset mock
    mockBackendService.setting.getAll.mockResolvedValue(mockSettings);
    
    // Setup console spies
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Import the singleton service
    const module = await import('$lib/services/settings-init-service');
    service = module.settingsInitService;
    
    // Clear cache before each test
    service.clearCache();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('singleton instance', () => {
    it('should be defined and have required methods', () => {
      expect(service).toBeDefined();
      expect(typeof service.getAllSettings).toBe('function');
      expect(typeof service.getSettingByKey).toBe('function');
      expect(typeof service.getSettingsByKeyPattern).toBe('function');
      expect(typeof service.clearCache).toBe('function');
    });
  });

  describe('getSettingByKey', () => {
    it('should find setting by key', () => {
      const result = service.getSettingByKey(mockSettings, 'locale');
      
      expect(result).toEqual(mockSettings[0]);
      expect(result?.key).toBe('locale');
      expect(result?.value).toBe('en');
    });

    it('should return undefined for non-existent key', () => {
      const result = service.getSettingByKey(mockSettings, 'non_existent');
      
      expect(result).toBeUndefined();
    });

    it('should handle empty settings array', () => {
      const result = service.getSettingByKey([], 'locale');
      
      expect(result).toBeUndefined();
    });

    it('should return first match for duplicate keys', () => {
      const settingsWithDuplicates = [
        ...mockSettings,
        {
          id: 'setting_5',
          key: 'locale',
          value: 'ja',
          data_type: 'string',
          created_at: new Date('2024-01-02'),
          updated_at: new Date('2024-01-02')
        }
      ];
      
      const result = service.getSettingByKey(settingsWithDuplicates, 'locale');
      
      expect(result?.value).toBe('en'); // First occurrence
    });
  });

  describe('getSettingsByKeyPattern', () => {
    it('should find settings by key pattern', () => {
      const result = service.getSettingsByKeyPattern(mockSettings, 'sidebar');
      
      expect(result).toHaveLength(2);
      expect(result[0]?.key).toBe('sidebar_collapsed');
      expect(result[1]?.key).toBe('sidebar_width');
    });

    it('should return empty array for non-matching pattern', () => {
      const result = service.getSettingsByKeyPattern(mockSettings, 'non_existent');
      
      expect(result).toEqual([]);
    });

    it('should handle empty settings array', () => {
      const result = service.getSettingsByKeyPattern([], 'sidebar');
      
      expect(result).toEqual([]);
    });

    it('should return all settings for empty pattern', () => {
      const result = service.getSettingsByKeyPattern(mockSettings, '');
      
      expect(result).toEqual(mockSettings);
    });

    it('should handle partial matches correctly', () => {
      const result = service.getSettingsByKeyPattern(mockSettings, 'loc');
      
      expect(result).toHaveLength(1);
      expect(result[0]?.key).toBe('locale');
    });
  });

  describe('getAllSettings basic functionality', () => {
    it('should call getAllSettings without throwing', async () => {
      await expect(service.getAllSettings()).resolves.not.toThrow();
    });

    it('should handle clearCache functionality', () => {
      expect(() => service.clearCache()).not.toThrow();
    });

    it('should handle backend errors gracefully', async () => {
      mockBackendService.setting.getAll.mockRejectedValueOnce(new Error('Backend error'));
      service.clearCache();
      
      const result = await service.getAllSettings();
      
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('data validation', () => {
    it('should handle various setting data types', () => {
      const stringResult = service.getSettingByKey(mockSettings, 'locale');
      expect(stringResult?.data_type).toBe('string');
      
      const booleanResult = service.getSettingByKey(mockSettings, 'sidebar_collapsed');
      expect(booleanResult?.data_type).toBe('boolean');
      
      const numberResult = service.getSettingByKey(mockSettings, 'sidebar_width');
      expect(numberResult?.data_type).toBe('number');
    });

    it('should maintain setting object structure', () => {
      const setting = service.getSettingByKey(mockSettings, 'locale');
      
      expect(setting).toHaveProperty('id');
      expect(setting).toHaveProperty('key');
      expect(setting).toHaveProperty('value');
      expect(setting).toHaveProperty('data_type');
      expect(setting).toHaveProperty('created_at');
      expect(setting).toHaveProperty('updated_at');
    });
  });

  describe('pattern matching edge cases', () => {
    it('should handle case sensitive pattern matching', () => {
      const result = service.getSettingsByKeyPattern(mockSettings, 'LOCALE');
      expect(result).toHaveLength(0);
    });

    it('should handle special characters in patterns', () => {
      const testSettings = [
        ...mockSettings,
        {
          id: 'setting_special',
          key: 'test.key-with_special',
          value: 'test',
          data_type: 'string',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];
      
      const result = service.getSettingsByKeyPattern(testSettings, 'test.');
      expect(result).toHaveLength(1);
    });

    it('should handle numeric patterns', () => {
      const testSettings = [
        {
          id: 'setting_num',
          key: '123numeric',
          value: 'test',
          data_type: 'string',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];
      
      const result = service.getSettingsByKeyPattern(testSettings, '123');
      expect(result).toHaveLength(1);
    });
  });

  describe('performance considerations', () => {
    it('should handle large settings arrays efficiently', () => {
      const largeSettings = Array.from({ length: 1000 }, (_, i) => ({
        id: `setting_${i}`,
        key: `key_${i}`,
        value: `value_${i}`,
        data_type: 'string',
        created_at: new Date(),
        updated_at: new Date()
      }));
      
      const start = performance.now();
      const result = service.getSettingByKey(largeSettings, 'key_500');
      const end = performance.now();
      
      expect(result?.key).toBe('key_500');
      expect(end - start).toBeLessThan(10); // Should be fast
    });

    it('should handle pattern matching on large arrays', () => {
      const largeSettings = Array.from({ length: 1000 }, (_, i) => ({
        id: `setting_${i}`,
        key: i % 2 === 0 ? `even_${i}` : `odd_${i}`,
        value: `value_${i}`,
        data_type: 'string',
        created_at: new Date(),
        updated_at: new Date()
      }));
      
      const start = performance.now();
      const result = service.getSettingsByKeyPattern(largeSettings, 'even_');
      const end = performance.now();
      
      expect(result).toHaveLength(500);
      expect(end - start).toBeLessThan(50); // Should be reasonably fast
    });
  });
});