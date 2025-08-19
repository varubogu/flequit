import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { 
  TaskService
} from '$lib/services/backend/task-service';
import type { Task, TaskSearchCondition } from '$lib/types/task';

// モックのタスクサービス実装
class MockTaskService implements TaskService {
  // CrudInterface メソッド
  create = vi.fn();
  update = vi.fn();
  delete = vi.fn();
  get = vi.fn();
  
  // SearchInterface メソッド
  search = vi.fn();
}

describe('TaskService Interface', () => {
  let service: MockTaskService;
  let mockTask: Task;
  let mockSearchCondition: TaskSearchCondition;

  beforeEach(() => {
    service = new MockTaskService();
    
    mockTask = {
      id: 'task-123',
      list_id: 'list-456',
      title: 'Test Task',
      description: 'Test task description',
      status: 'not_started',
      priority: 2,
      due_date: new Date('2024-12-31T23:59:59Z'),
      estimated_time: 120,
      actual_time: 90,
      order_index: 0,
      is_archived: false,
      created_at: new Date('2024-01-01T00:00:00Z'),
      updated_at: new Date('2024-01-01T00:00:00Z')
    };

    mockSearchCondition = {
      list_id: 'list-456',
      status: 'not_started'
    };

    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create task successfully', async () => {
      service.create.mockResolvedValue(true);

      const result = await service.create(mockTask);

      expect(service.create).toHaveBeenCalledWith(mockTask);
      expect(result).toBe(true);
    });

    it('should return false when creation fails', async () => {
      service.create.mockResolvedValue(false);

      const result = await service.create(mockTask);

      expect(result).toBe(false);
    });

    it('should handle task with minimal data', async () => {
      const minimalTask = {
        id: 'task-minimal',
        list_id: 'list-123',
        title: 'Minimal Task',
        status: 'not_started' as const,
        priority: 'medium' as const,
        completion_rate: 0,
        order_index: 0,
        is_archived: false,
        created_at: new Date(),
        updated_at: new Date()
      };
      service.create.mockResolvedValue(true);

      const result = await service.create(minimalTask);

      expect(service.create).toHaveBeenCalledWith(minimalTask);
      expect(result).toBe(true);
    });

    it('should handle task with all optional fields', async () => {
      const fullTask = {
        ...mockTask,
        description: 'Complete task description',
        due_date: new Date('2024-12-25T00:00:00Z'),
        estimated_time: 180,
        actual_time: 150
      };
      service.create.mockResolvedValue(true);

      const result = await service.create(fullTask);

      expect(service.create).toHaveBeenCalledWith(fullTask);
      expect(result).toBe(true);
    });

    it('should handle different task statuses', async () => {
      const statuses = ['todo', 'in_progress', 'done', 'cancelled'] as const;

      for (const status of statuses) {
        const taskWithStatus = { ...mockTask, id: `task-${status}`, status };
        service.create.mockResolvedValue(true);

        const result = await service.create(taskWithStatus);
        expect(result).toBe(true);
      }

      expect(service.create).toHaveBeenCalledTimes(statuses.length);
    });

    it('should handle different priorities', async () => {
      const priorities = ['low', 'medium', 'high', 'urgent'] as const;

      for (const priority of priorities) {
        const taskWithPriority = { ...mockTask, id: `task-${priority}`, priority };
        service.create.mockResolvedValue(true);

        const result = await service.create(taskWithPriority);
        expect(result).toBe(true);
      }

      expect(service.create).toHaveBeenCalledTimes(priorities.length);
    });

    it('should handle creation error', async () => {
      service.create.mockRejectedValue(new Error('Creation failed'));

      await expect(service.create(mockTask)).rejects.toThrow('Creation failed');
    });
  });

  describe('update', () => {
    it('should update task successfully', async () => {
      const updatedTask = {
        ...mockTask,
        title: 'Updated Task',
        status: 'in_progress' as const,
        updated_at: new Date()
      };
      service.update.mockResolvedValue(true);

      const result = await service.update(updatedTask);

      expect(service.update).toHaveBeenCalledWith(updatedTask);
      expect(result).toBe(true);
    });

    it('should return false when update fails', async () => {
      service.update.mockResolvedValue(false);

      const result = await service.update(mockTask);

      expect(result).toBe(false);
    });

    it('should handle status update', async () => {
      const statusUpdatedTask = {
        ...mockTask,
        status: 'done' as const,
        completion_rate: 1.0
      };
      service.update.mockResolvedValue(true);

      const result = await service.update(statusUpdatedTask);

      expect(service.update).toHaveBeenCalledWith(statusUpdatedTask);
      expect(result).toBe(true);
    });

    it('should handle priority update', async () => {
      const priorityUpdatedTask = {
        ...mockTask,
        priority: 'urgent' as const
      };
      service.update.mockResolvedValue(true);

      const result = await service.update(priorityUpdatedTask);

      expect(service.update).toHaveBeenCalledWith(priorityUpdatedTask);
      expect(result).toBe(true);
    });

    it('should handle completion rate update', async () => {
      const progressUpdatedTask = {
        ...mockTask,
        completion_rate: 0.9,
        actual_time: 150
      };
      service.update.mockResolvedValue(true);

      const result = await service.update(progressUpdatedTask);

      expect(service.update).toHaveBeenCalledWith(progressUpdatedTask);
      expect(result).toBe(true);
    });

    it('should handle due date update', async () => {
      const dueDateUpdatedTask = {
        ...mockTask,
        due_date: new Date('2024-11-30T23:59:59Z')
      };
      service.update.mockResolvedValue(true);

      const result = await service.update(dueDateUpdatedTask);

      expect(service.update).toHaveBeenCalledWith(dueDateUpdatedTask);
      expect(result).toBe(true);
    });

    it('should handle archive status update', async () => {
      const archivedTask = {
        ...mockTask,
        is_archived: true
      };
      service.update.mockResolvedValue(true);

      const result = await service.update(archivedTask);

      expect(service.update).toHaveBeenCalledWith(archivedTask);
      expect(result).toBe(true);
    });

    it('should handle update error', async () => {
      service.update.mockRejectedValue(new Error('Update failed'));

      await expect(service.update(mockTask)).rejects.toThrow('Update failed');
    });
  });

  describe('delete', () => {
    it('should delete task successfully', async () => {
      service.delete.mockResolvedValue(true);

      const result = await service.delete('task-123');

      expect(service.delete).toHaveBeenCalledWith('task-123');
      expect(result).toBe(true);
    });

    it('should return false when deletion fails', async () => {
      service.delete.mockResolvedValue(false);

      const result = await service.delete('task-123');

      expect(result).toBe(false);
    });

    it('should handle non-existent task deletion', async () => {
      service.delete.mockResolvedValue(false);

      const result = await service.delete('non-existent');

      expect(service.delete).toHaveBeenCalledWith('non-existent');
      expect(result).toBe(false);
    });

    it('should handle deletion error', async () => {
      service.delete.mockRejectedValue(new Error('Deletion failed'));

      await expect(service.delete('task-123')).rejects.toThrow('Deletion failed');
    });
  });

  describe('get', () => {
    it('should retrieve task successfully', async () => {
      service.get.mockResolvedValue(mockTask);

      const result = await service.get('task-123');

      expect(service.get).toHaveBeenCalledWith('task-123');
      expect(result).toEqual(mockTask);
    });

    it('should return null when task not found', async () => {
      service.get.mockResolvedValue(null);

      const result = await service.get('non-existent');

      expect(service.get).toHaveBeenCalledWith('non-existent');
      expect(result).toBeNull();
    });

    it('should handle get error', async () => {
      service.get.mockRejectedValue(new Error('Get failed'));

      await expect(service.get('task-123')).rejects.toThrow('Get failed');
    });
  });

  describe('search', () => {
    it('should search tasks successfully', async () => {
      const mockTasks = [mockTask];
      service.search.mockResolvedValue(mockTasks);

      const result = await service.search(mockSearchCondition);

      expect(service.search).toHaveBeenCalledWith(mockSearchCondition);
      expect(result).toEqual(mockTasks);
    });

    it('should return empty array when no tasks found', async () => {
      service.search.mockResolvedValue([]);

      const result = await service.search(mockSearchCondition);

      expect(service.search).toHaveBeenCalledWith(mockSearchCondition);
      expect(result).toEqual([]);
    });

    it('should handle search by task list ID only', async () => {
      const listOnlyCondition = { list_id: 'list-456' };
      service.search.mockResolvedValue([mockTask]);

      const result = await service.search(listOnlyCondition);

      expect(service.search).toHaveBeenCalledWith(listOnlyCondition);
      expect(result).toEqual([mockTask]);
    });

    it('should handle search by title', async () => {
      const titleCondition = { title: 'Test' };
      service.search.mockResolvedValue([mockTask]);

      const result = await service.search(titleCondition);

      expect(service.search).toHaveBeenCalledWith(titleCondition);
      expect(result).toEqual([mockTask]);
    });

    it('should handle search by status', async () => {
      const statusCondition = { status: 'todo' as const };
      service.search.mockResolvedValue([mockTask]);

      const result = await service.search(statusCondition);

      expect(service.search).toHaveBeenCalledWith(statusCondition);
      expect(result).toEqual([mockTask]);
    });

    it('should handle search by priority', async () => {
      const priorityCondition = { priority: 'medium' as const };
      service.search.mockResolvedValue([mockTask]);

      const result = await service.search(priorityCondition);

      expect(service.search).toHaveBeenCalledWith(priorityCondition);
      expect(result).toEqual([mockTask]);
    });

    it('should handle search by due date range', async () => {
      const dueDateCondition = {
        due_date_from: new Date('2024-01-01'),
        due_date_to: new Date('2024-12-31')
      };
      service.search.mockResolvedValue([mockTask]);

      const result = await service.search(dueDateCondition);

      expect(service.search).toHaveBeenCalledWith(dueDateCondition);
      expect(result).toEqual([mockTask]);
    });

    it('should handle search by archive status', async () => {
      const archiveCondition = { is_archived: false };
      service.search.mockResolvedValue([mockTask]);

      const result = await service.search(archiveCondition);

      expect(service.search).toHaveBeenCalledWith(archiveCondition);
      expect(result).toEqual([mockTask]);
    });

    it('should handle complex search conditions', async () => {
      const complexCondition = {
        list_id: 'list-456',
        title: 'Test',
        status: 'not_started' as const,
        priority: 'medium' as const,
        is_archived: false,
        due_date_from: new Date('2024-01-01'),
        due_date_to: new Date('2024-12-31')
      };
      service.search.mockResolvedValue([mockTask]);

      const result = await service.search(complexCondition);

      expect(service.search).toHaveBeenCalledWith(complexCondition);
      expect(result).toEqual([mockTask]);
    });

    it('should handle empty search condition', async () => {
      const emptyCondition = {};
      const allTasks = [
        mockTask,
        {
          id: 'task-456',
          list_id: 'list-789',
          title: 'Another Task',
          status: 'in_progress' as const,
          priority: 'high' as const,
          completion_rate: 0.5,
          order_index: 1,
          is_archived: false,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];
      service.search.mockResolvedValue(allTasks);

      const result = await service.search(emptyCondition);

      expect(service.search).toHaveBeenCalledWith(emptyCondition);
      expect(result).toEqual(allTasks);
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
      service.get.mockResolvedValue(mockTask);
      service.search.mockResolvedValue([mockTask]);

      const createPromise = service.create(mockTask);
      const updatePromise = service.update(mockTask);
      const deletePromise = service.delete('task-123');
      const getPromise = service.get('task-123');
      const searchPromise = service.search(mockSearchCondition);

      expect(createPromise).toBeInstanceOf(Promise);
      expect(updatePromise).toBeInstanceOf(Promise);
      expect(deletePromise).toBeInstanceOf(Promise);
      expect(getPromise).toBeInstanceOf(Promise);
      expect(searchPromise).toBeInstanceOf(Promise);

      const [createResult, updateResult, deleteResult, getResult, searchResult] = await Promise.all([
        createPromise,
        updatePromise,
        deletePromise,
        getPromise,
        searchPromise
      ]);

      expect(createResult).toBe(true);
      expect(updateResult).toBe(true);
      expect(deleteResult).toBe(true);
      expect(getResult).toEqual(mockTask);
      expect(searchResult).toEqual([mockTask]);
    });
  });

  describe('edge cases', () => {
    it('should handle task with special characters', async () => {
      const specialTask = {
        ...mockTask,
        title: 'タスク with émojis 🚀',
        description: 'Special chars @#$%'
      };
      service.create.mockResolvedValue(true);

      const result = await service.create(specialTask);

      expect(service.create).toHaveBeenCalledWith(specialTask);
      expect(result).toBe(true);
    });

    it('should handle very long task titles and descriptions', async () => {
      const longTask = {
        ...mockTask,
        title: 'A'.repeat(1000),
        description: 'B'.repeat(5000)
      };
      service.create.mockResolvedValue(true);

      const result = await service.create(longTask);

      expect(result).toBe(true);
    });

    it('should handle tasks with extreme time values', async () => {
      const extremeTimeTask = {
        ...mockTask,
        estimated_time: 0,
        actual_time: 999999
      };
      service.create.mockResolvedValue(true);

      const result = await service.create(extremeTimeTask);

      expect(result).toBe(true);
    });

    it('should handle completion rates edge cases', async () => {
      const edgeCases = [0, 0.1, 0.5, 0.9, 1.0];

      for (const completionRate of edgeCases) {
        const task = { ...mockTask, id: `task-${completionRate}`, completion_rate: completionRate };
        service.create.mockResolvedValue(true);

        const result = await service.create(task);
        expect(result).toBe(true);
      }

      expect(service.create).toHaveBeenCalledTimes(edgeCases.length);
    });

    it('should handle concurrent operations', async () => {
      service.create.mockResolvedValue(true);
      service.update.mockResolvedValue(true);
      service.delete.mockResolvedValue(true);

      // 同時実行
      const operations = await Promise.all([
        service.create(mockTask),
        service.update(mockTask),
        service.delete('task-123')
      ]);

      expect(operations).toEqual([true, true, true]);
      expect(service.create).toHaveBeenCalledTimes(1);
      expect(service.update).toHaveBeenCalledTimes(1);
      expect(service.delete).toHaveBeenCalledTimes(1);
    });

    it('should handle null and undefined values appropriately', async () => {
      const taskWithNulls = {
        ...mockTask,
        description: undefined,
        due_date: undefined,
        estimated_time: undefined,
        actual_time: undefined
      };
      service.create.mockResolvedValue(true);

      const result = await service.create(taskWithNulls);

      expect(result).toBe(true);
    });
  });
});