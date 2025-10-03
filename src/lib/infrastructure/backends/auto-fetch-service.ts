/**
 * データ更新通知システム
 * バックエンドからフロントエンドへのデータ変更通知を管理
 */

export type DataType = 'project' | 'tasklist' | 'task' | 'subtask' | 'tag' | 'setting' | 'account';
export type ChangeType = 'create' | 'update' | 'delete';

export interface DataChangeNotification {
  dataType: DataType;
  changeType: ChangeType;
  id: string;
  timestamp: Date;
}

export interface AutoFetchService {
  /**
   * データ変更の通知を送信
   */
  notifyDataChange(notification: DataChangeNotification): Promise<void>;

  /**
   * データ変更通知のリスナーを登録
   */
  subscribe(callback: (notification: DataChangeNotification) => void): () => void;

  /**
   * 特定のデータタイプのリスナーを登録
   */
  subscribeToDataType(
    dataType: DataType,
    callback: (notification: DataChangeNotification) => void
  ): () => void;
}
