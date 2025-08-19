import { describe, it, expect, beforeEach, afterEach, vi, type MockedFunction } from 'vitest';
import { CustomDateFormatTauriService } from '$lib/services/backend/tauri/custom-date-format-tauri-service';
import { invoke } from '@tauri-apps/api/core';
import type { CustomDateFormat } from '$lib/types/settings';

// @tauri-apps/api/coreをモック化
vi.mock('@tauri-apps/api/core');

const mockInvoke = invoke as MockedFunction<typeof invoke>;

describe('CustomDateFormatTauriService', () => {
  let service: CustomDateFormatTauriService;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  const mockCustomDateFormat: CustomDateFormat = {
    id: 'format-123',
    name: 'Test Format',
    format: 'yyyy-MM-dd HH:mm:ss'
  };

  beforeEach(() => {
    service = new CustomDateFormatTauriService();
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('create', () => {
    it('should successfully create a custom date format', async () => {
      mockInvoke.mockResolvedValue(mockCustomDateFormat);

      const result = await service.create(mockCustomDateFormat);

      expect(mockInvoke).toHaveBeenCalledWith('add_custom_date_format_setting', { 
        format: mockCustomDateFormat 
      });
      expect(result).toEqual(mockCustomDateFormat);
    });

    it('should return null when creation fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Creation failed'));

      const result = await service.create(mockCustomDateFormat);

      expect(mockInvoke).toHaveBeenCalledWith('add_custom_date_format_setting', { 
        format: mockCustomDateFormat 
      });
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to create custom date format:', expect.any(Error));
    });
  });

  describe('get', () => {
    it('should successfully retrieve a custom date format by id', async () => {
      mockInvoke.mockResolvedValue(mockCustomDateFormat);

      const result = await service.get('format-123');

      expect(mockInvoke).toHaveBeenCalledWith('get_custom_date_format_setting', { id: 'format-123' });
      expect(result).toEqual(mockCustomDateFormat);
    });

    it('should return null when format not found', async () => {
      mockInvoke.mockResolvedValue(null);

      const result = await service.get('nonexistent-id');

      expect(mockInvoke).toHaveBeenCalledWith('get_custom_date_format_setting', { id: 'nonexistent-id' });
      expect(result).toBeNull();
    });

    it('should return null when retrieval fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Retrieval failed'));

      const result = await service.get('format-123');

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get custom date format:', expect.any(Error));
    });
  });

  describe('getAll', () => {
    it('should successfully retrieve all custom date formats', async () => {
      const mockFormats = [mockCustomDateFormat];
      mockInvoke.mockResolvedValue(mockFormats);

      const result = await service.getAll();

      expect(mockInvoke).toHaveBeenCalledWith('get_all_custom_date_format_settings');
      expect(result).toEqual(mockFormats);
    });

    it('should return empty array when no formats found', async () => {
      mockInvoke.mockResolvedValue([]);

      const result = await service.getAll();

      expect(mockInvoke).toHaveBeenCalledWith('get_all_custom_date_format_settings');
      expect(result).toEqual([]);
    });

    it('should return empty array when retrieval fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Retrieval failed'));

      const result = await service.getAll();

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get all custom date formats:', expect.any(Error));
    });
  });

  describe('update', () => {
    it('should successfully update a custom date format', async () => {
      const updatedFormat = { ...mockCustomDateFormat, name: 'Updated Format' };
      mockInvoke.mockResolvedValue(updatedFormat);

      const result = await service.update(updatedFormat);

      expect(mockInvoke).toHaveBeenCalledWith('update_custom_date_format_setting', { 
        format: updatedFormat 
      });
      expect(result).toEqual(updatedFormat);
    });

    it('should return null when update fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Update failed'));

      const result = await service.update(mockCustomDateFormat);

      expect(mockInvoke).toHaveBeenCalledWith('update_custom_date_format_setting', { 
        format: mockCustomDateFormat 
      });
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to update custom date format:', expect.any(Error));
    });
  });

  describe('delete', () => {
    it('should successfully delete a custom date format', async () => {
      mockInvoke.mockResolvedValue(undefined);

      const result = await service.delete('format-123');

      expect(mockInvoke).toHaveBeenCalledWith('delete_custom_date_format_setting', { id: 'format-123' });
      expect(result).toBe(true);
    });

    it('should return false when deletion fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Deletion failed'));

      const result = await service.delete('format-123');

      expect(mockInvoke).toHaveBeenCalledWith('delete_custom_date_format_setting', { id: 'format-123' });
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to delete custom date format:', expect.any(Error));
    });
  });

  describe('edge cases', () => {
    it('should handle empty string id', async () => {
      mockInvoke.mockResolvedValue(null);

      const result = await service.get('');

      expect(mockInvoke).toHaveBeenCalledWith('get_custom_date_format_setting', { id: '' });
      expect(result).toBeNull();
    });

    it('should handle format with special characters', async () => {
      const specialFormat: CustomDateFormat = {
        id: 'format-special',
        name: 'Special & Format',
        format: 'yyyy年MM月dd日 <HH:mm:ss>'
      };
      
      mockInvoke.mockResolvedValue(specialFormat);

      const result = await service.create(specialFormat);

      expect(mockInvoke).toHaveBeenCalledWith('add_custom_date_format_setting', { 
        format: specialFormat 
      });
      expect(result).toEqual(specialFormat);
    });
  });
});