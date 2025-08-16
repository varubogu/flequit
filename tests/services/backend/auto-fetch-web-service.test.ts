import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AutoFetchWebService } from '$lib/services/backend/web/auto-fetch-web-service';
import type { DataChangeNotification, DataType, ChangeType } from '$lib/services/backend/auto-fetch-service';

describe('AutoFetchWebService', () => {
  let service: AutoFetchWebService;
  let mockNotification: DataChangeNotification;
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    service = new AutoFetchWebService();
    mockNotification = {
      dataType: 'project',
      changeType: 'create',
      id: 'project-123',
      timestamp: new Date('2024-01-01T00:00:00Z')
    };
    
    // console.warn と console.error をモック化
    consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('notifyDataChange', () => {
    it('should notify data change and log warning', async () => {
      const callback = vi.fn();
      service.subscribe(callback);

      await service.notifyDataChange(mockNotification);

      expect(callback).toHaveBeenCalledWith(mockNotification);
      expect(consoleSpy).toHaveBeenCalledWith('Web backend: notifyDataChange not fully implemented', mockNotification);
    });

    it('should notify multiple global listeners', async () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      service.subscribe(callback1);
      service.subscribe(callback2);

      await service.notifyDataChange(mockNotification);

      expect(callback1).toHaveBeenCalledWith(mockNotification);
      expect(callback2).toHaveBeenCalledWith(mockNotification);
      expect(consoleSpy).toHaveBeenCalledTimes(1);
    });

    it('should notify data type specific listeners', async () => {
      const projectCallback = vi.fn();
      const taskCallback = vi.fn();

      service.subscribeToDataType('project', projectCallback);
      service.subscribeToDataType('task', taskCallback);

      await service.notifyDataChange(mockNotification);
      
      expect(projectCallback).toHaveBeenCalledWith(mockNotification);
      expect(taskCallback).not.toHaveBeenCalled();
    });

    it('should handle errors in listeners gracefully', async () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Listener error');
      });
      const normalCallback = vi.fn();

      service.subscribe(errorCallback);
      service.subscribe(normalCallback);

      await service.notifyDataChange(mockNotification);

      expect(errorCallback).toHaveBeenCalled();
      expect(normalCallback).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error in data change listener:', expect.any(Error));
    });

    it('should handle different data types', async () => {
      const dataTypes: DataType[] = ['project', 'task', 'tag'];
      const callbacks = dataTypes.map(() => vi.fn());

      dataTypes.forEach((dataType, index) => {
        service.subscribeToDataType(dataType, callbacks[index]);
      });

      for (let i = 0; i < dataTypes.length; i++) {
        const notification = {
          ...mockNotification,
          dataType: dataTypes[i],
          id: `${dataTypes[i]}-${i}`
        };

        await service.notifyDataChange(notification);
        expect(callbacks[i]).toHaveBeenCalledWith(notification);
        
        callbacks.forEach(callback => callback.mockReset());
      }
    });
  });

  describe('subscribe', () => {
    it('should register callback and return unsubscribe function', () => {
      const callback = vi.fn();
      const unsubscribe = service.subscribe(callback);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should unsubscribe correctly', async () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const unsubscribe1 = service.subscribe(callback1);
      service.subscribe(callback2);

      await service.notifyDataChange(mockNotification);
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);

      unsubscribe1();

      await service.notifyDataChange(mockNotification);
      expect(callback1).toHaveBeenCalledTimes(1); // 増えない
      expect(callback2).toHaveBeenCalledTimes(2); // 増える
    });
  });

  describe('subscribeToDataType', () => {
    it('should register data type specific callback', () => {
      const callback = vi.fn();
      const unsubscribe = service.subscribeToDataType('project', callback);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should unsubscribe from specific data type correctly', async () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const unsubscribe1 = service.subscribeToDataType('project', callback1);
      service.subscribeToDataType('project', callback2);

      await service.notifyDataChange(mockNotification);
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);

      unsubscribe1();

      await service.notifyDataChange(mockNotification);
      expect(callback1).toHaveBeenCalledTimes(1); // 増えない
      expect(callback2).toHaveBeenCalledTimes(2); // 増える
    });

    it('should clean up empty listener arrays', async () => {
      const callback = vi.fn();
      const unsubscribe = service.subscribeToDataType('project', callback);

      await service.notifyDataChange(mockNotification);
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();

      await service.notifyDataChange(mockNotification);
      expect(callback).toHaveBeenCalledTimes(1); // 増えない
    });
  });

  describe('interface compliance', () => {
    it('should implement all AutoFetchService methods', () => {
      expect(typeof service.notifyDataChange).toBe('function');
      expect(typeof service.subscribe).toBe('function');
      expect(typeof service.subscribeToDataType).toBe('function');
    });

    it('should return proper Promise and function types', async () => {
      const callback = vi.fn();
      
      const subscribeResult = service.subscribe(callback);
      const subscribeToDataTypeResult = service.subscribeToDataType('project', callback);
      const notifyResult = service.notifyDataChange(mockNotification);

      expect(typeof subscribeResult).toBe('function');
      expect(typeof subscribeToDataTypeResult).toBe('function');
      expect(notifyResult).toBeInstanceOf(Promise);

      await notifyResult;
    });
  });

  describe('web-specific behavior', () => {
    it('should log appropriate warning for web environment limitation', async () => {
      await service.notifyDataChange(mockNotification);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Web backend: notifyDataChange not fully implemented', 
        mockNotification
      );
    });

    it('should still perform local notifications despite warning', async () => {
      const globalCallback = vi.fn();
      const projectCallback = vi.fn();

      service.subscribe(globalCallback);
      service.subscribeToDataType('project', projectCallback);

      await service.notifyDataChange(mockNotification);

      expect(globalCallback).toHaveBeenCalledWith(mockNotification);
      expect(projectCallback).toHaveBeenCalledWith(mockNotification);
      expect(consoleSpy).toHaveBeenCalledTimes(1);
    });

    it('should maintain consistent warning messages', async () => {
      const notifications = [
        { ...mockNotification, id: 'item-1' },
        { ...mockNotification, id: 'item-2', dataType: 'task' as const },
        { ...mockNotification, id: 'item-3', changeType: 'update' as const }
      ];

      for (const notification of notifications) {
        await service.notifyDataChange(notification);
      }

      expect(consoleSpy).toHaveBeenCalledTimes(3);
      consoleSpy.mock.calls.forEach(call => {
        expect(call[0]).toBe('Web backend: notifyDataChange not fully implemented');
      });
    });
  });

  describe('concurrent operations', () => {
    it('should handle concurrent notifications', async () => {
      const callback = vi.fn();
      service.subscribe(callback);

      const promises = [
        service.notifyDataChange({ ...mockNotification, id: 'concurrent-1' }),
        service.notifyDataChange({ ...mockNotification, id: 'concurrent-2' }),
        service.notifyDataChange({ ...mockNotification, id: 'concurrent-3' })
      ];

      await Promise.all(promises);

      expect(callback).toHaveBeenCalledTimes(3);
      expect(consoleSpy).toHaveBeenCalledTimes(3);
    });

    it('should handle subscription and notification concurrency', async () => {
      const callbacks = [vi.fn(), vi.fn(), vi.fn()];
      
      // 並行してサブスクリプション登録と通知
      const operations = await Promise.all([
        Promise.resolve(service.subscribe(callbacks[0])),
        Promise.resolve(service.subscribe(callbacks[1])),
        service.notifyDataChange(mockNotification),
        Promise.resolve(service.subscribe(callbacks[2]))
      ]);

      // 追加の通知で全てのコールバックが動作することを確認
      await service.notifyDataChange(mockNotification);

      callbacks.forEach(callback => {
        expect(callback).toHaveBeenCalledWith(mockNotification);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle notifications with no listeners', async () => {
      await service.notifyDataChange(mockNotification);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Web backend: notifyDataChange not fully implemented', 
        mockNotification
      );
    });

    it('should handle special characters in notifications', async () => {
      const specialNotification = {
        ...mockNotification,
        id: 'プロジェクト-123_@#$%^&*()'
      };

      const callback = vi.fn();
      service.subscribe(callback);

      await service.notifyDataChange(specialNotification);

      expect(callback).toHaveBeenCalledWith(specialNotification);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Web backend: notifyDataChange not fully implemented', 
        specialNotification
      );
    });

    it('should handle double unsubscribe gracefully', () => {
      const callback = vi.fn();
      const unsubscribe = service.subscribe(callback);

      unsubscribe();
      expect(() => unsubscribe()).not.toThrow();
    });
  });
});