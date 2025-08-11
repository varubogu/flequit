import type { ProjectService } from './project-service';
import type { TaskListService } from './tasklist-service';
import type { TaskService } from './task-service';
import type { SubTaskService } from './subtask-service';
import type { TagService } from './tag-service';
import type { SettingService } from './setting-service';
import type { AccountService } from './account-service';
import type { AutoFetchService } from './auto-fetch-service';
import type { InitializationService } from './initialization-service';

/**
 * 統合BackendServiceインターフェース
 * 全てのデータサービスをグループ化して提供
 */
export interface BackendService {
  /**
   * プロジェクト管理サービス
   */
  project: ProjectService;

  /**
   * タスクリスト管理サービス
   */
  tasklist: TaskListService;

  /**
   * タスク管理サービス
   */
  task: TaskService;

  /**
   * サブタスク管理サービス
   */
  subtask: SubTaskService;

  /**
   * タグ管理サービス
   */
  tag: TagService;

  /**
   * 設定管理サービス
   */
  setting: SettingService;

  /**
   * アカウント管理サービス
   */
  account: AccountService;

  /**
   * データ更新通知サービス
   */
  autoFetch: AutoFetchService;

  /**
   * 初期化サービス
   */
  initialization: InitializationService;
}

/**
 * Tauriアプリケーション環境かどうかを判定
 */
function isTauriEnvironment(): boolean {
  return (
    typeof window !== 'undefined' &&
    (window as unknown as { __TAURI__?: unknown }).__TAURI__ !== undefined
  );
}

/**
 * BackendServiceの実装を取得するファクトリ関数
 */
export async function getBackendService(): Promise<BackendService> {
  if (isTauriEnvironment()) {
    const { BackendTauriService } = await import('./tauri/backend-tauri-service');
    return new BackendTauriService();
  } else {
    const { BackendWebService } = await import('./web/backend-web-service');
    return new BackendWebService();
  }
}

// 型定義のre-export
export type * from '$lib/types/crud-interface';
export type * from './project-service';
export type * from './tasklist-service';
export type * from './task-service';
export type * from './subtask-service';
export type * from './tag-service';
export type * from './setting-service';
export type * from './account-service';
export type * from './auto-fetch-service';
export type * from './initialization-service';
