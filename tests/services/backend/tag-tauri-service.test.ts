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
      order_index: 0,
      created_at: new Date('2024-01-01T00:00:00Z'),
      updated_at: new Date('2024-01-01T00:00:00Z')
    };
    mockSearchCondition = {
      name: 'urgent'
    };
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should successfully create a tag', async () => {
      mockInvoke.mockResolvedValue(undefined);

      const result = await service.create(mockTag);

      expect(mockInvoke).toHaveBeenCalledWith('create_tag', { tag: mockTag });
      expect(result).toBe(true);
    });

    it('should return false when creation fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Creation failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.create(mockTag);

      expect(mockInvoke).toHaveBeenCalledWith('create_tag', { tag: mockTag });
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

      const result = await service.create(minimalTag);

      expect(mockInvoke).toHaveBeenCalledWith('create_tag', { tag: minimalTag });
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

      const result = await service.create(fullTag);

      expect(mockInvoke).toHaveBeenCalledWith('create_tag', { tag: fullTag });
      expect(result).toBe(true);
    });
  });

  describe('update', () => {
    it('should successfully update a tag', async () => {
      mockInvoke.mockResolvedValue(undefined);

      const result = await service.update(mockTag);

      expect(mockInvoke).toHaveBeenCalledWith('update_tag', { tag: mockTag });
      expect(result).toBe(true);
    });

    it('should return false when update fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Update failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.update(mockTag);

      expect(mockInvoke).toHaveBeenCalledWith('update_tag', { tag: mockTag });
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to update tag:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should handle color change', async () => {
      mockInvoke.mockResolvedValue(undefined);
      
      const updatedTag = {
        ...mockTag,
        color: '#0066CC',
        updated_at: new Date()
      };

      const result = await service.update(updatedTag);

      expect(mockInvoke).toHaveBeenCalledWith('update_tag', { tag: updatedTag });
      expect(result).toBe(true);
    });

    it('should handle name change', async () => {
      mockInvoke.mockResolvedValue(undefined);
      
      const renamedTag = {
        ...mockTag,
        name: 'high-priority',
        updated_at: new Date()
      };

      const result = await service.update(renamedTag);

      expect(mockInvoke).toHaveBeenCalledWith('update_tag', { tag: renamedTag });
      expect(result).toBe(true);
    });
  });

  describe('delete', () => {
    it('should successfully delete a tag', async () => {
      mockInvoke.mockResolvedValue(undefined);

      const result = await service.delete('tag-123');

      expect(mockInvoke).toHaveBeenCalledWith('delete_tag', { id: 'tag-123' });
      expect(result).toBe(true);
    });

    it('should return false when deletion fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Deletion failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.delete('tag-123');

      expect(mockInvoke).toHaveBeenCalledWith('delete_tag', { id: 'tag-123' });
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to delete tag:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('get', () => {
    it('should successfully retrieve a tag', async () => {
      mockInvoke.mockResolvedValue(mockTag);

      const result = await service.get('tag-123');

      expect(mockInvoke).toHaveBeenCalledWith('get_tag', { id: 'tag-123' });
      expect(result).toEqual(mockTag);
    });

    it('should return null when tag not found', async () => {
      mockInvoke.mockResolvedValue(null);

      const result = await service.get('non-existent');

      expect(mockInvoke).toHaveBeenCalledWith('get_tag', { id: 'non-existent' });
      expect(result).toBeNull();
    });

    it('should return null when retrieval fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Retrieval failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.get('tag-123');

      expect(mockInvoke).toHaveBeenCalledWith('get_tag', { id: 'tag-123' });
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get tag:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('search', () => {
    it('should successfully search tags', async () => {
      const mockTags = [mockTag];
      mockInvoke.mockResolvedValue(mockTags);

      const result = await service.search(mockSearchCondition);

      expect(mockInvoke).toHaveBeenCalledWith('search_tags', { condition: mockSearchCondition });
      expect(result).toEqual(mockTags);
    });

    it('should return empty array when no tags found', async () => {
      mockInvoke.mockResolvedValue([]);

      const result = await service.search(mockSearchCondition);

      expect(mockInvoke).toHaveBeenCalledWith('search_tags', { condition: mockSearchCondition });
      expect(result).toEqual([]);
    });

    it('should return empty array when search fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Search failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.search(mockSearchCondition);

      expect(mockInvoke).toHaveBeenCalledWith('search_tags', { condition: mockSearchCondition });
      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to search tags:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should handle search with partial name match', async () => {
      const partialNameCondition = { name: 'urg' };
      const mockTags = [mockTag];
      mockInvoke.mockResolvedValue(mockTags);

      const result = await service.search(partialNameCondition);

      expect(mockInvoke).toHaveBeenCalledWith('search_tags', { condition: partialNameCondition });
      expect(result).toEqual(mockTags);
    });

    it('should handle empty search condition', async () => {
      const emptyCondition = {};
      const allTags = [
        mockTag,
        { id: 'tag-2', name: 'important', created_at: new Date(), updated_at: new Date() },
        { id: 'tag-3', name: 'review', color: '#00FF00', created_at: new Date(), updated_at: new Date() }
      ];
      mockInvoke.mockResolvedValue(allTags);

      const result = await service.search(emptyCondition);

      expect(mockInvoke).toHaveBeenCalledWith('search_tags', { condition: emptyCondition });
      expect(result).toEqual(allTags);
    });

    it('should handle case-sensitive search', async () => {
      const caseSensitiveCondition = { name: 'URGENT' };
      mockInvoke.mockResolvedValue([]);

      const result = await service.search(caseSensitiveCondition);

      expect(mockInvoke).toHaveBeenCalledWith('search_tags', { condition: caseSensitiveCondition });
      expect(result).toEqual([]);
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

      const result = await service.create(specialCharTag);

      expect(result).toBe(true);
    });

    it('should handle tags with hex color codes', async () => {
      mockInvoke.mockResolvedValue(undefined);
      
      const colorVariations = [
        '#FF0000', '#00FF00', '#0000FF', 
        '#FFFFFF', '#000000', '#FF5733',
        '#3498DB', '#E74C3C', '#2ECC71'
      ];

      for (const color of colorVariations) {
        const colorTag = {
          id: `tag-${color.slice(1)}`,
          name: `color-${color}`,
          color,
          created_at: new Date(),
          updated_at: new Date()
        };

        const result = await service.create(colorTag);
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

      const result = await service.create(noColorTag);

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

        const result = await service.create(orderTag);
        expect(result).toBe(true);
      }
    });
  });
});