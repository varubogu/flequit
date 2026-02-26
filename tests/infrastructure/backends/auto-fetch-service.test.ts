import { describe, it, expect, vi, beforeEach } from 'vitest';
import type {
  AutoFetchService,
  DataChangeNotification,
  DataType,
  ChangeType
} from '$lib/infrastructure/backends/auto-fetch-service';

// モックの自動更新サービス実装
class MockAutoFetchService implements AutoFetchService {
  private callbacks: Array<(notification: DataChangeNotification) => void> = [];
  private dataTypeCallbacks: Map<DataType, Array<(notification: DataChangeNotification) => void>> =
    new Map();

  // テスト用にモック化されたメソッド
  notifyDataChange = vi.fn(async (notification: DataChangeNotification) => {
    // 全体リスナーに通知
    this.callbacks.forEach((callback) => {
      try {
        callback(notification);
      } catch (error) {
        // エラーを記録するが処理は継続
        console.warn('Callback error:', error);
      }
    });

    // データタイプ固有リスナーに通知
    const typeCallbacks = this.dataTypeCallbacks.get(notification.dataType);
    if (typeCallbacks) {
      typeCallbacks.forEach((callback) => {
        try {
          callback(notification);
        } catch (error) {
          // エラーを記録するが処理は継続
          console.warn('Data type callback error:', error);
        }
      });
    }
  });

  subscribe = vi.fn((callback: (notification: DataChangeNotification) => void) => {
    this.callbacks.push(callback);
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  });

  subscribeToDataType = vi.fn(
    (dataType: DataType, callback: (notification: DataChangeNotification) => void) => {
      if (!this.dataTypeCallbacks.has(dataType)) {
        this.dataTypeCallbacks.set(dataType, []);
      }
      this.dataTypeCallbacks.get(dataType)!.push(callback);

      return () => {
        const callbacks = this.dataTypeCallbacks.get(dataType);
        if (callbacks) {
          const index = callbacks.indexOf(callback);
          if (index > -1) {
            callbacks.splice(index, 1);
          }
        }
      };
    }
  );

  // テスト用ヘルパーメソッド
  clearCallbacks() {
    this.callbacks = [];
    this.dataTypeCallbacks.clear();
  }
}

