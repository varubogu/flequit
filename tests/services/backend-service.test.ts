import { describe, test, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import { backendService } from '../../src/lib/services/backend-service';
import type { BackendService } from '../../src/lib/services/backend-service';

// Tauriのモック
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}));

describe('BackendService', () => {
  let service: BackendService;
  let invoke: MockedFunction<typeof import('@tauri-apps/api/core').invoke>;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Tauriフラグをモック
    Object.defineProperty(window, '__TAURI_INTERNALS__', {
      value: true,
      writable: true
    });

    // invokeをモックから取得
    const tauriCore = await import('@tauri-apps/api/core');
    invoke = vi.mocked(tauriCore.invoke);

    service = backendService();
  });

  describe('サブタスク管理', () => {
    test('createSubTask should create subtask through Tauri', async () => {
      const mockSubTask = {
        id: 'subtask-123',
        task_id: 'task-1',
        title: 'Test SubTask',
        description: 'Test description',
        status: 'not_started',
        priority: 1,
        order_index: 0,
        is_archived: false,
        start_date: undefined,
        end_date: undefined,
        created_at: Date.now(),
        updated_at: Date.now(),
        tags: []
      };

      invoke.mockResolvedValue(mockSubTask);

      const result = await service.createSubTask('task-1', {
        title: 'Test SubTask',
        description: 'Test description',
        status: 'not_started',
        priority: 1
      });

      expect(invoke).toHaveBeenCalledWith('create_subtask', {
        taskId: 'task-1',
        title: 'Test SubTask',
        description: 'Test description',
        status: 'not_started',
        priority: 1
      });

      expect(result).toEqual({
        ...mockSubTask,
        created_at: expect.any(Date),
        updated_at: expect.any(Date)
      });
    });

    test('updateSubTask should update subtask through Tauri', async () => {
      const mockUpdatedSubTask = {
        id: 'subtask-123',
        task_id: 'task-1',
        title: 'Updated SubTask',
        description: 'Updated description',
        status: 'completed',
        priority: 2,
        order_index: 0,
        is_archived: false,
        start_date: undefined,
        end_date: undefined,
        created_at: Date.now(),
        updated_at: Date.now(),
        tags: []
      };

      invoke.mockResolvedValue(mockUpdatedSubTask);

      const result = await service.updateSubTask('subtask-123', {
        title: 'Updated SubTask',
        description: 'Updated description',
        status: 'completed',
        priority: 2
      });

      expect(invoke).toHaveBeenCalledWith('update_subtask', {
        subtaskId: 'subtask-123',
        title: 'Updated SubTask',
        description: 'Updated description',
        status: 'completed',
        priority: 2
      });

      expect(result).toEqual({
        ...mockUpdatedSubTask,
        created_at: expect.any(Date),
        updated_at: expect.any(Date)
      });
    });

    test('deleteSubTask should delete subtask through Tauri', async () => {
      invoke.mockResolvedValue(true);

      const result = await service.deleteSubTask('subtask-123');

      expect(invoke).toHaveBeenCalledWith('delete_subtask', {
        subtaskId: 'subtask-123'
      });

      expect(result).toBe(true);
    });
  });

  describe('タグ管理', () => {
    test('createTag should create tag through Tauri', async () => {
      const mockTag = {
        id: 'tag-123',
        name: 'Test Tag',
        color: '#ff0000',
        created_at: Date.now(),
        updated_at: Date.now()
      };

      invoke.mockResolvedValue(mockTag);

      const result = await service.createTag({
        name: 'Test Tag',
        color: '#ff0000'
      });

      expect(invoke).toHaveBeenCalledWith('create_tag', {
        name: 'Test Tag',
        color: '#ff0000'
      });

      expect(result).toEqual({
        ...mockTag,
        created_at: expect.any(Date),
        updated_at: expect.any(Date)
      });
    });

    test('updateTag should update tag through Tauri', async () => {
      const mockUpdatedTag = {
        id: 'tag-123',
        name: 'Updated Tag',
        color: '#00ff00',
        created_at: Date.now(),
        updated_at: Date.now()
      };

      invoke.mockResolvedValue(mockUpdatedTag);

      const result = await service.updateTag('tag-123', {
        name: 'Updated Tag',
        color: '#00ff00'
      });

      expect(invoke).toHaveBeenCalledWith('update_tag', {
        tagId: 'tag-123',
        name: 'Updated Tag',
        color: '#00ff00'
      });

      expect(result).toEqual({
        ...mockUpdatedTag,
        created_at: expect.any(Date),
        updated_at: expect.any(Date)
      });
    });

    test('deleteTag should delete tag through Tauri', async () => {
      invoke.mockResolvedValue(true);

      const result = await service.deleteTag('tag-123');

      expect(invoke).toHaveBeenCalledWith('delete_tag', {
        tagId: 'tag-123'
      });

      expect(result).toBe(true);
    });

    test('getAllTags should get all tags through Tauri', async () => {
      const mockTags = [
        {
          id: 'tag-1',
          name: 'Tag 1',
          color: '#ff0000',
          created_at: Date.now(),
          updated_at: Date.now()
        },
        {
          id: 'tag-2',
          name: 'Tag 2',
          color: '#00ff00',
          created_at: Date.now(),
          updated_at: Date.now()
        }
      ];

      invoke.mockResolvedValue(mockTags);

      const result = await service.getAllTags();

      expect(invoke).toHaveBeenCalledWith('get_all_tags');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        ...mockTags[0],
        created_at: expect.any(Date),
        updated_at: expect.any(Date)
      });
      expect(result[1]).toEqual({
        ...mockTags[1],
        created_at: expect.any(Date),
        updated_at: expect.any(Date)
      });
    });

    test('addTagToTask should add tag to task through Tauri', async () => {
      invoke.mockResolvedValue(true);

      const result = await service.addTagToTask('task-1', 'tag-123');

      expect(invoke).toHaveBeenCalledWith('add_tag_to_task', {
        taskId: 'task-1',
        tagId: 'tag-123'
      });

      expect(result).toBe(true);
    });

    test('removeTagFromTask should remove tag from task through Tauri', async () => {
      invoke.mockResolvedValue(true);

      const result = await service.removeTagFromTask('task-1', 'tag-123');

      expect(invoke).toHaveBeenCalledWith('remove_tag_from_task', {
        taskId: 'task-1',
        tagId: 'tag-123'
      });

      expect(result).toBe(true);
    });
  });

  describe('Web版の動作確認', () => {
    beforeEach(() => {
      // Tauriフラグを無効化
      Object.defineProperty(window, '__TAURI_INTERNALS__', {
        value: false,
        writable: true
      });
      service = backendService();
    });

    test('createSubTask should return dummy data in web mode', async () => {
      const result = await service.createSubTask('task-1', {
        title: 'Web SubTask'
      });

      expect(result.id).toBeDefined();
      expect(result.task_id).toBe('task-1');
      expect(result.title).toBe('Web SubTask');
      expect(result.status).toBe('not_started');
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    test('createTag should return dummy data in web mode', async () => {
      const result = await service.createTag({
        name: 'Web Tag',
        color: '#blue'
      });

      expect(result.id).toBeDefined();
      expect(result.name).toBe('Web Tag');
      expect(result.color).toBe('#blue');
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    test('getAllTags should return empty array in web mode', async () => {
      const result = await service.getAllTags();

      expect(result).toEqual([]);
    });
  });
});
