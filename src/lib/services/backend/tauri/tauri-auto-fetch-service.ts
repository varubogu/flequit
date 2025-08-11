import type {
  AutoFetchService,
  DataChangeNotification
} from '$lib/services/backend/auto-fetch-service';

/**
 * Tauri環境用のデータ更新通知サービス
 */
export class TauriAutoFetchService implements AutoFetchService {
  private listeners: Array<(notification: DataChangeNotification) => void> = [];
  private typeListeners: Map<string, Array<(notification: DataChangeNotification) => void>> =
    new Map();

  async notifyDataChange(notification: DataChangeNotification): Promise<void> {
    // 全体のリスナーに通知
    this.listeners.forEach((callback) => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Error in data change listener:', error);
      }
    });

    // 特定データタイプのリスナーに通知
    const typeListeners = this.typeListeners.get(notification.dataType);
    if (typeListeners) {
      typeListeners.forEach((callback) => {
        try {
          callback(notification);
        } catch (error) {
          console.error('Error in type-specific data change listener:', error);
        }
      });
    }
  }

  subscribe(callback: (notification: DataChangeNotification) => void): () => void {
    this.listeners.push(callback);

    // unsubscribe関数を返す
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  subscribeToDataType(
    dataType: string,
    callback: (notification: DataChangeNotification) => void
  ): () => void {
    if (!this.typeListeners.has(dataType)) {
      this.typeListeners.set(dataType, []);
    }

    this.typeListeners.get(dataType)!.push(callback);

    // unsubscribe関数を返す
    return () => {
      const listeners = this.typeListeners.get(dataType);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }

        // リスナーが空になったらMapから削除
        if (listeners.length === 0) {
          this.typeListeners.delete(dataType);
        }
      }
    };
  }
}
