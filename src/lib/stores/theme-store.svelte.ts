import { setMode, userPrefersMode } from 'mode-watcher';
import { getBackendService } from '$lib/services/backend';
import { settingsInitService } from '$lib/services/settings-init-service';
import type { Setting } from '$lib/types/settings';

type Theme = 'system' | 'light' | 'dark';

class ThemeStore {
  private backendService: Awaited<ReturnType<typeof getBackendService>> | null = null;
  private isInitialized = false;

  get currentTheme(): Theme {
    return userPrefersMode.current as Theme;
  }

  setTheme(theme: Theme): void {
    setMode(theme);
    // バックエンドに保存
    this.saveTheme(theme);
  }

  private async initBackendService() {
    if (!this.backendService) {
      this.backendService = await getBackendService();
    }
    return this.backendService;
  }

  private async saveTheme(theme: Theme) {
    // 初期化が完了していない場合は保存しない
    if (!this.isInitialized) {
      return;
    }

    try {
      const backend = await this.initBackendService();
      if (!backend) {
        throw new Error('Backend service not available');
      }
      
      const setting: Setting = {
        id: 'setting_theme',
        key: 'theme',
        value: theme,
        data_type: 'string',
        created_at: new Date(),
        updated_at: new Date()
      };
      
      await backend.setting.update(setting);
      console.log(`Theme '${theme}' saved successfully`);
    } catch (error) {
      console.error('Failed to save theme:', error);
      // フォールバックとしてlocalStorageに保存
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('flequit-theme', theme);
      }
    }
  }

  private async loadTheme() {
    try {
      // 統合初期化サービスから全設定を取得
      const allSettings = await settingsInitService.getAllSettings();
      const themeSetting = settingsInitService.getSettingByKey(allSettings, 'theme');
      
      if (themeSetting && (themeSetting.value === 'system' || themeSetting.value === 'light' || themeSetting.value === 'dark')) {
        setMode(themeSetting.value as Theme);
        console.log(`Theme loaded from backend: ${themeSetting.value}`);
      } else {
        console.log('No theme setting found in backend, using default');
      }
    } catch (error) {
      console.error('Failed to load theme from backend:', error);
      
      // フォールバックとしてlocalStorageから読み込み
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('flequit-theme');
        if (stored && (stored === 'system' || stored === 'light' || stored === 'dark')) {
          setMode(stored as Theme);
          console.log('Theme loaded from localStorage fallback');
        }
      }
    }
  }

  async init() {
    await this.loadTheme();
    this.isInitialized = true;
  }
}

export const themeStore = new ThemeStore();

// 初期化の実行
themeStore.init().catch(error => {
  console.error('Failed to initialize theme store:', error);
});