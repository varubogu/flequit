import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SettingsManagementTauriService } from '$lib/infrastructure/backends/tauri/settings-management-tauri-service';
import type { Settings } from '$lib/types/settings';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}));

// Get the mocked invoke for use in tests
const mockInvoke = vi.mocked(await import('@tauri-apps/api/core')).invoke;

describe('SettingsManagementTauriService', () => {
  let service: SettingsManagementTauriService;
  let mockSettings: Settings;

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
    vi.clearAllMocks();
  });

  describe('basic settings operations', () => {
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

    describe('updateSettingsPartially', () => {
      it('should successfully update settings partially', async () => {
        const partialSettings = { theme: 'dark' as const };
        mockInvoke.mockResolvedValue({ ...mockSettings, ...partialSettings });

        const result = await service.updateSettingsPartially(partialSettings);

        expect(mockInvoke).toHaveBeenCalledWith('update_settings_partially', {
          partialSettings
        });
        expect(result).toEqual({ ...mockSettings, ...partialSettings });
      });

      it('should return null when partial update fails', async () => {
        mockInvoke.mockRejectedValue(new Error('Update failed'));
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const result = await service.updateSettingsPartially({ theme: 'dark' });

        expect(result).toBeNull();
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to update settings partially:',
          expect.any(Error)
        );

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
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to check settings file existence:',
          expect.any(Error)
        );

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
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to initialize settings with defaults:',
          expect.any(Error)
        );

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
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to get settings file path:',
          expect.any(Error)
        );

        consoleSpy.mockRestore();
      });
    });
  });

  describe('delegation to category services', () => {
    it('should delegate custom due day operations', async () => {
      mockInvoke.mockResolvedValue(true);

      await service.addCustomDueDay(5);
      await service.updateCustomDueDay(3, 5);
      await service.deleteCustomDueDay(7);

      expect(mockInvoke).toHaveBeenCalledWith('add_custom_due_day', { days: 5 });
      expect(mockInvoke).toHaveBeenCalledWith('update_custom_due_day', {
        old_days: 3,
        new_days: 5
      });
      expect(mockInvoke).toHaveBeenCalledWith('delete_custom_due_day', { days: 7 });
    });

    it('should delegate custom date format operations', async () => {
      mockInvoke.mockResolvedValue(true);

      await service.getCustomDateFormatSetting('format-123');
      await service.getAllCustomDateFormatSettings();

      expect(mockInvoke).toHaveBeenCalledWith('get_custom_date_format_setting', {
        id: 'format-123'
      });
      expect(mockInvoke).toHaveBeenCalledWith('get_all_custom_date_format_settings');
    });

    it('should delegate time label operations', async () => {
      mockInvoke.mockResolvedValue(true);

      await service.getTimeLabelSetting('label-123');
      await service.getAllTimeLabelSettings();

      expect(mockInvoke).toHaveBeenCalledWith('get_time_label_setting', {
        label_id: 'label-123'
      });
      expect(mockInvoke).toHaveBeenCalledWith('get_all_time_label_settings');
    });

    it('should delegate view item operations', async () => {
      mockInvoke.mockResolvedValue(true);

      await service.getViewItemSetting('item-123');
      await service.getAllViewItemSettings();

      expect(mockInvoke).toHaveBeenCalledWith('get_view_item_setting', {
        item_id: 'item-123'
      });
      expect(mockInvoke).toHaveBeenCalledWith('get_all_view_item_settings');
    });
  });
});
