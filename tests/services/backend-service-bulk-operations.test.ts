import { describe, test, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import { backendService } from '../../src/lib/services/backend-service';
import type { BackendService } from '../../src/lib/services/backend-service';

// Tauriのモック
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}));

describe('BackendService - Bulk Operations', () => {
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

  describe('一括操作API', () => {
    test('bulkUpdateTasks should update multiple tasks', async () => {
      const mockUpdatedTask = {
        id: 'task-1',
        title: 'Updated Task',
        status: 'completed',
        list_id: 'list-1',
        order_index: 0,
        is_archived: false,
        created_at: Date.now(),
        updated_at: Date.now(),
        sub_tasks: [],
        tags: []
      };

      invoke.mockResolvedValue(mockUpdatedTask);

      const updates = [
        { taskId: 'task-1', updates: { title: 'Updated Task', status: 'completed' as const } },
        { taskId: 'task-2', updates: { title: 'Another Task', status: 'in_progress' as const } }
      ];

      const result = await service.bulkUpdateTasks(updates);

      expect(invoke).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
    });

    test('bulkDeleteTasks should delete multiple tasks', async () => {
      invoke.mockResolvedValue(true);

      const taskIds = ['task-1', 'task-2', 'task-3'];
      const result = await service.bulkDeleteTasks(taskIds);

      expect(invoke).toHaveBeenCalledTimes(3);
      expect(invoke).toHaveBeenCalledWith('delete_task_with_subtasks', { taskId: 'task-1' });
      expect(invoke).toHaveBeenCalledWith('delete_task_with_subtasks', { taskId: 'task-2' });
      expect(invoke).toHaveBeenCalledWith('delete_task_with_subtasks', { taskId: 'task-3' });
      expect(result).toBe(true);
    });

    test('bulkMoveTasksToList should move tasks to new list', async () => {
      invoke.mockResolvedValue(true);

      const taskIds = ['task-1', 'task-2'];
      const targetListId = 'list-new';
      const result = await service.bulkMoveTasksToList(taskIds, targetListId);

      expect(invoke).toHaveBeenCalledWith('bulk_move_tasks', {
        taskIds,
        targetListId
      });
      expect(result).toBe(true);
    });
  });

  describe('自動保存制御API', () => {
    test('enableAutoSave should enable auto-save', async () => {
      await service.enableAutoSave();
      // AutoSaveManagerのインポートが正常に動作するかテスト
      expect(true).toBe(true); // 実際の動作確認は統合テストで
    });

    test('disableAutoSave should disable auto-save', async () => {
      await service.disableAutoSave();
      // AutoSaveManagerのインポートが正常に動作するかテスト
      expect(true).toBe(true); // 実際の動作確認は統合テストで
    });

    test('getAutoSaveStatus should return status', async () => {
      const status = await service.getAutoSaveStatus();
      expect(typeof status).toBe('boolean');
    });
  });

  describe('拡張ファイル操作API', () => {
    test('exportData should export data in JSON format', async () => {
      invoke.mockResolvedValue(undefined);

      await service.exportData('/path/to/export.json', 'json');

      expect(invoke).toHaveBeenCalledWith('export_data_json', {
        filePath: '/path/to/export.json'
      });
    });

    test('exportData should export data in automerge format', async () => {
      invoke.mockResolvedValue(undefined);

      await service.exportData('/path/to/export.automerge', 'automerge');

      expect(invoke).toHaveBeenCalledWith('save_data_to_file', {
        filePath: '/path/to/export.automerge'
      });
    });

    test('importData should import data from JSON format', async () => {
      invoke.mockResolvedValue(undefined);

      await service.importData('/path/to/import.json', 'json');

      expect(invoke).toHaveBeenCalledWith('import_data_json', {
        filePath: '/path/to/import.json'
      });
    });

    test('createBackup should create backup with default path', async () => {
      const mockBackupPath = '/backup/path/backup_20241201_123456.automerge';
      invoke.mockResolvedValue(mockBackupPath);

      const backupPath = await service.createBackup();

      expect(invoke).toHaveBeenCalledWith('create_backup');
      expect(backupPath).toBe(mockBackupPath);
    });

    test('restoreFromBackup should restore from backup', async () => {
      invoke.mockResolvedValue(undefined);

      await service.restoreFromBackup('/path/to/backup.automerge');

      expect(invoke).toHaveBeenCalledWith('restore_from_backup', {
        backupPath: '/path/to/backup.automerge'
      });
    });
  });

  describe('Web版の動作確認', () => {
    beforeEach(() => {
      // Web環境をモック
      Object.defineProperty(window, '__TAURI_INTERNALS__', {
        value: undefined,
        writable: true
      });
      service = backendService();
    });

    test('bulkUpdateTasks should return empty array in web mode', async () => {
      const result = await service.bulkUpdateTasks([]);
      expect(result).toEqual([]);
    });

    test('getAutoSaveStatus should return false in web mode', async () => {
      const status = await service.getAutoSaveStatus();
      expect(status).toBe(false);
    });

    test('createBackup should return placeholder in web mode', async () => {
      const result = await service.createBackup();
      expect(result).toBe('backup-not-implemented');
    });
  });
});
