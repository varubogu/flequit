import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TasklistWebService } from '$lib/infrastructure/backends/web/tasklist-web-service';
import type { TaskList, TaskListSearchCondition } from '$lib/types/task-list';

describe('TasklistWebService', () => {
  let service: TasklistWebService;
  let mockTaskList: TaskList;
  let mockSearchCondition: TaskListSearchCondition;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    service = new TasklistWebService();

    mockTaskList = {
      id: 'tasklist-123',
      projectId: 'project-456',
      name: 'Development Tasks',
      description: 'Tasks related to development work',
      color: '#3498DB',
      orderIndex: 0,
      isArchived: false,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z')
    };

    mockSearchCondition = {
      projectId: 'project-456',
      isArchived: false
    };

    consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('create', () => {
    it('should return true and log warning for stub implementation', async () => {
      const result = await service.create('test-project-id', mockTaskList);

      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Web backends: createTaskList not implemented',
        'test-project-id',
        mockTaskList
      );
    });
  });

  describe('update', () => {
    it('should return true and log warning for stub implementation', async () => {
      const result = await service.update('test-project-id', mockTaskList.id, mockTaskList);

      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Web backends: updateTaskList not implemented',
        'test-project-id',
        mockTaskList.id,
        mockTaskList
      );
    });
  });

  describe('delete', () => {
    it('should return true and log warning for stub implementation', async () => {
      const result = await service.delete('test-project-id', 'tasklist-123');

      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Web backends: deleteTaskList not implemented',
        'test-project-id',
        'tasklist-123'
      );
    });
  });

  describe('get', () => {
    it('should return null and log warning for stub implementation', async () => {
      const result = await service.get('test-project-id', 'tasklist-123');

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Web backends: getTaskList not implemented',
        'test-project-id',
        'tasklist-123'
      );
    });
  });

  describe('search', () => {
    it('should return empty array and log warning for stub implementation', async () => {
      const result = await service.search('test-project-id', mockSearchCondition);

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Web backends: searchTaskLists not implemented',
        'test-project-id',
        mockSearchCondition
      );
    });
  });

  describe('interface compliance', () => {
    it('should implement all TaskListService methods', () => {
      expect(typeof service.create).toBe('function');
      expect(typeof service.update).toBe('function');
      expect(typeof service.delete).toBe('function');
      expect(typeof service.get).toBe('function');
      expect(typeof service.search).toBe('function');
    });

    it('should return proper Promise types', async () => {
      const [createResult, updateResult, deleteResult, getResult, searchResult] = await Promise.all(
        [
          service.create('test-project-id', mockTaskList),
          service.update('test-project-id', mockTaskList.id, mockTaskList),
          service.delete('test-project-id', 'tasklist-123'),
          service.get('test-project-id', 'tasklist-123'),
          service.search('test-project-id', mockSearchCondition)
        ]
      );

      expect(createResult).toBe(true);
      expect(updateResult).toBe(true);
      expect(deleteResult).toBe(true);
      expect(getResult).toBeNull();
      expect(searchResult).toEqual([]);
    });
  });

  describe('concurrent operations', () => {
    it('should handle concurrent operations without side effects', async () => {
      const operations = await Promise.all([
        service.create('test-project-id', mockTaskList),
        service.get('test-project-id', 'tasklist-123'),
        service.update('test-project-id', mockTaskList.id, mockTaskList),
        service.delete('test-project-id', 'tasklist-123'),
        service.search('test-project-id', mockSearchCondition)
      ]);

      expect(operations).toEqual([true, null, true, true, []]);
      expect(consoleSpy).toHaveBeenCalledTimes(5);
    });
  });
});
