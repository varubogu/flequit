import { SettingsService } from '$lib/services/domain/settings';

export interface AppearanceSettings {
  font: string;
  fontSize: number;
  fontColor: string;
  backgroundColor: string;
}

class AppearanceStore {
  private _settings = $state<AppearanceSettings>({
    font: 'default',
    fontSize: 13,
    fontColor: 'default',
    backgroundColor: 'default'
  });

  private isInitialized = false;

  get settings(): AppearanceSettings {
    return this._settings;
  }

  setFont(font: string): void {
    this._settings.font = font;
    this.saveSettings({ font });
  }

  setFontSize(fontSize: number): void {
    this._settings.fontSize = fontSize;
    this.saveSettings({ fontSize });
  }

  setFontColor(fontColor: string): void {
    this._settings.fontColor = fontColor;
    this.saveSettings({ fontColor });
  }

  setBackgroundColor(backgroundColor: string): void {
    this._settings.backgroundColor = backgroundColor;
    this.saveSettings({ backgroundColor });
  }

  private async saveSettings(partialSettings: Partial<{ font: string; fontSize: number; fontColor: string; backgroundColor: string }>) {
    // 初期化が完了していない場合は保存しない
    if (!this.isInitialized) {
      return;
    }

    try {
      const updatedSettings = await SettingsService.updateSettingsPartially(partialSettings);
      if (!updatedSettings) {
        throw new Error('Failed to update settings');
      }
    } catch (error) {
      console.error('Failed to save appearance settings:', error);
      // フォールバックとしてlocalStorageに保存
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('flequit-appearance', JSON.stringify(this._settings));
      }
    }
  }

  private async loadSettings() {
    try {
      // 新しい設定管理システムから全設定を取得
      const settings = await SettingsService.loadSettings();

      if (settings) {
        // 外観設定を適用
        if (settings.font !== undefined) {
          this._settings.font = settings.font;
        }
        if (settings.fontSize !== undefined) {
          this._settings.fontSize = settings.fontSize;
        }
        if (settings.fontColor !== undefined) {
          this._settings.fontColor = settings.fontColor;
        }
        if (settings.backgroundColor !== undefined) {
          this._settings.backgroundColor = settings.backgroundColor;
        }
      }
    } catch (error) {
      console.error('Failed to load appearance settings:', error);

      // フォールバックとしてlocalStorageから読み込み
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('flequit-appearance');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            this._settings = { ...this._settings, ...parsed };
            console.warn('Appearance settings loaded from localStorage fallback');
          } catch (error) {
            console.error('Failed to parse appearance settings:', error);
          }
        }
      }
    }
  }

  async init() {
    await this.loadSettings();
    this.isInitialized = true;
  }
}

export const appearanceStore = new AppearanceStore();

// 初期化の実行
appearanceStore.init().catch((error) => {
  console.error('Failed to initialize appearance store:', error);
});
