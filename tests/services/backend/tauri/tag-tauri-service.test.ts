import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TagTauriService } from '$lib/services/backend/tauri/tag-tauri-service';
import type { Tag, TagSearchCondition } from '$lib/types/tag';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}));

// Get the mocked invoke for use in tests
const mockInvoke = vi.mocked(await import('@tauri-apps/api/core')).invoke;

describe('TagTauriService', () => {
  let service: TagTauriService;
  let mockTag: Tag;
  let mockSearchCondition: TagSearchCondition;

  beforeEach(() => {
    service = new TagTauriService();
    mockTag = {
      id: 'tag-123',
      name: 'urgent',
      color: '#FF5733',
      orderIndex: 0,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z')
    };
    mockSearchCondition = {
      name: 'urgent'
    };
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should successfully create a tag', async () => {
      mockInvoke.mockResolvedValue(undefined);

      const result = await service.create('test-project-id', mockTag);

      expect(mockInvoke).toHaveBeenCalledWith('create_tag', { projectId: 'test-project-id', tag: mockTag });
      expect(result).toBe(true);
    });

    it('should return false when creation fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Creation failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.create('test-project-id', mockTag);

      expect(mockInvoke).toHaveBeenCalledWith('create_tag', { projectId: 'test-project-id', tag: mockTag });
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to create tag:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle tag with minimal data', async () => {
      mockInvoke.mockResolvedValue(undefined);

      const minimalTag = {
        id: 'tag-minimal',
        name: 'basic',
        created_at: new Date(),
        updated_at: new Date()
      };

      const result = await service.create('test-project-id', minimalTag);

      expect(mockInvoke).toHaveBeenCalledWith('create_tag', { projectId: 'test-project-id', tag: minimalTag });
      expect(result).toBe(true);
    });

    it('should handle tag with all optional fields', async () => {
      mockInvoke.mockResolvedValue(undefined);

      const fullTag = {
        id: 'tag-full',
        name: 'complete',
        color: '#00FF00',
        order_index: 5,
        created_at: new Date(),
        updated_at: new Date()
      };

      const result = await service.create('test-project-id', fullTag);

      expect(mockInvoke).toHaveBeenCalledWith('create_tag', { projectId: 'test-project-id', tag: fullTag });
      expect(result).toBe(true);
    });
  });

  describe('update', () => {
    it('should successfully update a tag', async () => {
      mockInvoke.mockResolvedValue(true);

      const result = await service.update('test-project-id', mockTag.id, mockTag);

      expect(mockInvoke).toHaveBeenCalledWith('update_tag', { projectId: 'test-project-id', tagId: mockTag.id, patch: mockTag });
      expect(result).toBe(true);
    });

    it('should return false when update fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Update failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.update('test-project-id', mockTag.id, mockTag);

      expect(mockInvoke).toHaveBeenCalledWith('update_tag', { projectId: 'test-project-id', tagId: mockTag.id, patch: mockTag });
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to update tag:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle color change', async () => {
      mockInvoke.mockResolvedValue(true);

      const updatedTag = {
        ...mockTag,
        color: '#0066CC',
        updated_at: new Date()
      };

      const result = await service.update('test-project-id', updatedTag.id, updatedTag);

      expect(mockInvoke).toHaveBeenCalledWith('update_tag', { projectId: 'test-project-id', tagId: updatedTag.id, patch: updatedTag });
      expect(result).toBe(true);
    });

    it('should handle name change', async () => {
      mockInvoke.mockResolvedValue(true);

      const renamedTag = {
        ...mockTag,
        name: 'high-priority',
        updated_at: new Date()
      };

      const result = await service.update('test-project-id', renamedTag.id, renamedTag);

      expect(mockInvoke).toHaveBeenCalledWith('update_tag', { projectId: 'test-project-id', tagId: renamedTag.id, patch: renamedTag });
      expect(result).toBe(true);
    });
  });

  describe('delete', () => {
    it('should successfully delete a tag', async () => {
      mockInvoke.mockResolvedValue(undefined);

      const result = await service.delete('test-project-id', 'tag-123');

      expect(mockInvoke).toHaveBeenCalledWith('delete_tag', { projectId: 'test-project-id', id: 'tag-123' });
      expect(result).toBe(true);
    });

    it('should return false when deletion fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Deletion failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.delete('test-project-id', 'tag-123');

      expect(mockInvoke).toHaveBeenCalledWith('delete_tag', { projectId: 'test-project-id', id: 'tag-123' });
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to delete tag:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('get', () => {
    it('should successfully retrieve a tag', async () => {
      mockInvoke.mockResolvedValue(mockTag);

      const result = await service.get('test-project-id', 'tag-123');

      expect(mockInvoke).toHaveBeenCalledWith('get_tag', { projectId: 'test-project-id', id: 'tag-123' });
      expect(result).toEqual(mockTag);
    });

    it('should return null when tag not found', async () => {
      mockInvoke.mockResolvedValue(null);

      const result = await service.get('test-project-id', 'non-existent');

      expect(mockInvoke).toHaveBeenCalledWith('get_tag', { projectId: 'test-project-id', id: 'non-existent' });
      expect(result).toBeNull();
    });

    it('should return null when retrieval fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Retrieval failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.get('test-project-id', 'tag-123');

      expect(mockInvoke).toHaveBeenCalledWith('get_tag', { projectId: 'test-project-id', id: 'tag-123' });
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get tag:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('search', () => {
    it('should return empty array as mock implementation', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await service.search('test-project-id', mockSearchCondition);

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('search_tags is not implemented on Tauri side - using mock implementation');

      consoleSpy.mockRestore();
    });

    it('should handle search with empty condition', async () => {
      const emptyCondition = {};
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await service.search('test-project-id', emptyCondition);

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('search_tags is not implemented on Tauri side - using mock implementation');

      consoleSpy.mockRestore();
    });
  });

  describe('edge cases', () => {
    it('should handle tags with special characters in name', async () => {
      mockInvoke.mockResolvedValue(undefined);

      const specialCharTag = {
        id: 'tag-special',
        name: '重要！@#$%',
        color: '#FF0000',
        created_at: new Date(),
        updated_at: new Date()
      };

      const result = await service.create('test-project-id', specialCharTag);

      expect(result).toBe(true);
    });

    it('should handle tags with hex color codes', async () => {
      mockInvoke.mockResolvedValue(undefined);

      const colorVariations = [
        '#FF0000',
        '#00FF00',
        '#0000FF',
        '#FFFFFF',
        '#000000',
        '#FF5733',
        '#3498DB',
        '#E74C3C',
        '#2ECC71'
      ];

      for (const color of colorVariations) {
        const colorTag = {
          id: `tag-${color.slice(1)}`,
          name: `color-${color}`,
          color,
          created_at: new Date(),
          updated_at: new Date()
        };

        const result = await service.create('test-project-id', colorTag);
        expect(result).toBe(true);
      }
    });

    it('should handle tags with no color specified', async () => {
      mockInvoke.mockResolvedValue(undefined);

      const noColorTag = {
        id: 'tag-no-color',
        name: 'no-color',
        created_at: new Date(),
        updated_at: new Date()
      };

      const result = await service.create('test-project-id', noColorTag);

      expect(result).toBe(true);
    });

    it('should handle tags with various order indices', async () => {
      mockInvoke.mockResolvedValue(undefined);

      const orderIndices = [0, 1, 10, 100, -1];

      for (const orderIndex of orderIndices) {
        const orderTag = {
          id: `tag-order-${orderIndex}`,
          name: `order-${orderIndex}`,
          order_index: orderIndex,
          created_at: new Date(),
          updated_at: new Date()
        };

        const result = await service.create('test-project-id', orderTag);
        expect(result).toBe(true);
      }
    });
  });
});
