import type { ProjectTree } from '$lib/types/project';

/**
 * ローカル設定データ
 */
export interface LocalSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  [key: string]: unknown;
}

/**
 * アカウントデータ
 */
export interface Account {
  id: string;
  name: string;
  email?: string;
  profile_image?: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * 初期化結果
 */
export interface InitializationResult {
  localSettings: LocalSettings;
  account: Account | null;
  projects: ProjectTree[];
}

/**
 * 初期化サービスインターフェース
 * アプリケーション起動時の初期データ読み込みを3段階で実行
 */
export interface InitializationService {
  /**
   * 段階1: ローカル設定を読み込む
   * Tauri版: ローカルファイルから読み込み
   * Web版: 空のデフォルト設定を返す
   */
  loadLocalSettings(): Promise<LocalSettings>;

  /**
   * 段階2: アカウント情報を読み込む
   * ローカル設定に基づいてアカウント情報を取得
   */
  loadAccount(): Promise<Account | null>;

  /**
   * 段階3: プロジェクト～タスクまでの階層データを読み込む
   * アカウント情報に基づいてプロジェクトデータを取得
   */
  loadProjectData(): Promise<ProjectTree[]>;

  /**
   * 全初期化を実行
   * 3段階を順次実行して完全な初期化結果を返す
   */
  initializeAll(): Promise<InitializationResult>;
}
