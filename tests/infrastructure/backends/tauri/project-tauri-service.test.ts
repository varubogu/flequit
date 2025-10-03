import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProjectTauriService } from '$lib/infrastructure/backends/tauri/project-tauri-service';
import type { Project, ProjectSearchCondition } from '$lib/types/project';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}));

// Get the mocked invoke for use in tests
const mockInvoke = vi.mocked(await import('@tauri-apps/api/core')).invoke;

describe('ProjectTauriService', () => {
  let service: ProjectTauriService;
  let mockProject: Project;
  let mockSearchCondition: ProjectSearchCondition;

  beforeEach(() => {
    service = new ProjectTauriService();
    mockProject = {
      id: 'project-123',
      name: 'Test Project',
      description: 'Test Description',
      color: '#FF5733',
      orderIndex: 0,
      isArchived: false,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z')
    };
    mockSearchCondition = {
      name: 'Test',
      isArchived: false
    };
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should successfully create a project', async () => {
      mockInvoke.mockResolvedValue(undefined);

      const result = await service.create(mockProject);

      expect(mockInvoke).toHaveBeenCalledWith('create_project', { project: mockProject });
      expect(result).toBe(true);
    });

    it('should return false when creation fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Creation failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.create(mockProject);

      expect(mockInvoke).toHaveBeenCalledWith('create_project', { project: mockProject });
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to create project:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('update', () => {
    it('should successfully update a project', async () => {
      mockInvoke.mockResolvedValue(true);

      const result = await service.update(mockProject.id, mockProject);

      expect(mockInvoke).toHaveBeenCalledWith('update_project', { id: mockProject.id, patch: mockProject });
      expect(result).toBe(true);
    });

    it('should return false when update fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Update failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.update(mockProject.id, mockProject);

      expect(mockInvoke).toHaveBeenCalledWith('update_project', { id: mockProject.id, patch: mockProject });
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to update project:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('delete', () => {
    it('should successfully delete a project', async () => {
      mockInvoke.mockResolvedValue(undefined);

      const result = await service.delete('project-123');

      expect(mockInvoke).toHaveBeenCalledWith('delete_project', { id: 'project-123' });
      expect(result).toBe(true);
    });

    it('should return false when deletion fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Deletion failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.delete('project-123');

      expect(mockInvoke).toHaveBeenCalledWith('delete_project', { id: 'project-123' });
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to delete project:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('get', () => {
    it('should successfully retrieve a project', async () => {
      mockInvoke.mockResolvedValue(mockProject);

      const result = await service.get('project-123');

      expect(mockInvoke).toHaveBeenCalledWith('get_project', { id: 'project-123' });
      expect(result).toEqual(mockProject);
    });

    it('should return null when project not found', async () => {
      mockInvoke.mockResolvedValue(null);

      const result = await service.get('non-existent');

      expect(mockInvoke).toHaveBeenCalledWith('get_project', { id: 'non-existent' });
      expect(result).toBeNull();
    });

    it('should return null when retrieval fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Retrieval failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.get('project-123');

      expect(mockInvoke).toHaveBeenCalledWith('get_project', { id: 'project-123' });
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get project:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('search', () => {
    it('should return empty array as mock implementation', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await service.search(mockSearchCondition);

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('search_projects is not implemented on Tauri side - using mock implementation');

      consoleSpy.mockRestore();
    });

    it('should handle search with empty condition', async () => {
      const emptyCondition = {};
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await service.search(emptyCondition);

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('search_projects is not implemented on Tauri side - using mock implementation');

      consoleSpy.mockRestore();
    });
  });
});
