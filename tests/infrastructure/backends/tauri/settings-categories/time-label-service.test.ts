import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TimeLabelService } from '$lib/infrastructure/backends/tauri/settings-categories/time-label-service';
import type { TimeLabel } from '$lib/types/settings';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}));

const mockInvoke = vi.mocked(await import('@tauri-apps/api/core')).invoke;

describe('TimeLabelService', () => {
  let service: TimeLabelService;
  let mockTimeLabel: TimeLabel;

  beforeEach(() => {
    service = new TimeLabelService();
    mockTimeLabel = {
      id: 'label-123',
      name: 'Morning',
      time: '09:00'
    };
    vi.clearAllMocks();
  });

  describe('getTimeLabelSetting', () => {
    it('should successfully get time label setting', async () => {
      mockInvoke.mockResolvedValue(mockTimeLabel);

      const result = await service.getTimeLabelSetting('label-123');

      expect(mockInvoke).toHaveBeenCalledWith('get_time_label_setting', {
        label_id: 'label-123'
      });
      expect(result).toEqual(mockTimeLabel);
    });

    it('should return null when getting fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Get failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.getTimeLabelSetting('label-123');

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to get time label setting:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('getAllTimeLabelSettings', () => {
    it('should successfully get all time label settings', async () => {
      const mockLabels = [mockTimeLabel];
      mockInvoke.mockResolvedValue(mockLabels);

      const result = await service.getAllTimeLabelSettings();

      expect(mockInvoke).toHaveBeenCalledWith('get_all_time_label_settings');
      expect(result).toEqual(mockLabels);
    });

    it('should return empty array when getting all fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Get all failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.getAllTimeLabelSettings();

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to get all time label settings:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('addTimeLabelSetting', () => {
    it('should successfully add time label setting', async () => {
      mockInvoke.mockResolvedValue(true);

      const result = await service.addTimeLabelSetting(mockTimeLabel);

      expect(mockInvoke).toHaveBeenCalledWith('add_time_label_setting', {
        label_setting: mockTimeLabel
      });
      expect(result).toBe(true);
    });

    it('should return false when adding fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Add failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.addTimeLabelSetting(mockTimeLabel);

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to add time label setting:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('updateTimeLabelSetting', () => {
    it('should successfully update time label setting', async () => {
      mockInvoke.mockResolvedValue(true);

      const result = await service.updateTimeLabelSetting(mockTimeLabel);

      expect(mockInvoke).toHaveBeenCalledWith('update_time_label_setting', {
        label_setting: mockTimeLabel
      });
      expect(result).toBe(true);
    });

    it('should return false when updating fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Update failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.updateTimeLabelSetting(mockTimeLabel);

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to update time label setting:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('deleteTimeLabelSetting', () => {
    it('should successfully delete time label setting', async () => {
      mockInvoke.mockResolvedValue(true);

      const result = await service.deleteTimeLabelSetting('label-123');

      expect(mockInvoke).toHaveBeenCalledWith('delete_time_label_setting', {
        label_id: 'label-123'
      });
      expect(result).toBe(true);
    });

    it('should return false when deleting fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Delete failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.deleteTimeLabelSetting('label-123');

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to delete time label setting:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
});
