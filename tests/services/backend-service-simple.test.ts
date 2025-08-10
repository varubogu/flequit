import { describe, test, expect, beforeEach } from 'vitest';
import { backendService } from '../../src/lib/services/backend/backend-service';
import type { BackendService } from '../../src/lib/services/backend/backend-service';

describe('BackendService (Simple Test)', () => {
  let service: BackendService;

  describe('Web版でのサブタスク管理', () => {
    beforeEach(() => {
      // Tauriフラグを無効化してWeb版をテスト
      Object.defineProperty(window, '__TAURI_INTERNALS__', {
        value: false,
        writable: true
      });
      service = backendService();
    });

    test('createSubTask should return dummy data in web mode', async () => {
      const result = await service.createSubTask('task-1', {
        title: 'Web SubTask',
        description: 'Description',
        status: 'in_progress',
        priority: 2
      });

      expect(result.id).toBeDefined();
      expect(result.task_id).toBe('task-1');
      expect(result.title).toBe('Web SubTask');
      expect(result.description).toBe('Description');
      expect(result.status).toBe('in_progress');
      expect(result.priority).toBe(2);
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
      expect(result.tags).toEqual([]);
    });

    test('updateSubTask should return dummy data in web mode', async () => {
      const result = await service.updateSubTask('subtask-123', {
        title: 'Updated Web SubTask',
        status: 'completed'
      });

      expect(result?.id).toBe('subtask-123');
      expect(result?.title).toBe('Updated Web SubTask');
      expect(result?.status).toBe('completed');
      expect(result?.created_at).toBeInstanceOf(Date);
      expect(result?.updated_at).toBeInstanceOf(Date);
    });

    test('deleteSubTask should return true in web mode', async () => {
      const result = await service.deleteSubTask('subtask-123');
      expect(result).toBe(true);
    });
  });

  describe('Web版でのタグ管理', () => {
    beforeEach(() => {
      // Tauriフラグを無効化してWeb版をテスト
      Object.defineProperty(window, '__TAURI_INTERNALS__', {
        value: false,
        writable: true
      });
      service = backendService();
    });

    test('createTag should return dummy data in web mode', async () => {
      const result = await service.createTag({
        name: 'Web Tag',
        color: '#ff5733'
      });

      expect(result.id).toBeDefined();
      expect(result.name).toBe('Web Tag');
      expect(result.color).toBe('#ff5733');
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    test('updateTag should return dummy data in web mode', async () => {
      const result = await service.updateTag('tag-123', {
        name: 'Updated Web Tag',
        color: '#33ff57'
      });

      expect(result?.id).toBe('tag-123');
      expect(result?.name).toBe('Updated Web Tag');
      expect(result?.color).toBe('#33ff57');
      expect(result?.created_at).toBeInstanceOf(Date);
      expect(result?.updated_at).toBeInstanceOf(Date);
    });

    test('deleteTag should return true in web mode', async () => {
      const result = await service.deleteTag('tag-123');
      expect(result).toBe(true);
    });

    test('getAllTags should return empty array in web mode', async () => {
      const result = await service.getAllTags();
      expect(result).toEqual([]);
    });

    test('addTagToTask should return true in web mode', async () => {
      const result = await service.addTagToTask('task-1', 'tag-123');
      expect(result).toBe(true);
    });

    test('removeTagFromTask should return true in web mode', async () => {
      const result = await service.removeTagFromTask('task-1', 'tag-123');
      expect(result).toBe(true);
    });

    test('addTagToSubTask should return true in web mode', async () => {
      const result = await service.addTagToSubTask('subtask-123', 'tag-456');
      expect(result).toBe(true);
    });

    test('removeTagFromSubTask should return true in web mode', async () => {
      const result = await service.removeTagFromSubTask('subtask-123', 'tag-456');
      expect(result).toBe(true);
    });
  });

  describe('BackendServiceインターフェースの確認', () => {
    beforeEach(() => {
      Object.defineProperty(window, '__TAURI_INTERNALS__', {
        value: false,
        writable: true
      });
      service = backendService();
    });

    test('should have all required subtask management methods', () => {
      expect(typeof service.createSubTask).toBe('function');
      expect(typeof service.updateSubTask).toBe('function');
      expect(typeof service.deleteSubTask).toBe('function');
    });

    test('should have all required tag management methods', () => {
      expect(typeof service.createTag).toBe('function');
      expect(typeof service.updateTag).toBe('function');
      expect(typeof service.deleteTag).toBe('function');
      expect(typeof service.getAllTags).toBe('function');
      expect(typeof service.addTagToTask).toBe('function');
      expect(typeof service.removeTagFromTask).toBe('function');
      expect(typeof service.addTagToSubTask).toBe('function');
      expect(typeof service.removeTagFromSubTask).toBe('function');
    });

    test('should have auto save method', () => {
      expect(typeof service.autoSave).toBe('function');
    });
  });
});
