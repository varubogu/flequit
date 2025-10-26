import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ViewItemService } from '$lib/infrastructure/backends/tauri/settings-categories/view-item-service';
import type { ViewItem } from '$lib/types/settings';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}));

const mockInvoke = vi.mocked(await import('@tauri-apps/api/core')).invoke;

describe('ViewItemService', () => {
  let service: ViewItemService;
  let mockViewItem: ViewItem;

  beforeEach(() => {
    service = new ViewItemService();
    mockViewItem = {
      id: 'item-123',
      label: 'Priority',
      icon: 'star',
      visible: true,
      order: 1
    };
    vi.clearAllMocks();
  });

  describe('getViewItemSetting', () => {
    it('should successfully get view item setting', async () => {
      mockInvoke.mockResolvedValue(mockViewItem);

      const result = await service.getViewItemSetting('item-123');

      expect(mockInvoke).toHaveBeenCalledWith('get_view_item_setting', {
        item_id: 'item-123'
      });
      expect(result).toEqual(mockViewItem);
    });

    it('should return null when getting fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Get failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.getViewItemSetting('item-123');

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to get view item setting:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('getAllViewItemSettings', () => {
    it('should successfully get all view item settings', async () => {
      const mockItems = [mockViewItem];
      mockInvoke.mockResolvedValue(mockItems);

      const result = await service.getAllViewItemSettings();

      expect(mockInvoke).toHaveBeenCalledWith('get_all_view_item_settings');
      expect(result).toEqual(mockItems);
    });

    it('should return empty array when getting all fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Get all failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.getAllViewItemSettings();

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to get all view item settings:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('addViewItemSetting', () => {
    it('should successfully add view item setting', async () => {
      mockInvoke.mockResolvedValue(true);

      const result = await service.addViewItemSetting(mockViewItem);

      expect(mockInvoke).toHaveBeenCalledWith('add_view_item_setting', {
        item_setting: mockViewItem
      });
      expect(result).toBe(true);
    });

    it('should return false when adding fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Add failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.addViewItemSetting(mockViewItem);

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to add view item setting:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('updateViewItemSetting', () => {
    it('should successfully update view item setting', async () => {
      mockInvoke.mockResolvedValue(true);

      const result = await service.updateViewItemSetting(mockViewItem);

      expect(mockInvoke).toHaveBeenCalledWith('update_view_item_setting', {
        item_setting: mockViewItem
      });
      expect(result).toBe(true);
    });

    it('should return false when updating fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Update failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.updateViewItemSetting(mockViewItem);

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to update view item setting:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('deleteViewItemSetting', () => {
    it('should successfully delete view item setting', async () => {
      mockInvoke.mockResolvedValue(true);

      const result = await service.deleteViewItemSetting('item-123');

      expect(mockInvoke).toHaveBeenCalledWith('delete_view_item_setting', {
        item_id: 'item-123'
      });
      expect(result).toBe(true);
    });

    it('should return false when deleting fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Delete failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.deleteViewItemSetting('item-123');

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to delete view item setting:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
});
