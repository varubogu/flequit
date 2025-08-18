import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SettingTauriService } from '$lib/services/backend/tauri/setting-tauri-service';
import type { Setting } from '$lib/types/settings';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}));

// Get the mocked invoke for use in tests
const mockInvoke = vi.mocked(await import('@tauri-apps/api/core')).invoke;

describe('SettingTauriService', () => {
  let service: SettingTauriService;
  let mockSetting: Setting;

  beforeEach(() => {
    service = new SettingTauriService();
    mockSetting = {
      id: 'setting-123',
      key: 'theme',
      value: 'dark',
      data_type: 'string',
      created_at: new Date('2024-01-01T00:00:00Z'),
      updated_at: new Date('2024-01-01T00:00:00Z')
    };
    vi.clearAllMocks();
  });

  describe('get', () => {
    it('should successfully retrieve a setting by key', async () => {
      mockInvoke.mockResolvedValue(mockSetting);

      const result = await service.get('theme');

      expect(mockInvoke).toHaveBeenCalledWith('get_setting', { key: 'theme' });
      expect(result).toEqual(mockSetting);
    });

    it('should return null when setting not found', async () => {
      mockInvoke.mockResolvedValue(null);

      const result = await service.get('non-existent');

      expect(mockInvoke).toHaveBeenCalledWith('get_setting', { key: 'non-existent' });
      expect(result).toBeNull();
    });

    it('should return null when retrieval fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Database error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.get('theme');

      expect(mockInvoke).toHaveBeenCalledWith('get_setting', { key: 'theme' });
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get setting:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should handle different data types', async () => {
      const booleanSetting = {
        ...mockSetting,
        key: 'notifications_enabled',
        value: 'true',
        data_type: 'boolean' as const
      };
      mockInvoke.mockResolvedValue(booleanSetting);

      const result = await service.get('notifications_enabled');

      expect(result?.data_type).toBe('boolean');
      expect(result?.value).toBe('true');
    });
  });

  describe('getAll', () => {
    it('should successfully retrieve all settings', async () => {
      const mockSettings = [
        mockSetting,
        {
          id: 'setting-456',
          key: 'language',
          value: 'en',
          data_type: 'string' as const,
          created_at: new Date('2024-01-01T00:00:00Z'),
          updated_at: new Date('2024-01-01T00:00:00Z')
        }
      ];
      mockInvoke.mockResolvedValue(mockSettings);

      const result = await service.getAll();

      expect(mockInvoke).toHaveBeenCalledWith('get_all_settings');
      expect(result).toEqual(mockSettings);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no settings found', async () => {
      mockInvoke.mockResolvedValue([]);

      const result = await service.getAll();

      expect(mockInvoke).toHaveBeenCalledWith('get_all_settings');
      expect(result).toEqual([]);
    });

    it('should return empty array when retrieval fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Database error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.getAll();

      expect(mockInvoke).toHaveBeenCalledWith('get_all_settings');
      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get all settings:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('update', () => {
    it('should successfully update a setting', async () => {
      mockInvoke.mockResolvedValue(undefined);

      const result = await service.update(mockSetting);

      expect(mockInvoke).toHaveBeenCalledWith('update_setting', { key: mockSetting.key, value: mockSetting.value });
      expect(result).toBe(true);
    });

    it('should return false when update fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Update failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.update(mockSetting);

      expect(mockInvoke).toHaveBeenCalledWith('update_setting', { key: mockSetting.key, value: mockSetting.value });
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to update setting:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should handle different data types for update', async () => {
      mockInvoke.mockResolvedValue(undefined);
      
      const numberSetting = {
        ...mockSetting,
        key: 'font_size',
        value: '14',
        data_type: 'number' as const
      };

      const result = await service.update(numberSetting);

      expect(mockInvoke).toHaveBeenCalledWith('update_setting', { key: numberSetting.key, value: numberSetting.value });
      expect(result).toBe(true);
    });

    it('should handle JSON data type', async () => {
      mockInvoke.mockResolvedValue(undefined);
      
      const jsonSetting = {
        ...mockSetting,
        key: 'custom_config',
        value: '{"theme": "dark", "notifications": true}',
        data_type: 'json' as const
      };

      const result = await service.update(jsonSetting);

      expect(mockInvoke).toHaveBeenCalledWith('update_setting', { key: jsonSetting.key, value: jsonSetting.value });
      expect(result).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string key', async () => {
      mockInvoke.mockResolvedValue(null);

      const result = await service.get('');

      expect(mockInvoke).toHaveBeenCalledWith('get_setting', { key: '' });
      expect(result).toBeNull();
    });

    it('should handle special characters in key', async () => {
      const specialKeySetting = {
        ...mockSetting,
        key: 'user.preferences.ui-theme'
      };
      mockInvoke.mockResolvedValue(specialKeySetting);

      const result = await service.get('user.preferences.ui-theme');

      expect(mockInvoke).toHaveBeenCalledWith('get_setting', { key: 'user.preferences.ui-theme' });
      expect(result).toEqual(specialKeySetting);
    });

    it('should handle update with minimal setting data', async () => {
      mockInvoke.mockResolvedValue(undefined);
      
      const minimalSetting = {
        id: 'minimal-setting',
        key: 'test',
        value: 'value',
        data_type: 'string' as const,
        created_at: new Date(),
        updated_at: new Date()
      };

      const result = await service.update(minimalSetting);

      expect(result).toBe(true);
    });
  });
});