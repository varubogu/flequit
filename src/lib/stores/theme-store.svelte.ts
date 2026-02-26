import { setMode, userPrefersMode } from 'mode-watcher';
import { resolveSettingsGateway, type SettingsGateway } from '$lib/dependencies/settings';

type Theme = 'system' | 'light' | 'dark';

class ThemeStore {
  private settingsGateway: SettingsGateway;
  private isInitialized = false;

  constructor(settingsGateway: SettingsGateway = resolveSettingsGateway()) {
    this.settingsGateway = settingsGateway;
  }

  get currentTheme(): Theme {
    return userPrefersMode.current as Theme;
  }

  setTheme(theme: Theme): void {
    setMode(theme);
    // バックエンドに保存
    this.saveTheme(theme);
  }

  private async saveTheme(theme: Theme) {
    // 初期化が完了していない場合は保存しない
    if (!this.isInitialized) {
      return;
    }

    try {
      const updatedSettings = await this.settingsGateway.updateSettingsPartially({ theme });
      if (!updatedSettings) {
        throw new Error('Failed to update theme setting');
      }
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
      // 新しい設定管理システムから全設定を取得
      const settings = await this.settingsGateway.loadSettings();

      if (
        settings?.theme &&
        (settings.theme === 'system' || settings.theme === 'light' || settings.theme === 'dark')
      ) {
        setMode(settings.theme as Theme);
      }
    } catch (error) {
      console.error('Failed to load theme:', error);

      // フォールバックとしてlocalStorageから読み込み
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('flequit-theme');
        if (stored && (stored === 'system' || stored === 'light' || stored === 'dark')) {
          setMode(stored as Theme);
          console.warn('Theme loaded from localStorage fallback');
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
themeStore.init().catch((error) => {
  console.error('Failed to initialize theme store:', error);
});
