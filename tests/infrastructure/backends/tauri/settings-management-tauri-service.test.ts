import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SettingsManagementTauriService } from '$lib/infrastructure/backends/tauri/settings-management-tauri-service';
import type { Settings, CustomDateFormat, TimeLabel, ViewItem } from '$lib/types/settings';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}));

// Get the mocked invoke for use in tests
const mockInvoke = vi.mocked(await import('@tauri-apps/api/core')).invoke;

describe('SettingsManagementTauriService', () => {
  let service: SettingsManagementTauriService;
  let mockSettings: Settings;
  let mockCustomDateFormat: CustomDateFormat;
  let mockTimeLabel: TimeLabel;
  let mockViewItem: ViewItem;

  beforeEach(() => {
    service = new SettingsManagementTauriService();
    mockSettings = {
      theme: 'system',
      language: 'ja',
      font: 'system-ui',
      fontSize: 14,
      fontColor: '#333333',
      backgroundColor: '#ffffff',
      weekStart: 'monday',
      timezone: 'Asia/Tokyo',
      dateFormat: 'YYYY-MM-DD',
      customDueDays: [1, 3, 7],
      customDateFormats: [],
      timeLabels: [],
      dueDateButtons: {
        overdue: true,
        today: true,
        tomorrow: true,
        threeDays: true,
        thisWeek: true,
        thisMonth: true,
        thisQuarter: false,
        thisYear: false,
        thisYearEnd: false
      },
      viewItems: [],
      lastSelectedAccount: 'account-123'
    };
    mockCustomDateFormat = {
      id: 'format-123',
      name: 'Japanese Format',
      format: 'YYYY年MM月DD日'
    };
    mockTimeLabel = {
      id: 'label-123',
      name: 'Morning',
      time: '09:00'
    };
    mockViewItem = {
      id: 'item-123',
      label: 'Priority',
      icon: 'star',
      visible: true,
      order: 1
    };
    vi.clearAllMocks();
  });

  describe('loadSettings', () => {
    it('should successfully load settings', async () => {
      mockInvoke.mockResolvedValue(mockSettings);

      const result = await service.loadSettings();

      expect(mockInvoke).toHaveBeenCalledWith('load_settings');
      expect(result).toEqual(mockSettings);
    });

    it('should return null when loading fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Load failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.loadSettings();

      expect(mockInvoke).toHaveBeenCalledWith('load_settings');
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load settings:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should return null when settings do not exist', async () => {
      mockInvoke.mockResolvedValue(null);

      const result = await service.loadSettings();

      expect(result).toBeNull();
    });
  });

  describe('saveSettings', () => {
    it('should successfully save settings', async () => {
      mockInvoke.mockResolvedValue(true);

      const result = await service.saveSettings(mockSettings);

      expect(mockInvoke).toHaveBeenCalledWith('save_settings', { settings: mockSettings });
      expect(result).toBe(true);
    });

    it('should return false when saving fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Save failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.saveSettings(mockSettings);

      expect(mockInvoke).toHaveBeenCalledWith('save_settings', { settings: mockSettings });
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to save settings:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('settingsFileExists', () => {
    it('should return true when settings file exists', async () => {
      mockInvoke.mockResolvedValue(true);

      const result = await service.settingsFileExists();

      expect(mockInvoke).toHaveBeenCalledWith('settings_file_exists');
      expect(result).toBe(true);
    });

    it('should return false when settings file does not exist', async () => {
      mockInvoke.mockResolvedValue(false);

      const result = await service.settingsFileExists();

      expect(result).toBe(false);
    });

    it('should return false when check fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Check failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.settingsFileExists();

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to check settings file existence:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('initializeSettingsWithDefaults', () => {
    it('should successfully initialize settings with defaults', async () => {
      mockInvoke.mockResolvedValue(true);

      const result = await service.initializeSettingsWithDefaults();

      expect(mockInvoke).toHaveBeenCalledWith('initialize_settings_with_defaults');
      expect(result).toBe(true);
    });

    it('should return false when initialization fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Initialization failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.initializeSettingsWithDefaults();

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to initialize settings with defaults:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('getSettingsFilePath', () => {
    it('should successfully get settings file path', async () => {
      const mockPath = '/path/to/settings.json';
      mockInvoke.mockResolvedValue(mockPath);

      const result = await service.getSettingsFilePath();

      expect(mockInvoke).toHaveBeenCalledWith('get_settings_file_path');
      expect(result).toBe(mockPath);
    });

    it('should return empty string when getting path fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Get path failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.getSettingsFilePath();

      expect(result).toBe('');
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get settings file path:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('custom due day management', () => {
    it('should successfully add custom due day', async () => {
      mockInvoke.mockResolvedValue(true);

      const result = await service.addCustomDueDay(5);

      expect(mockInvoke).toHaveBeenCalledWith('add_custom_due_day', { days: 5 });
      expect(result).toBe(true);
    });

    it('should successfully update custom due day', async () => {
      mockInvoke.mockResolvedValue(true);

      const result = await service.updateCustomDueDay(3, 5);

      expect(mockInvoke).toHaveBeenCalledWith('update_custom_due_day', { old_days: 3, new_days: 5 });
      expect(result).toBe(true);
    });

    it('should successfully delete custom due day', async () => {
      mockInvoke.mockResolvedValue(true);

      const result = await service.deleteCustomDueDay(7);

      expect(mockInvoke).toHaveBeenCalledWith('delete_custom_due_day', { days: 7 });
      expect(result).toBe(true);
    });
  });

  describe('custom date format management', () => {
    it('should successfully get custom date format setting', async () => {
      mockInvoke.mockResolvedValue(mockCustomDateFormat);

      const result = await service.getCustomDateFormatSetting('format-123');

      expect(mockInvoke).toHaveBeenCalledWith('get_custom_date_format_setting', { format_id: 'format-123' });
      expect(result).toEqual(mockCustomDateFormat);
    });

    it('should successfully get all custom date format settings', async () => {
      const mockFormats = [mockCustomDateFormat];
      mockInvoke.mockResolvedValue(mockFormats);

      const result = await service.getAllCustomDateFormatSettings();

      expect(mockInvoke).toHaveBeenCalledWith('get_all_custom_date_format_settings');
      expect(result).toEqual(mockFormats);
    });

    it('should successfully add custom date format setting', async () => {
      mockInvoke.mockResolvedValue(true);

      const result = await service.addCustomDateFormatSetting(mockCustomDateFormat);

      expect(mockInvoke).toHaveBeenCalledWith('add_custom_date_format_setting', { format_setting: mockCustomDateFormat });
      expect(result).toBe(true);
    });

    it('should successfully update custom date format setting', async () => {
      mockInvoke.mockResolvedValue(true);

      const result = await service.updateCustomDateFormatSetting(mockCustomDateFormat);

      expect(mockInvoke).toHaveBeenCalledWith('update_custom_date_format_setting', { format_setting: mockCustomDateFormat });
      expect(result).toBe(true);
    });

    it('should successfully delete custom date format setting', async () => {
      mockInvoke.mockResolvedValue(true);

      const result = await service.deleteCustomDateFormatSetting('format-123');

      expect(mockInvoke).toHaveBeenCalledWith('delete_custom_date_format_setting', { format_id: 'format-123' });
      expect(result).toBe(true);
    });
  });

  describe('time label management', () => {
    it('should successfully get time label setting', async () => {
      mockInvoke.mockResolvedValue(mockTimeLabel);

      const result = await service.getTimeLabelSetting('label-123');

      expect(mockInvoke).toHaveBeenCalledWith('get_time_label_setting', { label_id: 'label-123' });
      expect(result).toEqual(mockTimeLabel);
    });

    it('should successfully get all time label settings', async () => {
      const mockLabels = [mockTimeLabel];
      mockInvoke.mockResolvedValue(mockLabels);

      const result = await service.getAllTimeLabelSettings();

      expect(mockInvoke).toHaveBeenCalledWith('get_all_time_label_settings');
      expect(result).toEqual(mockLabels);
    });

    it('should successfully add time label setting', async () => {
      mockInvoke.mockResolvedValue(true);

      const result = await service.addTimeLabelSetting(mockTimeLabel);

      expect(mockInvoke).toHaveBeenCalledWith('add_time_label_setting', { label_setting: mockTimeLabel });
      expect(result).toBe(true);
    });

    it('should successfully update time label setting', async () => {
      mockInvoke.mockResolvedValue(true);

      const result = await service.updateTimeLabelSetting(mockTimeLabel);

      expect(mockInvoke).toHaveBeenCalledWith('update_time_label_setting', { label_setting: mockTimeLabel });
      expect(result).toBe(true);
    });

    it('should successfully delete time label setting', async () => {
      mockInvoke.mockResolvedValue(true);

      const result = await service.deleteTimeLabelSetting('label-123');

      expect(mockInvoke).toHaveBeenCalledWith('delete_time_label_setting', { label_id: 'label-123' });
      expect(result).toBe(true);
    });
  });

  describe('view item management', () => {
    it('should successfully get view item setting', async () => {
      mockInvoke.mockResolvedValue(mockViewItem);

      const result = await service.getViewItemSetting('item-123');

      expect(mockInvoke).toHaveBeenCalledWith('get_view_item_setting', { item_id: 'item-123' });
      expect(result).toEqual(mockViewItem);
    });

    it('should successfully get all view item settings', async () => {
      const mockItems = [mockViewItem];
      mockInvoke.mockResolvedValue(mockItems);

      const result = await service.getAllViewItemSettings();

      expect(mockInvoke).toHaveBeenCalledWith('get_all_view_item_settings');
      expect(result).toEqual(mockItems);
    });

    it('should successfully add view item setting', async () => {
      mockInvoke.mockResolvedValue(true);

      const result = await service.addViewItemSetting(mockViewItem);

      expect(mockInvoke).toHaveBeenCalledWith('add_view_item_setting', { item_setting: mockViewItem });
      expect(result).toBe(true);
    });

    it('should successfully update view item setting', async () => {
      mockInvoke.mockResolvedValue(true);

      const result = await service.updateViewItemSetting(mockViewItem);

      expect(mockInvoke).toHaveBeenCalledWith('update_view_item_setting', { item_setting: mockViewItem });
      expect(result).toBe(true);
    });

    it('should successfully delete view item setting', async () => {
      mockInvoke.mockResolvedValue(true);

      const result = await service.deleteViewItemSetting('item-123');

      expect(mockInvoke).toHaveBeenCalledWith('delete_view_item_setting', { item_id: 'item-123' });
      expect(result).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle custom due day operation failures', async () => {
      mockInvoke.mockRejectedValue(new Error('Operation failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const addResult = await service.addCustomDueDay(5);
      const updateResult = await service.updateCustomDueDay(3, 5);
      const deleteResult = await service.deleteCustomDueDay(7);

      expect(addResult).toBe(false);
      expect(updateResult).toBe(false);
      expect(deleteResult).toBe(false);
      expect(consoleSpy).toHaveBeenCalledTimes(3);

      consoleSpy.mockRestore();
    });

    it('should handle date format operation failures', async () => {
      mockInvoke.mockRejectedValue(new Error('Operation failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const getResult = await service.getCustomDateFormatSetting('format-123');
      const getAllResult = await service.getAllCustomDateFormatSettings();
      const addResult = await service.addCustomDateFormatSetting(mockCustomDateFormat);

      expect(getResult).toBeNull();
      expect(getAllResult).toEqual([]);
      expect(addResult).toBe(false);
      expect(consoleSpy).toHaveBeenCalledTimes(3);

      consoleSpy.mockRestore();
    });

    it('should handle concurrent operations gracefully', async () => {
      mockInvoke.mockResolvedValue(true);

      const operations = [
        service.loadSettings(),
        service.saveSettings(mockSettings),
        service.addCustomDueDay(1),
        service.getCustomDateFormatSetting('format-123'),
        service.addTimeLabelSetting(mockTimeLabel)
      ];

      const results = await Promise.all(operations);

      // First operation (loadSettings) returns the mockSettings, others return true
      expect(results[0]).toBe(true);
      expect(results[1]).toBe(true);
      expect(results[2]).toBe(true);
      expect(results[3]).toBe(true);
      expect(results[4]).toBe(true);
    });
  });
});