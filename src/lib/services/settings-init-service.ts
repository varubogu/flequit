import { getBackendService } from '../infrastructure/backends';
import type { Setting } from '$lib/types/settings';

/**
 * 設定の統合初期化サービス
 * 全ての設定ストアの初期化を統合管理し、getAllSettingsの呼び出しを1回に制限する
 */
class SettingsInitService {
  private allSettings: Setting[] | null = null;
  private isLoading = false;
  private loadPromise: Promise<Setting[]> | null = null;
  private backendService: Awaited<ReturnType<typeof getBackendService>> | null = null;

  /**
   * バックエンドサービスの初期化
   */
  private async initBackendService() {
    if (!this.backendService) {
      this.backendService = await getBackendService();
    }
    return this.backendService;
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
        console.log('Backend service not available, using empty settings');
        return [];
      }

      console.log('Loading all settings from backends (single call)...');
      const allSettings = await backend.setting.getAll();
      console.log(`Loaded ${allSettings.length} settings from backend`);
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
