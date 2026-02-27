import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CustomDateFormatService } from '$lib/infrastructure/backends/tauri/settings-categories/custom-date-format-service';
import type { CustomDateFormat } from '$lib/types/settings';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}));

const mockInvoke = vi.mocked(await import('@tauri-apps/api/core')).invoke;

describe('CustomDateFormatService', () => {
  let service: CustomDateFormatService;
  let mockCustomDateFormat: CustomDateFormat;

  beforeEach(() => {
    service = new CustomDateFormatService();
    mockCustomDateFormat = {
      id: 'format-123',
      name: 'Japanese Format',
      format: 'YYYY年MM月DD日'
    };
    vi.clearAllMocks();
  });

  describe('getCustomDateFormatSetting', () => {
    it('should successfully get custom date format setting', async () => {
      mockInvoke.mockResolvedValue(mockCustomDateFormat);

      const result = await service.getCustomDateFormatSetting('format-123');

      expect(mockInvoke).toHaveBeenCalledWith('get_custom_date_format_setting', {
        id: 'format-123'
      });
      expect(result).toEqual(mockCustomDateFormat);
    });

    it('should return null when getting fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Get failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.getCustomDateFormatSetting('format-123');

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to get custom date format setting:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('getAllCustomDateFormatSettings', () => {
    it('should successfully get all custom date format settings', async () => {
      const mockFormats = [mockCustomDateFormat];
      mockInvoke.mockResolvedValue(mockFormats);

      const result = await service.getAllCustomDateFormatSettings();

      expect(mockInvoke).toHaveBeenCalledWith('get_all_custom_date_format_settings');
      expect(result).toEqual(mockFormats);
    });

    it('should return empty array when getting all fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Get all failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.getAllCustomDateFormatSettings();

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to get all custom date format settings:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('addCustomDateFormatSetting', () => {
    it('should successfully add custom date format setting', async () => {
      mockInvoke.mockResolvedValue(true);

      const result = await service.addCustomDateFormatSetting(mockCustomDateFormat);

      expect(mockInvoke).toHaveBeenCalledWith('add_custom_date_format_setting', {
        format: mockCustomDateFormat
      });
      expect(result).toBe(true);
    });

    it('should return false when adding fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Add failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.addCustomDateFormatSetting(mockCustomDateFormat);

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to add custom date format setting:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('updateCustomDateFormatSetting', () => {
    it('should successfully update custom date format setting', async () => {
      mockInvoke.mockResolvedValue(true);

      const result = await service.updateCustomDateFormatSetting(mockCustomDateFormat);

      expect(mockInvoke).toHaveBeenCalledWith('update_custom_date_format_setting', {
        format: mockCustomDateFormat
      });
      expect(result).toBe(true);
    });

    it('should return false when updating fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Update failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.updateCustomDateFormatSetting(mockCustomDateFormat);

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to update custom date format setting:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('deleteCustomDateFormatSetting', () => {
    it('should successfully delete custom date format setting', async () => {
      mockInvoke.mockResolvedValue(true);

      const result = await service.deleteCustomDateFormatSetting('format-123');

      expect(mockInvoke).toHaveBeenCalledWith('delete_custom_date_format_setting', {
        id: 'format-123'
      });
      expect(result).toBe(true);
    });

    it('should return false when deleting fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Delete failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.deleteCustomDateFormatSetting('format-123');

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to delete custom date format setting:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
});
