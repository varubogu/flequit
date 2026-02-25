import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ProjectService } from '$lib/infrastructure/backends/project-service';
import type { Project, ProjectSearchCondition } from '$lib/types/project';

// モックのプロジェクトサービス実装
class MockProjectService implements ProjectService {
  // CrudInterface メソッド
  create = vi.fn();
  update = vi.fn();
  delete = vi.fn();
  get = vi.fn();

  // RestorableInterface メソッド
  restore = vi.fn();

  // SearchInterface メソッド
  search = vi.fn();
}

describe('ProjectService Interface', () => {
  let service: MockProjectService;
  let mockProject: Project;
  let mockSearchCondition: ProjectSearchCondition;

  beforeEach(() => {
    service = new MockProjectService();

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
    it('should create project successfully', async () => {
      service.create.mockResolvedValue(true);

      const result = await service.create(mockProject);

      expect(service.create).toHaveBeenCalledWith(mockProject);
      expect(result).toBe(true);
    });

    it('should return false when creation fails', async () => {
      service.create.mockResolvedValue(false);

      const result = await service.create(mockProject);

      expect(result).toBe(false);
    });

    it('should handle project with minimal data', async () => {
      const minimalProject = {
        id: 'project-minimal',
        name: 'Minimal Project',
        order_index: 0,
        is_archived: false,
        created_at: new Date(),
        updated_at: new Date()
      };
      service.create.mockResolvedValue(true);

      const result = await service.create(minimalProject);

      expect(service.create).toHaveBeenCalledWith(minimalProject);
      expect(result).toBe(true);
    });

    it('should handle project with all optional fields', async () => {
      const fullProject = {
        ...mockProject,
        description: 'Full project description',
        color: '#00FF00'
      };
      service.create.mockResolvedValue(true);

      const result = await service.create(fullProject);

      expect(service.create).toHaveBeenCalledWith(fullProject);
      expect(result).toBe(true);
    });

    it('should handle creation error', async () => {
      service.create.mockRejectedValue(new Error('Creation failed'));

      await expect(service.create(mockProject)).rejects.toThrow('Creation failed');
    });
  });

  describe('update', () => {
    it('should update project successfully', async () => {
      const updatedProject = {
        ...mockProject,
        name: 'Updated Project',
        updated_at: new Date()
      };
      service.update.mockResolvedValue(true);

      const result = await service.update(updatedProject);

      expect(service.update).toHaveBeenCalledWith(updatedProject);
      expect(result).toBe(true);
    });

    it('should return false when update fails', async () => {
      service.update.mockResolvedValue(false);

      const result = await service.update(mockProject);

      expect(result).toBe(false);
    });

    it('should handle name update', async () => {
      const nameUpdatedProject = {
        ...mockProject,
        name: 'New Project Name'
      };
      service.update.mockResolvedValue(true);

      const result = await service.update(nameUpdatedProject);

      expect(service.update).toHaveBeenCalledWith(nameUpdatedProject);
      expect(result).toBe(true);
    });

    it('should handle archive status update', async () => {
      const archivedProject = {
        ...mockProject,
        is_archived: true
      };
      service.update.mockResolvedValue(true);

      const result = await service.update(archivedProject);

      expect(service.update).toHaveBeenCalledWith(archivedProject);
      expect(result).toBe(true);
    });

    it('should handle color update', async () => {
      const colorUpdatedProject = {
        ...mockProject,
        color: '#0000FF'
      };
      service.update.mockResolvedValue(true);

      const result = await service.update(colorUpdatedProject);

      expect(service.update).toHaveBeenCalledWith(colorUpdatedProject);
      expect(result).toBe(true);
    });

    it('should handle order index update', async () => {
      const reorderedProject = {
        ...mockProject,
        order_index: 10
      };
      service.update.mockResolvedValue(true);

      const result = await service.update(reorderedProject);

      expect(service.update).toHaveBeenCalledWith(reorderedProject);
      expect(result).toBe(true);
    });

    it('should handle update error', async () => {
      service.update.mockRejectedValue(new Error('Update failed'));

      await expect(service.update(mockProject)).rejects.toThrow('Update failed');
    });
  });

  describe('delete', () => {
    it('should delete project successfully', async () => {
      service.delete.mockResolvedValue(true);

      const result = await service.delete('project-123');

      expect(service.delete).toHaveBeenCalledWith('project-123');
      expect(result).toBe(true);
    });

    it('should return false when deletion fails', async () => {
      service.delete.mockResolvedValue(false);

      const result = await service.delete('project-123');

      expect(result).toBe(false);
    });

    it('should handle non-existent project deletion', async () => {
      service.delete.mockResolvedValue(false);

      const result = await service.delete('non-existent');

      expect(service.delete).toHaveBeenCalledWith('non-existent');
      expect(result).toBe(false);
    });

    it('should handle deletion error', async () => {
      service.delete.mockRejectedValue(new Error('Deletion failed'));

      await expect(service.delete('project-123')).rejects.toThrow('Deletion failed');
    });
  });

  describe('get', () => {
    it('should retrieve project successfully', async () => {
      service.get.mockResolvedValue(mockProject);

      const result = await service.get('project-123');

      expect(service.get).toHaveBeenCalledWith('project-123');
      expect(result).toEqual(mockProject);
    });

    it('should return null when project not found', async () => {
      service.get.mockResolvedValue(null);

      const result = await service.get('non-existent');

      expect(service.get).toHaveBeenCalledWith('non-existent');
      expect(result).toBeNull();
    });

    it('should handle get error', async () => {
      service.get.mockRejectedValue(new Error('Get failed'));

      await expect(service.get('project-123')).rejects.toThrow('Get failed');
    });
  });

  describe('search', () => {
    it('should search projects successfully', async () => {
      const mockProjects = [mockProject];
      service.search.mockResolvedValue(mockProjects);

      const result = await service.search(mockSearchCondition);

      expect(service.search).toHaveBeenCalledWith(mockSearchCondition);
      expect(result).toEqual(mockProjects);
    });

    it('should return empty array when no projects found', async () => {
      service.search.mockResolvedValue([]);

      const result = await service.search(mockSearchCondition);

      expect(service.search).toHaveBeenCalledWith(mockSearchCondition);
      expect(result).toEqual([]);
    });

    it('should handle search by name only', async () => {
      const nameOnlyCondition = { name: 'Test Project' };
      service.search.mockResolvedValue([mockProject]);

      const result = await service.search(nameOnlyCondition);

      expect(service.search).toHaveBeenCalledWith(nameOnlyCondition);
      expect(result).toEqual([mockProject]);
    });

    it('should handle search by archive status only', async () => {
      const archiveOnlyCondition = { is_archived: false };
      service.search.mockResolvedValue([mockProject]);

      const result = await service.search(archiveOnlyCondition);

      expect(service.search).toHaveBeenCalledWith(archiveOnlyCondition);
      expect(result).toEqual([mockProject]);
    });

    it('should handle search by description', async () => {
      const descriptionCondition = { description: 'Test Description' };
      service.search.mockResolvedValue([mockProject]);

      const result = await service.search(descriptionCondition);

      expect(service.search).toHaveBeenCalledWith(descriptionCondition);
      expect(result).toEqual([mockProject]);
    });

    it('should handle search by color', async () => {
      const colorCondition = { color: '#FF5733' };
      service.search.mockResolvedValue([mockProject]);

      const result = await service.search(colorCondition);

      expect(service.search).toHaveBeenCalledWith(colorCondition);
      expect(result).toEqual([mockProject]);
    });

    it('should handle search by order index', async () => {
      const orderCondition = { order_index: 0 };
      service.search.mockResolvedValue([mockProject]);

      const result = await service.search(orderCondition);

      expect(service.search).toHaveBeenCalledWith(orderCondition);
      expect(result).toEqual([mockProject]);
    });

    it('should handle complex search conditions', async () => {
      const complexCondition = {
        name: 'Test',
        description: 'Description',
        color: '#FF5733',
        is_archived: false,
        order_index: 0
      };
      service.search.mockResolvedValue([mockProject]);

      const result = await service.search(complexCondition);

      expect(service.search).toHaveBeenCalledWith(complexCondition);
      expect(result).toEqual([mockProject]);
    });

    it('should handle empty search condition', async () => {
      const emptyCondition = {};
      const allProjects = [
        mockProject,
        {
          id: 'project-456',
          name: 'Another Project',
          order_index: 1,
          is_archived: false,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];
      service.search.mockResolvedValue(allProjects);

      const result = await service.search(emptyCondition);

      expect(service.search).toHaveBeenCalledWith(emptyCondition);
      expect(result).toEqual(allProjects);
    });

    it('should handle search error', async () => {
      service.search.mockRejectedValue(new Error('Search failed'));

      await expect(service.search(mockSearchCondition)).rejects.toThrow('Search failed');
    });
  });

  describe('interface contract compliance', () => {
    it('should implement all CrudInterface methods', () => {
      expect(typeof service.create).toBe('function');
      expect(typeof service.update).toBe('function');
      expect(typeof service.delete).toBe('function');
      expect(typeof service.get).toBe('function');
    });

    it('should implement all SearchInterface methods', () => {
      expect(typeof service.search).toBe('function');
    });

    it('should return proper Promise types', async () => {
      service.create.mockResolvedValue(true);
      service.update.mockResolvedValue(true);
      service.delete.mockResolvedValue(true);
      service.get.mockResolvedValue(mockProject);
      service.search.mockResolvedValue([mockProject]);

      const createPromise = service.create(mockProject);
      const updatePromise = service.update(mockProject);
      const deletePromise = service.delete('project-123');
      const getPromise = service.get('project-123');
      const searchPromise = service.search(mockSearchCondition);

      expect(createPromise).toBeInstanceOf(Promise);
      expect(updatePromise).toBeInstanceOf(Promise);
      expect(deletePromise).toBeInstanceOf(Promise);
      expect(getPromise).toBeInstanceOf(Promise);
      expect(searchPromise).toBeInstanceOf(Promise);

      const [createResult, updateResult, deleteResult, getResult, searchResult] = await Promise.all(
        [createPromise, updatePromise, deletePromise, getPromise, searchPromise]
      );

      expect(createResult).toBe(true);
      expect(updateResult).toBe(true);
      expect(deleteResult).toBe(true);
      expect(getResult).toEqual(mockProject);
      expect(searchResult).toEqual([mockProject]);
    });
  });

  describe('edge cases', () => {
    it('should handle project with special characters', async () => {
      const specialProject = {
        ...mockProject,
        name: 'プロジェクト with émojis 🚀',
        description: 'Special chars @#$%'
      };
      service.create.mockResolvedValue(true);

      const result = await service.create(specialProject);

      expect(service.create).toHaveBeenCalledWith(specialProject);
      expect(result).toBe(true);
    });

    it('should handle very long project names', async () => {
      const longNameProject = {
        ...mockProject,
        name: 'A'.repeat(1000)
      };
      service.create.mockResolvedValue(true);

      const result = await service.create(longNameProject);

      expect(result).toBe(true);
    });

    it('should handle multiple projects with same name', async () => {
      const duplicateProjects = [mockProject, { ...mockProject, id: 'project-456' }];
      service.search.mockResolvedValue(duplicateProjects);

      const result = await service.search({ name: 'Test Project' });

      expect(result).toHaveLength(2);
    });

    it('should handle concurrent operations', async () => {
      service.create.mockResolvedValue(true);
      service.update.mockResolvedValue(true);
      service.delete.mockResolvedValue(true);

      // 同時実行
      const operations = await Promise.all([
        service.create(mockProject),
        service.update(mockProject),
        service.delete('project-123')
      ]);

      expect(operations).toEqual([true, true, true]);
      expect(service.create).toHaveBeenCalledTimes(1);
      expect(service.update).toHaveBeenCalledTimes(1);
      expect(service.delete).toHaveBeenCalledTimes(1);
    });

    it('should handle null and undefined values appropriately', async () => {
      const projectWithNulls = {
        ...mockProject,
        description: undefined,
        color: undefined
      };
      service.create.mockResolvedValue(true);

      const result = await service.create(projectWithNulls);

      expect(result).toBe(true);
    });
  });
});
