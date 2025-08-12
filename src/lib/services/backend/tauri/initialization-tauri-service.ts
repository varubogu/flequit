import { invoke } from '@tauri-apps/api/core';
import type {
  InitializationService,
  LocalSettings,
  Account,
  InitializationResult
} from '../initialization-service';
import type { ProjectTree } from "$lib/types/project";

/**
 * Tauri版初期化サービス
 * ローカルファイルシステムとデータベースから初期データを読み込む
 */
export class InitializationTauriService implements InitializationService {
  /**
   * 段階1: ローカル設定読み込み
   * Tauriのローカルファイルから設定を読み込む
   */
  async loadLocalSettings(): Promise<LocalSettings> {
    try {
      const settings = await invoke('load_local_settings') as LocalSettings | null;

      if (!settings) {
        // デフォルト設定を返す
        return this.getDefaultSettings();
      }

      return settings;
    } catch (error) {
      console.warn('Failed to load local settings:', error);
      return this.getDefaultSettings();
    }
  }

  /**
   * 段階2: アカウント情報読み込み
   * ローカルデータベースからアカウント情報を取得
   */
  async loadAccount(): Promise<Account | null> {
    try {
      const account = await invoke('load_current_account') as Account | null;
      return account;
    } catch (error) {
      console.warn('Failed to load account:', error);
      return null;
    }
  }

  /**
   * 段階3: プロジェクトデータ読み込み
   * データベースから全プロジェクト・タスクリスト・タスク・サブタスクを階層構造で取得
   */
  async loadProjectData(): Promise<ProjectTree[]> {
    try {
      const projects = await invoke('load_all_project_data') as ProjectTree[];
      return projects || [];
    } catch (error) {
      console.error('Failed to load project data:', error);
      return [];
    }
  }

  /**
   * 全初期化実行
   * 3段階を順次実行
   */
  async initializeAll(): Promise<InitializationResult> {
    const localSettings = await this.loadLocalSettings();
    const account = await this.loadAccount();
    const projects = await this.loadProjectData();

    return {
      localSettings,
      account,
      projects
    };
  }

  /**
   * デフォルト設定を取得
   */
  private getDefaultSettings(): LocalSettings {
    return {
      theme: 'system',
      language: 'ja'
    };
  }
}
