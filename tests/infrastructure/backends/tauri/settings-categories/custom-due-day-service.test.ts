import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CustomDueDayService } from '$lib/infrastructure/backends/tauri/settings-categories/custom-due-day-service';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}));

const mockInvoke = vi.mocked(await import('@tauri-apps/api/core')).invoke;

describe('CustomDueDayService', () => {
  let service: CustomDueDayService;

  beforeEach(() => {
    service = new CustomDueDayService();
    vi.clearAllMocks();
  });

  describe('addCustomDueDay', () => {
    it('should successfully add custom due day', async () => {
      mockInvoke.mockResolvedValue(true);

      const result = await service.addCustomDueDay(5);

      expect(mockInvoke).toHaveBeenCalledWith('add_custom_due_day', { days: 5 });
      expect(result).toBe(true);
    });

    it('should return false when adding fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Add failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.addCustomDueDay(5);

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to add custom due day:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('updateCustomDueDay', () => {
    it('should successfully update custom due day', async () => {
      mockInvoke.mockResolvedValue(true);

      const result = await service.updateCustomDueDay(3, 5);

      expect(mockInvoke).toHaveBeenCalledWith('update_custom_due_day', {
        old_days: 3,
        new_days: 5
      });
      expect(result).toBe(true);
    });

    it('should return false when updating fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Update failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.updateCustomDueDay(3, 5);

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to update custom due day:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('deleteCustomDueDay', () => {
    it('should successfully delete custom due day', async () => {
      mockInvoke.mockResolvedValue(true);

      const result = await service.deleteCustomDueDay(7);

      expect(mockInvoke).toHaveBeenCalledWith('delete_custom_due_day', { days: 7 });
      expect(result).toBe(true);
    });

    it('should return false when deleting fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Delete failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.deleteCustomDueDay(7);

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to delete custom due day:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
});
