import { getBackendService } from '$lib/services/backend';
import { settingsInitService } from '$lib/services/settings-init-service';
import type { Setting } from '$lib/types/settings';

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

  private backendService: Awaited<ReturnType<typeof getBackendService>> | null = null;
  private isInitialized = false;

  get settings(): AppearanceSettings {
    return this._settings;
  }

  setFont(font: string): void {
    this._settings.font = font;
    this.saveSingleSetting('appearance_font', font, 'string');
  }

  setFontSize(fontSize: number): void {
    this._settings.fontSize = fontSize;
    this.saveSingleSetting('appearance_fontSize', fontSize.toString(), 'string');
  }

  setFontColor(fontColor: string): void {
    this._settings.fontColor = fontColor;
    this.saveSingleSetting('appearance_fontColor', fontColor, 'string');
  }

  setBackgroundColor(backgroundColor: string): void {
    this._settings.backgroundColor = backgroundColor;
    this.saveSingleSetting('appearance_backgroundColor', backgroundColor, 'string');
  }

  private async initBackendService() {
    if (!this.backendService) {
      this.backendService = await getBackendService();
    }
    return this.backendService;
  }

  private async saveSingleSetting(key: string, value: string, dataType: Setting['data_type']) {
    // 初期化が完了していない場合は保存しない
    if (!this.isInitialized) {
      return;
    }

    try {
      await this.saveSetting(key, value, dataType);
      console.log(`Appearance setting '${key}' saved successfully`);
    } catch (error) {
      console.error(`Failed to save appearance setting '${key}':`, error);
      // フォールバックとしてlocalStorageに保存
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('flequit-appearance', JSON.stringify(this._settings));
      }
    }
  }

  private async saveSetting(key: string, value: string, dataType: Setting['data_type']) {
    const backend = await this.initBackendService();
    if (!backend) {
      throw new Error('Backend service not available');
    }

    const setting: Setting = {
      id: `setting_${key}`,
      key,
      value,
      data_type: dataType,
      created_at: new Date(),
      updated_at: new Date()
    };

    await backend.setting.update(setting);
  }

  private async loadSettings() {
    try {
      // 統合初期化サービスから全設定を取得
      const allSettings = await settingsInitService.getAllSettings();

      let loadedCount = 0;

      // 各設定を適用
      for (const setting of allSettings) {
        switch (setting.key) {
          case 'appearance_font':
            this._settings.font = setting.value;
            loadedCount++;
            break;

          case 'appearance_fontSize': {
            const fontSize = parseInt(setting.value, 10);
            if (!isNaN(fontSize)) {
              this._settings.fontSize = fontSize;
              loadedCount++;
            }
            break;
          }

          case 'appearance_fontColor':
            this._settings.fontColor = setting.value;
            loadedCount++;
            break;

          case 'appearance_backgroundColor':
            this._settings.backgroundColor = setting.value;
            loadedCount++;
            break;
        }
      }

      if (loadedCount > 0) {
        console.log(
          `Appearance settings loaded successfully from backend (${loadedCount} settings)`
        );
      } else {
        console.log('No appearance settings found in backend, using defaults');
      }
    } catch (error) {
      console.error('Failed to load appearance settings from backend:', error);

      // フォールバックとしてlocalStorageから読み込み
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('flequit-appearance');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            this._settings = { ...this._settings, ...parsed };
            console.log('Appearance settings loaded from localStorage fallback');
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
