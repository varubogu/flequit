import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AutoFetchTauriService } from '$lib/services/backend/tauri/auto-fetch-tauri-service';
import type {
  DataChangeNotification,
  DataType,
  ChangeType
} from '$lib/services/backend/auto-fetch-service';

describe('AutoFetchTauriService', () => {
  let service: AutoFetchTauriService;
  let mockNotification: DataChangeNotification;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    service = new AutoFetchTauriService();
    mockNotification = {
      dataType: 'project',
      changeType: 'create',
      id: 'project-123',
      timestamp: new Date('2024-01-01T00:00:00Z')
    };

    // console.errorをモック化
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('notifyDataChange', () => {
    it('should notify data change successfully', async () => {
      const callback = vi.fn();
      service.subscribe(callback);

      await service.notifyDataChange(mockNotification);

      expect(callback).toHaveBeenCalledWith(mockNotification);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should notify multiple global listeners', async () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();

      service.subscribe(callback1);
      service.subscribe(callback2);
      service.subscribe(callback3);

      await service.notifyDataChange(mockNotification);

      expect(callback1).toHaveBeenCalledWith(mockNotification);
      expect(callback2).toHaveBeenCalledWith(mockNotification);
      expect(callback3).toHaveBeenCalledWith(mockNotification);
    });

    it('should notify data type specific listeners', async () => {
      const projectCallback = vi.fn();
      const taskCallback = vi.fn();

      service.subscribeToDataType('project', projectCallback);
      service.subscribeToDataType('task', taskCallback);

      // プロジェクト変更通知
      await service.notifyDataChange(mockNotification);

      expect(projectCallback).toHaveBeenCalledWith(mockNotification);
      expect(taskCallback).not.toHaveBeenCalled();

      // タスク変更通知
      const taskNotification = {
        ...mockNotification,
        dataType: 'task' as const,
        id: 'task-456'
      };
      await service.notifyDataChange(taskNotification);

      expect(taskCallback).toHaveBeenCalledWith(taskNotification);
      expect(projectCallback).toHaveBeenCalledTimes(1); // 変わらず
    });

    it('should notify both global and type-specific listeners', async () => {
      const globalCallback = vi.fn();
      const projectCallback = vi.fn();

      service.subscribe(globalCallback);
      service.subscribeToDataType('project', projectCallback);

      await service.notifyDataChange(mockNotification);

      expect(globalCallback).toHaveBeenCalledWith(mockNotification);
      expect(projectCallback).toHaveBeenCalledWith(mockNotification);
    });

    it('should handle errors in global listeners gracefully', async () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Listener error');
      });
      const normalCallback = vi.fn();

      service.subscribe(errorCallback);
      service.subscribe(normalCallback);

      await service.notifyDataChange(mockNotification);

      expect(errorCallback).toHaveBeenCalled();
      expect(normalCallback).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Error in data change listener:', expect.any(Error));
    });

    it('should handle errors in type-specific listeners gracefully', async () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Type listener error');
      });
      const normalCallback = vi.fn();

      service.subscribeToDataType('project', errorCallback);
      service.subscribeToDataType('project', normalCallback);

      await service.notifyDataChange(mockNotification);

      expect(errorCallback).toHaveBeenCalled();
      expect(normalCallback).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error in type-specific data change listener:',
        expect.any(Error)
      );
    });

    it('should handle different data types', async () => {
      const dataTypes: DataType[] = [
        'project',
        'tasklist',
        'task',
        'subtask',
        'tag',
        'setting',
        'account'
      ];
      const callbacks = dataTypes.map(() => vi.fn());

      // 各データタイプにリスナーを登録
      dataTypes.forEach((dataType, index) => {
        service.subscribeToDataType(dataType, callbacks[index]);
      });

      // 各データタイプの通知をテスト
      for (let i = 0; i < dataTypes.length; i++) {
        const notification = {
          ...mockNotification,
          dataType: dataTypes[i],
          id: `${dataTypes[i]}-${i}`
        };

        await service.notifyDataChange(notification);

        // 対応するコールバックのみが呼ばれることを確認
        expect(callbacks[i]).toHaveBeenCalledWith(notification);

        // 他のコールバックは呼ばれていないことを確認
        callbacks.forEach((callback, j) => {
          if (i !== j) {
            expect(callback).not.toHaveBeenCalled();
          }
        });

        // 次のテストのためにモックをリセット
        callbacks.forEach((callback) => callback.mockReset());
      }
    });

    it('should handle different change types', async () => {
      const changeTypes: ChangeType[] = ['create', 'update', 'delete'];
      const callback = vi.fn();

      service.subscribe(callback);

      for (const changeType of changeTypes) {
        const notification = {
          ...mockNotification,
          changeType,
          id: `item-${changeType}`
        };

        await service.notifyDataChange(notification);
        expect(callback).toHaveBeenCalledWith(notification);
      }

      expect(callback).toHaveBeenCalledTimes(changeTypes.length);
    });
  });

  describe('subscribe', () => {
    it('should register callback and return unsubscribe function', () => {
      const callback = vi.fn();

      const unsubscribe = service.subscribe(callback);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should allow multiple subscribers', async () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      service.subscribe(callback1);
      service.subscribe(callback2);

      await service.notifyDataChange(mockNotification);

      expect(callback1).toHaveBeenCalledWith(mockNotification);
      expect(callback2).toHaveBeenCalledWith(mockNotification);
    });

    it('should unsubscribe correctly', async () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const unsubscribe1 = service.subscribe(callback1);
      service.subscribe(callback2);

      // 最初の通知：両方のコールバックが呼ばれる
      await service.notifyDataChange(mockNotification);
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);

      // 1つ目をアンサブスクライブ
      unsubscribe1();

      // 2回目の通知：2つ目のコールバックのみ呼ばれる
      await service.notifyDataChange(mockNotification);
      expect(callback1).toHaveBeenCalledTimes(1); // 増えない
      expect(callback2).toHaveBeenCalledTimes(2); // 増える
    });

    it('should handle double unsubscribe gracefully', () => {
      const callback = vi.fn();
      const unsubscribe = service.subscribe(callback);

      unsubscribe();
      expect(() => unsubscribe()).not.toThrow();
    });
  });

  describe('subscribeToDataType', () => {
    it('should register data type specific callback', () => {
      const callback = vi.fn();

      const unsubscribe = service.subscribeToDataType('project', callback);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should handle multiple callbacks per data type', async () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      service.subscribeToDataType('project', callback1);
      service.subscribeToDataType('project', callback2);

      await service.notifyDataChange(mockNotification);

      expect(callback1).toHaveBeenCalledWith(mockNotification);
      expect(callback2).toHaveBeenCalledWith(mockNotification);
    });

    it('should unsubscribe from specific data type correctly', async () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const unsubscribe1 = service.subscribeToDataType('project', callback1);
      service.subscribeToDataType('project', callback2);

      // 最初の通知：両方のコールバックが呼ばれる
      await service.notifyDataChange(mockNotification);
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);

      // 1つ目をアンサブスクライブ
      unsubscribe1();

      // 2回目の通知：2つ目のコールバックのみ呼ばれる
      await service.notifyDataChange(mockNotification);
      expect(callback1).toHaveBeenCalledTimes(1); // 増えない
      expect(callback2).toHaveBeenCalledTimes(2); // 増える
    });

    it('should clean up empty listener arrays', async () => {
      const callback = vi.fn();
      const unsubscribe = service.subscribeToDataType('project', callback);

      // コールバックが呼ばれることを確認
      await service.notifyDataChange(mockNotification);
      expect(callback).toHaveBeenCalledTimes(1);

      // アンサブスクライブ
      unsubscribe();

      // 空のリスナー配列がクリーンアップされたことを確認
      // （内部状態なので直接テストはできないが、メモリリークを防ぐ）
      await service.notifyDataChange(mockNotification);
      expect(callback).toHaveBeenCalledTimes(1); // 増えない
    });

    it('should handle multiple data types independently', async () => {
      const projectCallback = vi.fn();
      const taskCallback = vi.fn();
      const tagCallback = vi.fn();

      service.subscribeToDataType('project', projectCallback);
      service.subscribeToDataType('task', taskCallback);
      service.subscribeToDataType('tag', tagCallback);

      // プロジェクト通知
      await service.notifyDataChange(mockNotification);
      expect(projectCallback).toHaveBeenCalledTimes(1);
      expect(taskCallback).toHaveBeenCalledTimes(0);
      expect(tagCallback).toHaveBeenCalledTimes(0);

      // タスク通知
      const taskNotification = { ...mockNotification, dataType: 'task' as const };
      await service.notifyDataChange(taskNotification);
      expect(projectCallback).toHaveBeenCalledTimes(1);
      expect(taskCallback).toHaveBeenCalledTimes(1);
      expect(tagCallback).toHaveBeenCalledTimes(0);

      // タグ通知
      const tagNotification = { ...mockNotification, dataType: 'tag' as const };
      await service.notifyDataChange(tagNotification);
      expect(projectCallback).toHaveBeenCalledTimes(1);
      expect(taskCallback).toHaveBeenCalledTimes(1);
      expect(tagCallback).toHaveBeenCalledTimes(1);
    });
  });

  describe('complex scenarios', () => {
    it('should handle mixed global and type-specific subscriptions', async () => {
      const globalCallback = vi.fn();
      const projectCallback = vi.fn();
      const taskCallback = vi.fn();

      service.subscribe(globalCallback);
      service.subscribeToDataType('project', projectCallback);
      service.subscribeToDataType('task', taskCallback);

      // プロジェクト通知
      await service.notifyDataChange(mockNotification);
      expect(globalCallback).toHaveBeenCalledTimes(1);
      expect(projectCallback).toHaveBeenCalledTimes(1);
      expect(taskCallback).toHaveBeenCalledTimes(0);

      // タスク通知
      const taskNotification = { ...mockNotification, dataType: 'task' as const };
      await service.notifyDataChange(taskNotification);
      expect(globalCallback).toHaveBeenCalledTimes(2);
      expect(projectCallback).toHaveBeenCalledTimes(1);
      expect(taskCallback).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid consecutive notifications', async () => {
      const callback = vi.fn();
      service.subscribe(callback);

      const notifications = [
        { ...mockNotification, id: 'item-1' },
        { ...mockNotification, id: 'item-2', changeType: 'update' as const },
        { ...mockNotification, id: 'item-3', changeType: 'delete' as const }
      ];

      // 連続通知
      for (const notification of notifications) {
        await service.notifyDataChange(notification);
      }

      expect(callback).toHaveBeenCalledTimes(3);
      expect(callback).toHaveBeenNthCalledWith(1, notifications[0]);
      expect(callback).toHaveBeenNthCalledWith(2, notifications[1]);
      expect(callback).toHaveBeenNthCalledWith(3, notifications[2]);
    });

    it('should maintain listener order', async () => {
      const callOrder: number[] = [];
      const callback1 = vi.fn(() => callOrder.push(1));
      const callback2 = vi.fn(() => callOrder.push(2));
      const callback3 = vi.fn(() => callOrder.push(3));

      service.subscribe(callback1);
      service.subscribe(callback2);
      service.subscribe(callback3);

      await service.notifyDataChange(mockNotification);

      expect(callOrder).toEqual([1, 2, 3]);
    });

    it('should handle concurrent notifications', async () => {
      const callback = vi.fn();
      service.subscribe(callback);

      // 並行通知
      const promises = [
        service.notifyDataChange({ ...mockNotification, id: 'concurrent-1' }),
        service.notifyDataChange({ ...mockNotification, id: 'concurrent-2' }),
        service.notifyDataChange({ ...mockNotification, id: 'concurrent-3' })
      ];

      await Promise.all(promises);

      expect(callback).toHaveBeenCalledTimes(3);
    });

    it('should handle large number of listeners', async () => {
      const callbacks = Array.from({ length: 100 }, () => vi.fn());

      // 100個のリスナーを登録
      callbacks.forEach((callback) => service.subscribe(callback));

      await service.notifyDataChange(mockNotification);

      // 全てのコールバックが呼ばれることを確認
      callbacks.forEach((callback) => {
        expect(callback).toHaveBeenCalledWith(mockNotification);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle notifications with special characters', async () => {
      const callback = vi.fn();
      service.subscribe(callback);

      const specialNotification = {
        ...mockNotification,
        id: 'プロジェクト-123_@#$%^&*()'
      };

      await service.notifyDataChange(specialNotification);

      expect(callback).toHaveBeenCalledWith(specialNotification);
    });

    it('should handle empty listener arrays gracefully', async () => {
      // リスナーなしで通知を送信
      await expect(service.notifyDataChange(mockNotification)).resolves.toBeUndefined();
    });

    it('should handle unsubscribe of non-existent callback', () => {
      const callback = vi.fn();
      const unsubscribe = service.subscribe(callback);

      unsubscribe(); // 正常なアンサブスクライブ

      expect(() => unsubscribe()).not.toThrow(); // 2回目のアンサブスクライブでもエラーにならない
    });

    it('should handle subscription and immediate unsubscription', async () => {
      const callback = vi.fn();
      const unsubscribe = service.subscribe(callback);

      unsubscribe(); // 即座にアンサブスクライブ

      await service.notifyDataChange(mockNotification);

      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle very long data type names', async () => {
      const longDataType = 'very_long_data_type_name_that_exceeds_normal_length_limits_'.repeat(10);
      const callback = vi.fn();

      service.subscribeToDataType(longDataType, callback);

      const longTypeNotification = {
        ...mockNotification,
        dataType: longDataType as unknown as DataType
      };

      await service.notifyDataChange(longTypeNotification);

      expect(callback).toHaveBeenCalledWith(longTypeNotification);
    });
  });

  describe('memory management', () => {
    it('should properly clean up all listeners', async () => {
      const globalCallbacks = [vi.fn(), vi.fn(), vi.fn()];
      const projectCallbacks = [vi.fn(), vi.fn()];
      const taskCallbacks = [vi.fn()];

      // リスナーを登録
      const globalUnsubscribers = globalCallbacks.map((cb) => service.subscribe(cb));
      const projectUnsubscribers = projectCallbacks.map((cb) =>
        service.subscribeToDataType('project', cb)
      );
      const taskUnsubscribers = taskCallbacks.map((cb) => service.subscribeToDataType('task', cb));

      // 通知が正常に動作することを確認
      await service.notifyDataChange(mockNotification);
      globalCallbacks.forEach((cb) => expect(cb).toHaveBeenCalledTimes(1));
      projectCallbacks.forEach((cb) => expect(cb).toHaveBeenCalledTimes(1));
      taskCallbacks.forEach((cb) => expect(cb).toHaveBeenCalledTimes(0));

      // 全てのリスナーをアンサブスクライブ
      globalUnsubscribers.forEach((unsub) => unsub());
      projectUnsubscribers.forEach((unsub) => unsub());
      taskUnsubscribers.forEach((unsub) => unsub());

      // アンサブスクライブ後は通知が届かないことを確認
      await service.notifyDataChange(mockNotification);
      globalCallbacks.forEach((cb) => expect(cb).toHaveBeenCalledTimes(1)); // 増えない
      projectCallbacks.forEach((cb) => expect(cb).toHaveBeenCalledTimes(1)); // 増えない
      taskCallbacks.forEach((cb) => expect(cb).toHaveBeenCalledTimes(0)); // 変わらず
    });
  });
});
