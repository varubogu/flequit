import type { BackendService } from '$lib/infrastructure/backends';
import { resolveBackend } from '$lib/infrastructure/backend-client';
import type { Setting, Settings } from '$lib/types/settings';
import { errorHandler } from '$lib/stores/error-handler.svelte';

/**
 * 設定の統合初期化サービス
 * 全ての設定ストアの初期化を統合管理し、getAllSettingsの呼び出しを1回に制限する
 */
class SettingsInitService {
  private allSettings: Setting[] | null = null;
  private isLoading = false;
  private loadPromise: Promise<Setting[]> | null = null;
  private backendPromise: Promise<BackendService> | null = null;

  /**
   * バックエンドサービスの初期化
   */
  private initBackendService() {
    if (!this.backendPromise) {
      this.backendPromise = resolveBackend();
    }
    return this.backendPromise;
  }

  /**
   * 全設定を一度だけ読み込んで共有する
   */
  async getAllSettings(): Promise<Setting[]> {
    // 既に読み込み済みの場合はキャッシュを返す
    if (this.allSettings) {
      return this.allSettings;
    }

    // 既に読み込み中の場合は同じPromiseを返す
    if (this.isLoading && this.loadPromise) {
      return this.loadPromise;
    }

    // 初回読み込み
    this.isLoading = true;
    this.loadPromise = this.loadSettingsFromBackend();

    try {
      this.allSettings = await this.loadPromise;
      return this.allSettings;
    } finally {
      this.isLoading = false;
      this.loadPromise = null;
    }
  }

  /**
   * バックエンドから設定を読み込む
   */
  private async loadSettingsFromBackend(): Promise<Setting[]> {
    try {
      const backend = await this.initBackendService();
      if (!backend) {
        console.warn('Backend service not available, using empty settings');
        return [];
      }

      const allSettings = await backend.setting.getAll();
      return allSettings;
    } catch (error) {
      console.error('Failed to load settings from backends:', error);
      return [];
    }
  }

  /**
   * 特定のキーの設定を取得する
   */
  getSettingByKey(allSettings: Setting[], key: string): Setting | undefined {
    return allSettings.find((s) => s.key === key);
  }

  /**
   * 特定のキーパターンに一致する設定を取得する
   */
  getSettingsByKeyPattern(allSettings: Setting[], pattern: string): Setting[] {
    return allSettings.filter((s) => s.key.startsWith(pattern));
  }

  async updateSettingsPartially(partial: Partial<Settings>) {
    const backend = await this.initBackendService();
    if (!backend) {
      throw new Error('Backend service not available');
    }
    await backend.settingsManagement.updateSettingsPartially(partial);
  }

  async updateSetting(setting: Setting) {
    const backend = await this.initBackendService();
    if (!backend) {
      throw new Error('Backend service not available');
    }
    await backend.setting.update(setting);
  }

  /**
   * キャッシュをクリアする（テスト用）
   */
  clearCache() {
    this.allSettings = null;
    this.isLoading = false;
    this.loadPromise = null;
  }
}

// シングルトンインスタンスをエクスポート
export const settingsInitService = new SettingsInitService();

/**
 * 設定管理ドメインサービス
 *
 * 責務:
 * 1. バックエンド設定管理APIのラッパー
 * 2. エラーハンドリングの統一
 */
export const SettingsService = {
  async loadSettings(): Promise<Settings | null> {
    try {
      const backend = await resolveBackend();
      return await backend.settingsManagement.loadSettings();
    } catch (error) {
      console.error('Failed to load settings:', error);
      errorHandler.addSyncError('設定読込', 'settings', 'load', error);
      throw error;
    }
  },

  async saveSettings(settings: Settings): Promise<boolean> {
    try {
      const backend = await resolveBackend();
      return await backend.settingsManagement.saveSettings(settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
      errorHandler.addSyncError('設定保存', 'settings', 'save', error);
      throw error;
    }
  },

  async settingsFileExists(): Promise<boolean> {
    try {
      const backend = await resolveBackend();
      return await backend.settingsManagement.settingsFileExists();
    } catch (error) {
      console.error('Failed to check settings file existence:', error);
      errorHandler.addSyncError('設定ファイル確認', 'settings', 'exists', error);
      throw error;
    }
  },

  async initializeSettingsWithDefaults(): Promise<boolean> {
    try {
      const backend = await resolveBackend();
      return await backend.settingsManagement.initializeSettingsWithDefaults();
    } catch (error) {
      console.error('Failed to initialize settings with defaults:', error);
      errorHandler.addSyncError('設定初期化', 'settings', 'initialize', error);
      throw error;
    }
  },

  async getSettingsFilePath(): Promise<string> {
    try {
      const backend = await resolveBackend();
      return await backend.settingsManagement.getSettingsFilePath();
    } catch (error) {
      console.error('Failed to get settings file path:', error);
      errorHandler.addSyncError('設定ファイル取得', 'settings', 'path', error);
      throw error;
    }
  },

  async updateSettingsPartially(partialSettings: Partial<Settings>): Promise<Settings | null> {
    try {
      const backend = await resolveBackend();
      return await backend.settingsManagement.updateSettingsPartially(partialSettings);
    } catch (error) {
      console.error('Failed to update settings partially:', error);
      errorHandler.addSyncError('設定部分更新', 'settings', 'partial', error);
      throw error;
    }
  },

  async addCustomDueDay(days: number): Promise<boolean> {
    try {
      const backend = await resolveBackend();
      return await backend.settingsManagement.addCustomDueDay(days);
    } catch (error) {
      console.error('Failed to add custom due day:', error);
      errorHandler.addSyncError('設定期日追加', 'settings', 'custom_due_day', error);
      throw error;
    }
  }
};