describe('AutoFetchService Interface', () => {
  let service: MockAutoFetchService;
  let mockNotification: DataChangeNotification;

  beforeEach(() => {
    service = new MockAutoFetchService();
    mockNotification = {
      dataType: 'project',
      changeType: 'create',
      id: 'project-123',
      timestamp: new Date('2024-01-01T00:00:00Z')
    };
    vi.clearAllMocks();
  });

  describe('notifyDataChange', () => {
    it('should notify data change successfully', async () => {
      await service.notifyDataChange(mockNotification);

      expect(service.notifyDataChange).toHaveBeenCalledWith(mockNotification);
      expect(service.notifyDataChange).toHaveBeenCalledTimes(1);
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

      for (const dataType of dataTypes) {
        const notification = {
          ...mockNotification,
          dataType,
          id: `${dataType}-123`
        };

        await service.notifyDataChange(notification);
        expect(service.notifyDataChange).toHaveBeenCalledWith(notification);
      }

      expect(service.notifyDataChange).toHaveBeenCalledTimes(dataTypes.length);
    });

    it('should handle different change types', async () => {
      const changeTypes: ChangeType[] = ['create', 'update', 'delete'];

      for (const changeType of changeTypes) {
        const notification = {
          ...mockNotification,
          changeType,
          id: `item-${changeType}`
        };

        await service.notifyDataChange(notification);
        expect(service.notifyDataChange).toHaveBeenCalledWith(notification);
      }

      expect(service.notifyDataChange).toHaveBeenCalledTimes(changeTypes.length);
    });

    it('should handle notification with current timestamp', async () => {
      const currentTime = new Date();
      const timeNotification = {
        ...mockNotification,
        timestamp: currentTime
      };

      await service.notifyDataChange(timeNotification);

      expect(service.notifyDataChange).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: currentTime
        })
      );
    });

    it('should notify all subscribers when data changes', async () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      service.subscribe(callback1);
      service.subscribe(callback2);

      await service.notifyDataChange(mockNotification);

      expect(callback1).toHaveBeenCalledWith(mockNotification);
      expect(callback2).toHaveBeenCalledWith(mockNotification);
    });

    it('should notify data type specific subscribers', async () => {
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
    });
  });

  describe('subscribe', () => {
    it('should register callback and return unsubscribe function', () => {
      const callback = vi.fn();

      const unsubscribe = service.subscribe(callback);

      expect(service.subscribe).toHaveBeenCalledWith(callback);
      expect(typeof unsubscribe).toBe('function');
    });

    it('should allow multiple subscribers', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();

      service.subscribe(callback1);
      service.subscribe(callback2);
      service.subscribe(callback3);

      expect(service.subscribe).toHaveBeenCalledTimes(3);
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

    it('should handle callback errors gracefully', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const errorCallback = vi.fn(() => {
        throw new Error('Callback error');
      });
      const normalCallback = vi.fn();

      service.subscribe(errorCallback);
      service.subscribe(normalCallback);

      // エラーが発生してもサービスは継続動作する
      await expect(service.notifyDataChange(mockNotification)).resolves.toBeUndefined();
      expect(errorCallback).toHaveBeenCalled();
      expect(normalCallback).toHaveBeenCalled();

      // エラーが警告として記録されたことを検証
      expect(consoleWarnSpy).toHaveBeenCalledWith('Callback error:', expect.any(Error));

      consoleWarnSpy.mockRestore();
    });
  });

  describe('subscribeToDataType', () => {
    it('should register data type specific callback', () => {
      const callback = vi.fn();

      const unsubscribe = service.subscribeToDataType('project', callback);

      expect(service.subscribeToDataType).toHaveBeenCalledWith('project', callback);
      expect(typeof unsubscribe).toBe('function');
    });

    it('should handle multiple data types', () => {
      const projectCallback = vi.fn();
      const taskCallback = vi.fn();
      const settingCallback = vi.fn();

      service.subscribeToDataType('project', projectCallback);
      service.subscribeToDataType('task', taskCallback);
      service.subscribeToDataType('setting', settingCallback);

      expect(service.subscribeToDataType).toHaveBeenCalledTimes(3);
    });

    it('should allow multiple callbacks per data type', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      service.subscribeToDataType('project', callback1);
      service.subscribeToDataType('project', callback2);

      expect(service.subscribeToDataType).toHaveBeenCalledTimes(2);
    });

    it('should unsubscribe from specific data type', async () => {
      const projectCallback1 = vi.fn();
      const projectCallback2 = vi.fn();

      const unsubscribe1 = service.subscribeToDataType('project', projectCallback1);
      service.subscribeToDataType('project', projectCallback2);

      // 最初の通知：両方のコールバックが呼ばれる
      await service.notifyDataChange(mockNotification);
      expect(projectCallback1).toHaveBeenCalledTimes(1);
      expect(projectCallback2).toHaveBeenCalledTimes(1);

      // 1つ目をアンサブスクライブ
      unsubscribe1();

      // 2回目の通知：2つ目のコールバックのみ呼ばれる
      await service.notifyDataChange(mockNotification);
      expect(projectCallback1).toHaveBeenCalledTimes(1); // 増えない
      expect(projectCallback2).toHaveBeenCalledTimes(2); // 増える
    });

    it('should only notify relevant data type subscribers', async () => {
      const projectCallback = vi.fn();
      const taskCallback = vi.fn();
      const tagCallback = vi.fn();

      service.subscribeToDataType('project', projectCallback);
      service.subscribeToDataType('task', taskCallback);
      service.subscribeToDataType('tag', tagCallback);

      // プロジェクト変更通知
      await service.notifyDataChange(mockNotification);
      expect(projectCallback).toHaveBeenCalledTimes(1);
      expect(taskCallback).toHaveBeenCalledTimes(0);
      expect(tagCallback).toHaveBeenCalledTimes(0);

      // タスク変更通知
      const taskNotification = {
        dataType: 'task' as const,
        changeType: 'update' as const,
        id: 'task-456',
        timestamp: new Date()
      };
      await service.notifyDataChange(taskNotification);
      expect(projectCallback).toHaveBeenCalledTimes(1);
      expect(taskCallback).toHaveBeenCalledTimes(1);
      expect(tagCallback).toHaveBeenCalledTimes(0);
    });
  });

  describe('complex scenarios', () => {
    it('should handle mixed subscribers correctly', async () => {
      const globalCallback = vi.fn();
      const projectCallback = vi.fn();
      const taskCallback = vi.fn();

      // グローバルサブスクライバーとデータタイプ固有サブスクライバーを混在
      service.subscribe(globalCallback);
      service.subscribeToDataType('project', projectCallback);
      service.subscribeToDataType('task', taskCallback);

      // プロジェクト変更通知
      await service.notifyDataChange(mockNotification);
      expect(globalCallback).toHaveBeenCalledTimes(1);
      expect(projectCallback).toHaveBeenCalledTimes(1);
      expect(taskCallback).toHaveBeenCalledTimes(0);

      // タスク変更通知
      const taskNotification = {
        dataType: 'task' as const,
        changeType: 'delete' as const,
        id: 'task-789',
        timestamp: new Date()
      };
      await service.notifyDataChange(taskNotification);
      expect(globalCallback).toHaveBeenCalledTimes(2);
      expect(projectCallback).toHaveBeenCalledTimes(1);
      expect(taskCallback).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid notifications', async () => {
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

    it('should handle notification with all data types and change types', async () => {
      const callback = vi.fn();
      service.subscribe(callback);

      const dataTypes: DataType[] = [
        'project',
        'tasklist',
        'task',
        'subtask',
        'tag',
        'setting',
        'account'
      ];
      const changeTypes: ChangeType[] = ['create', 'update', 'delete'];

      let callCount = 0;
      for (const dataType of dataTypes) {
        for (const changeType of changeTypes) {
          const notification = {
            dataType,
            changeType,
            id: `${dataType}-${changeType}-${Date.now()}`,
            timestamp: new Date()
          };
          await service.notifyDataChange(notification);
          callCount++;
        }
      }

      expect(callback).toHaveBeenCalledTimes(callCount);
      expect(callCount).toBe(dataTypes.length * changeTypes.length);
    });

    it('should clean up all subscriptions properly', async () => {
      const callbacks = [vi.fn(), vi.fn(), vi.fn()];
      const unsubscribers: Array<() => void> = [];

      // 複数のサブスクライバーを登録
      callbacks.forEach((callback) => {
        unsubscribers.push(service.subscribe(callback));
      });

      // 最初の通知：全てのコールバックが呼ばれる
      await service.notifyDataChange(mockNotification);
      callbacks.forEach((callback) => {
        expect(callback).toHaveBeenCalledTimes(1);
      });

      // 全てアンサブスクライブ
      unsubscribers.forEach((unsubscribe) => unsubscribe());

      // 2回目の通知：どのコールバックも呼ばれない
      await service.notifyDataChange(mockNotification);
      callbacks.forEach((callback) => {
        expect(callback).toHaveBeenCalledTimes(1); // 増えない
      });
    });
  });

  describe('interface contract compliance', () => {
    it('should implement all required methods', () => {
      expect(typeof service.notifyDataChange).toBe('function');
      expect(typeof service.subscribe).toBe('function');
      expect(typeof service.subscribeToDataType).toBe('function');
    });

    it('should return proper types', () => {
      const callback = vi.fn();

      // subscribe should return unsubscribe function
      const unsubscribe1 = service.subscribe(callback);
      expect(typeof unsubscribe1).toBe('function');

      // subscribeToDataType should return unsubscribe function
      const unsubscribe2 = service.subscribeToDataType('project', callback);
      expect(typeof unsubscribe2).toBe('function');

      // notifyDataChange should return Promise<void>
      const result = service.notifyDataChange(mockNotification);
      expect(result).toBeInstanceOf(Promise);
    });

    it('should handle edge cases gracefully', async () => {
      // Empty notification handling
      const emptyIdNotification = {
        ...mockNotification,
        id: ''
      };
      await expect(service.notifyDataChange(emptyIdNotification)).resolves.toBeUndefined();

      // Double unsubscribe should not cause errors
      const callback = vi.fn();
      const unsubscribe = service.subscribe(callback);
      unsubscribe();
      expect(() => unsubscribe()).not.toThrow();
    });
  });
});
