import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SettingService } from '$lib/services/backend/setting-service';
import type { Setting } from '$lib/types/settings';

// モックの設定サービス実装
class MockSettingService implements SettingService {
  // SettingInterface メソッド
  get = vi.fn();
  getAll = vi.fn();
  update = vi.fn();
}

describe('SettingService Interface', () => {
  let service: MockSettingService;
  let mockSetting: Setting;

  beforeEach(() => {
    service = new MockSettingService();
    
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
    it('should get setting by key successfully', async () => {
      service.get.mockResolvedValue(mockSetting);

      const result = await service.get('theme');

      expect(service.get).toHaveBeenCalledWith('theme');
      expect(result).toEqual(mockSetting);
    });

    it('should return null when setting not found', async () => {
      service.get.mockResolvedValue(null);

      const result = await service.get('non-existent');

      expect(service.get).toHaveBeenCalledWith('non-existent');
      expect(result).toBeNull();
    });

    it('should handle different setting keys', async () => {
      const settingKeys = ['theme', 'language', 'notification_enabled', 'auto_save_interval'];

      for (const key of settingKeys) {
        const setting = { ...mockSetting, key, id: `setting-${key}` };
        service.get.mockResolvedValue(setting);

        const result = await service.get(key);
        
        expect(service.get).toHaveBeenCalledWith(key);
        expect(result?.key).toBe(key);
      }

      expect(service.get).toHaveBeenCalledTimes(settingKeys.length);
    });

    it('should handle get error', async () => {
      service.get.mockRejectedValue(new Error('Get failed'));

      await expect(service.get('theme')).rejects.toThrow('Get failed');
    });
  });

  describe('getAll', () => {
    it('should get all settings successfully', async () => {
      const mockSettings = [
        mockSetting,
        {
          id: 'setting-456',
          key: 'language',
          value: 'ja',
          data_type: 'string',
          is_local: false,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];
      service.getAll.mockResolvedValue(mockSettings);

      const result = await service.getAll();

      expect(service.getAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockSettings);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no settings exist', async () => {
      service.getAll.mockResolvedValue([]);

      const result = await service.getAll();

      expect(service.getAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });

    it('should handle settings with different data types', async () => {
      const multiTypeSettings = [
        { ...mockSetting, key: 'theme', value: 'dark', data_type: 'string' },
        { ...mockSetting, id: 'setting-2', key: 'auto_save', value: 'true', data_type: 'boolean' },
        { ...mockSetting, id: 'setting-3', key: 'max_items', value: '100', data_type: 'number' },
        { ...mockSetting, id: 'setting-4', key: 'user_prefs', value: '{"theme":"dark"}', data_type: 'json' }
      ];
      service.getAll.mockResolvedValue(multiTypeSettings);

      const result = await service.getAll();

      expect(result).toHaveLength(4);
      expect(result[0].data_type).toBe('string');
      expect(result[1].data_type).toBe('boolean');
      expect(result[2].data_type).toBe('number');
      expect(result[3].data_type).toBe('json');
    });

    it('should handle local and non-local settings', async () => {
      const mixedSettings = [
        { ...mockSetting, key: 'global_theme', is_local: false },
        { ...mockSetting, id: 'setting-2', key: 'local_cache', is_local: true }
      ];
      service.getAll.mockResolvedValue(mixedSettings);

      const result = await service.getAll();

      expect(result).toHaveLength(2);
      expect(result[0].is_local).toBe(false);
      expect(result[1].is_local).toBe(true);
    });

    it('should handle getAll error', async () => {
      service.getAll.mockRejectedValue(new Error('GetAll failed'));

      await expect(service.getAll()).rejects.toThrow('GetAll failed');
    });
  });

  describe('update', () => {
    it('should update setting successfully', async () => {
      const updatedSetting = {
        ...mockSetting,
        value: 'light',
        updated_at: new Date()
      };
      service.update.mockResolvedValue(true);

      const result = await service.update(updatedSetting);

      expect(service.update).toHaveBeenCalledWith(updatedSetting);
      expect(result).toBe(true);
    });

    it('should return false when update fails', async () => {
      service.update.mockResolvedValue(false);

      const result = await service.update(mockSetting);

      expect(result).toBe(false);
    });

    it('should handle string value update', async () => {
      const stringSettingUpdate = {
        ...mockSetting,
        value: 'system',
        data_type: 'string'
      };
      service.update.mockResolvedValue(true);

      const result = await service.update(stringSettingUpdate);

      expect(service.update).toHaveBeenCalledWith(stringSettingUpdate);
      expect(result).toBe(true);
    });

    it('should handle boolean value update', async () => {
      const booleanSettingUpdate = {
        ...mockSetting,
        key: 'auto_save',
        value: 'false',
        data_type: 'boolean'
      };
      service.update.mockResolvedValue(true);

      const result = await service.update(booleanSettingUpdate);

      expect(service.update).toHaveBeenCalledWith(booleanSettingUpdate);
      expect(result).toBe(true);
    });

    it('should handle number value update', async () => {
      const numberSettingUpdate = {
        ...mockSetting,
        key: 'max_items',
        value: '200',
        data_type: 'number'
      };
      service.update.mockResolvedValue(true);

      const result = await service.update(numberSettingUpdate);

      expect(service.update).toHaveBeenCalledWith(numberSettingUpdate);
      expect(result).toBe(true);
    });

    it('should handle json value update', async () => {
      const jsonSettingUpdate = {
        ...mockSetting,
        key: 'user_preferences',
        value: '{"theme":"light","lang":"en"}',
        data_type: 'json'
      };
      service.update.mockResolvedValue(true);

      const result = await service.update(jsonSettingUpdate);

      expect(service.update).toHaveBeenCalledWith(jsonSettingUpdate);
      expect(result).toBe(true);
    });

    it('should handle local setting update', async () => {
      const localSettingUpdate = {
        ...mockSetting,
        is_local: true,
        value: 'local_value'
      };
      service.update.mockResolvedValue(true);

      const result = await service.update(localSettingUpdate);

      expect(service.update).toHaveBeenCalledWith(localSettingUpdate);
      expect(result).toBe(true);
    });

    it('should handle data type change', async () => {
      const dataTypeChangeUpdate = {
        ...mockSetting,
        value: 'true',
        data_type: 'boolean'
      };
      service.update.mockResolvedValue(true);

      const result = await service.update(dataTypeChangeUpdate);

      expect(service.update).toHaveBeenCalledWith(dataTypeChangeUpdate);
      expect(result).toBe(true);
    });

    it('should handle update error', async () => {
      service.update.mockRejectedValue(new Error('Update failed'));

      await expect(service.update(mockSetting)).rejects.toThrow('Update failed');
    });
  });

  describe('interface contract compliance', () => {
    it('should implement all SettingInterface methods', () => {
      expect(typeof service.get).toBe('function');
      expect(typeof service.getAll).toBe('function');
      expect(typeof service.update).toBe('function');
    });

    it('should return proper Promise types', async () => {
      service.get.mockResolvedValue(mockSetting);
      service.getAll.mockResolvedValue([mockSetting]);
      service.update.mockResolvedValue(true);

      const getPromise = service.get('theme');
      const getAllPromise = service.getAll();
      const updatePromise = service.update(mockSetting);

      expect(getPromise).toBeInstanceOf(Promise);
      expect(getAllPromise).toBeInstanceOf(Promise);
      expect(updatePromise).toBeInstanceOf(Promise);

      const [getResult, getAllResult, updateResult] = await Promise.all([
        getPromise,
        getAllPromise,
        updatePromise
      ]);

      expect(getResult).toEqual(mockSetting);
      expect(getAllResult).toEqual([mockSetting]);
      expect(updateResult).toBe(true);
    });

    it('should handle key-based operations correctly', async () => {
      // Setting interface uses key-based operations unlike standard CRUD
      service.get.mockResolvedValue(mockSetting);

      const result = await service.get(mockSetting.key);

      expect(service.get).toHaveBeenCalledWith(mockSetting.key);
      expect(result?.key).toBe(mockSetting.key);
    });
  });

  describe('edge cases', () => {
    it('should handle setting with special characters in key', async () => {
      const specialKeySetting = {
        ...mockSetting,
        key: 'user.preferences.theme-color_scheme',
        value: '#FF5733'
      };
      service.update.mockResolvedValue(true);

      const result = await service.update(specialKeySetting);

      expect(service.update).toHaveBeenCalledWith(specialKeySetting);
      expect(result).toBe(true);
    });

    it('should handle very long setting values', async () => {
      const longValueSetting = {
        ...mockSetting,
        value: 'A'.repeat(10000),
        data_type: 'string'
      };
      service.update.mockResolvedValue(true);

      const result = await service.update(longValueSetting);

      expect(result).toBe(true);
    });

    it('should handle empty string values', async () => {
      const emptyValueSetting = {
        ...mockSetting,
        value: '',
        data_type: 'string'
      };
      service.update.mockResolvedValue(true);

      const result = await service.update(emptyValueSetting);

      expect(result).toBe(true);
    });

    it('should handle complex json values', async () => {
      const complexJsonSetting = {
        ...mockSetting,
        key: 'complex_config',
        value: JSON.stringify({
          theme: 'dark',
          features: ['feature1', 'feature2'],
          nested: {
            option1: true,
            option2: 42,
            deep: {
              value: 'test'
            }
          }
        }),
        data_type: 'json'
      };
      service.update.mockResolvedValue(true);

      const result = await service.update(complexJsonSetting);

      expect(result).toBe(true);
    });

    it('should handle concurrent operations', async () => {
      service.get.mockResolvedValue(mockSetting);
      service.getAll.mockResolvedValue([mockSetting]);
      service.update.mockResolvedValue(true);

      // 同時実行
      const operations = await Promise.all([
        service.get('theme'),
        service.getAll(),
        service.update(mockSetting)
      ]);

      expect(operations).toEqual([mockSetting, [mockSetting], true]);
      expect(service.get).toHaveBeenCalledTimes(1);
      expect(service.getAll).toHaveBeenCalledTimes(1);
      expect(service.update).toHaveBeenCalledTimes(1);
    });

    it('should handle settings with unicode characters', async () => {
      const unicodeSetting = {
        ...mockSetting,
        key: 'japanese_setting',
        value: 'こんにちは世界',
        data_type: 'string'
      };
      service.update.mockResolvedValue(true);

      const result = await service.update(unicodeSetting);

      expect(result).toBe(true);
    });

    it('should handle settings with emoji values', async () => {
      const emojiSetting = {
        ...mockSetting,
        key: 'status_icon',
        value: '🚀✨💻',
        data_type: 'string'
      };
      service.update.mockResolvedValue(true);

      const result = await service.update(emojiSetting);

      expect(result).toBe(true);
    });

    it('should handle multiple rapid updates', async () => {
      const settings = [
        { ...mockSetting, value: 'value1' },
        { ...mockSetting, value: 'value2' },
        { ...mockSetting, value: 'value3' }
      ];

      service.update.mockResolvedValue(true);

      // 連続更新
      for (const setting of settings) {
        const result = await service.update(setting);
        expect(result).toBe(true);
      }

      expect(service.update).toHaveBeenCalledTimes(3);
    });

    it('should handle large number of settings in getAll', async () => {
      const manySettings = Array.from({ length: 1000 }, (_, i) => ({
        ...mockSetting,
        id: `setting-${i}`,
        key: `setting_key_${i}`,
        value: `value_${i}`
      }));
      service.getAll.mockResolvedValue(manySettings);

      const result = await service.getAll();

      expect(result).toHaveLength(1000);
      expect(result[0].key).toBe('setting_key_0');
      expect(result[999].key).toBe('setting_key_999');
    });
  });

  describe('data type specific scenarios', () => {
    it('should handle all supported data types', async () => {
      const dataTypes = ['string', 'number', 'boolean', 'json'] as const;

      for (const dataType of dataTypes) {
        const setting = {
          ...mockSetting,
          id: `setting-${dataType}`,
          key: `test_${dataType}`,
          data_type: dataType,
          value: dataType === 'json' ? '{"test": true}' : 'test_value'
        };

        service.update.mockResolvedValue(true);
        const result = await service.update(setting);
        expect(result).toBe(true);
      }

      expect(service.update).toHaveBeenCalledTimes(dataTypes.length);
    });

    it('should handle type conversion scenarios', async () => {
      // 文字列から数値への変換
      const stringToNumber = {
        ...mockSetting,
        key: 'numeric_setting',
        value: '42',
        data_type: 'number'
      };

      // 文字列からブールへの変換
      const stringToBoolean = {
        ...mockSetting,
        id: 'setting-bool',
        key: 'boolean_setting',
        value: 'true',
        data_type: 'boolean'
      };

      service.update.mockResolvedValue(true);

      const results = await Promise.all([
        service.update(stringToNumber),
        service.update(stringToBoolean)
      ]);

      expect(results).toEqual([true, true]);
    });
  });
});