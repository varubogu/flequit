import { getTranslationService } from '$lib/stores/locale.svelte';
import { getBackendService } from '$lib/services/backend';
import type { Setting } from '$lib/types/task';

const translationService = getTranslationService();
import { getLocale } from '$paraglide/runtime';

interface Settings {
  timezone: string; // 'system' または IANA timezone identifier
  dateFormat: string; // date-fns format string
  customDateFormats: CustomDateFormat[]; // ユーザー定義フォーマット
  timeLabels: TimeLabel[]; // 時刻ラベル
}

export interface CustomDateFormat {
  id: string;
  name: string;
  format: string;
}

export interface TimeLabel {
  id: string;
  name: string;
  time: string; // HH:mm format
}

class SettingsStore {
  private settings = $state<Settings>({
    timezone: 'system',
    dateFormat: 'yyyy年MM月dd日(E) HH:mm:ss', // デフォルトは日本式
    customDateFormats: [],
    timeLabels: []
  });

  private backendService: Awaited<ReturnType<typeof getBackendService>> | null = null;
  private isInitialized = false;

  get timezone() {
    return this.settings.timezone;
  }

  get effectiveTimezone() {
    if (this.settings.timezone === 'system') {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
    return this.settings.timezone;
  }

  get dateFormat() {
    return this.settings.dateFormat;
  }

  get customDateFormats() {
    return this.settings.customDateFormats;
  }

  get timeLabels() {
    return this.settings.timeLabels;
  }

  setTimezone(timezone: string) {
    this.settings.timezone = timezone;
    this.saveSingleSetting('timezone', timezone, 'string');
  }

  setDateFormat(format: string) {
    this.settings.dateFormat = format;
    this.saveSingleSetting('dateFormat', format, 'string');
  }

  resetDateFormatToDefault() {
    const locale = getLocale();
    this.settings.dateFormat = getDefaultDateFormat(locale);
    this.saveSingleSetting('dateFormat', this.settings.dateFormat, 'string');
  }

  addCustomDateFormat(name: string, format: string): string {
    const id = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.settings.customDateFormats.push({ id, name, format });
    this.saveSingleSetting('customDateFormats', JSON.stringify(this.settings.customDateFormats), 'json');
    return id;
  }

  updateCustomDateFormat(id: string, updates: Partial<Omit<CustomDateFormat, 'id'>>) {
    const index = this.settings.customDateFormats.findIndex((f) => f.id === id);
    if (index !== -1) {
      this.settings.customDateFormats[index] = {
        ...this.settings.customDateFormats[index],
        ...updates
      };
      this.saveSingleSetting('customDateFormats', JSON.stringify(this.settings.customDateFormats), 'json');
    }
  }

  removeCustomDateFormat(id: string) {
    this.settings.customDateFormats = this.settings.customDateFormats.filter((f) => f.id !== id);
    this.saveSingleSetting('customDateFormats', JSON.stringify(this.settings.customDateFormats), 'json');
  }

  addTimeLabel(name: string, time: string): string {
    const id = `time_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.settings.timeLabels.push({ id, name, time });
    this.saveSingleSetting('timeLabels', JSON.stringify(this.settings.timeLabels), 'json');
    return id;
  }

  updateTimeLabel(id: string, updates: Partial<Omit<TimeLabel, 'id'>>) {
    const index = this.settings.timeLabels.findIndex((t) => t.id === id);
    if (index !== -1) {
      this.settings.timeLabels[index] = {
        ...this.settings.timeLabels[index],
        ...updates
      };
      this.saveSingleSetting('timeLabels', JSON.stringify(this.settings.timeLabels), 'json');
    }
  }

  removeTimeLabel(id: string) {
    this.settings.timeLabels = this.settings.timeLabels.filter((t) => t.id !== id);
    this.saveSingleSetting('timeLabels', JSON.stringify(this.settings.timeLabels), 'json');
  }

  getTimeLabelsByTime(time: string): TimeLabel[] {
    return this.settings.timeLabels.filter((t) => t.time === time);
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
      console.log(`Setting '${key}' saved successfully`);
    } catch (error) {
      console.error(`Failed to save setting '${key}':`, error);
      // フォールバックとしてlocalStorageに保存
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('flequit-settings', JSON.stringify(this.settings));
      }
    }
  }

  private async saveSettings() {
    // 初期化が完了していない場合は保存しない
    if (!this.isInitialized) {
      return;
    }

    try {
      const backend = await this.initBackendService();
      
      // 各設定をバックエンドサービスに保存
      await Promise.all([
        this.saveSetting('timezone', this.settings.timezone, 'string'),
        this.saveSetting('dateFormat', this.settings.dateFormat, 'string'),
        this.saveSetting('customDateFormats', JSON.stringify(this.settings.customDateFormats), 'json'),
        this.saveSetting('timeLabels', JSON.stringify(this.settings.timeLabels), 'json')
      ]);

      console.log('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      // フォールバックとしてlocalStorageに保存
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('flequit-settings', JSON.stringify(this.settings));
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
      const backend = await this.initBackendService();
      if (!backend) {
        throw new Error('Backend service not available');
      }
      
      // バックエンドから全設定を一括読み込み
      const allSettings = await backend.setting.getAll();
      
      let loadedCount = 0;

      // 各設定を適用
      for (const setting of allSettings) {
        switch (setting.key) {
          case 'timezone':
            this.settings.timezone = setting.value;
            loadedCount++;
            break;
            
          case 'dateFormat':
            this.settings.dateFormat = setting.value;
            loadedCount++;
            break;
            
          case 'customDateFormats':
            if (setting.data_type === 'json') {
              try {
                this.settings.customDateFormats = JSON.parse(setting.value);
                loadedCount++;
              } catch (error) {
                console.error('Failed to parse customDateFormats:', error);
              }
            }
            break;
            
          case 'timeLabels':
            if (setting.data_type === 'json') {
              try {
                this.settings.timeLabels = JSON.parse(setting.value);
                loadedCount++;
              } catch (error) {
                console.error('Failed to parse timeLabels:', error);
              }
            }
            break;
        }
      }

      if (loadedCount > 0) {
        console.log(`Settings loaded successfully from backend (${loadedCount} settings)`);
      } else {
        console.log('No settings found in backend, using defaults');
      }
    } catch (error) {
      console.error('Failed to load settings from backend:', error);
      
      // フォールバックとしてlocalStorageから読み込み
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('flequit-settings');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            this.settings = { ...this.settings, ...parsed };
            console.log('Settings loaded from localStorage fallback');
          } catch (error) {
            console.error('Failed to parse settings:', error);
          }
        }
      }
    }
  }

  async init() {
    await this.loadSettings();
    this.isInitialized = true;
  }

  constructor() {
    // 非同期初期化は外部で実行
    // this.init() は別途呼び出す必要がある
  }
}

export const settingsStore = new SettingsStore();

// 初期化の実行
settingsStore.init().catch(error => {
  console.error('Failed to initialize settings store:', error);
});

// 利用可能なタイムゾーンのリスト（リアクティブ関数として提供）
export function getAvailableTimezones() {
  const osTimezone = translationService.getMessage('os_timezone');

  return [
    { value: 'system', label: osTimezone() },
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'New York (EST/EDT)' },
    { value: 'America/Chicago', label: 'Chicago (CST/CDT)' },
    { value: 'America/Denver', label: 'Denver (MST/MDT)' },
    { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)' },
    { value: 'Europe/London', label: 'London (GMT/BST)' },
    { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
    { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
    { value: 'Europe/Moscow', label: 'Moscow (MSK)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
    { value: 'Asia/Seoul', label: 'Seoul (KST)' },
    { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
    { value: 'Asia/Dubai', label: 'Dubai (GST)' },
    { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
    { value: 'Pacific/Auckland', label: 'Auckland (NZST/NZDT)' }
  ];
}

// 言語ごとのデフォルト日時フォーマット
export function getDefaultDateFormat(locale: string): string {
  if (locale.startsWith('ja')) {
    return 'yyyy年MM月dd日(E) HH:mm:ss';
  } else {
    return 'EEEE, MMMM do, yyyy HH:mm:ss';
  }
}

// 標準日時フォーマットテンプレート
export function getStandardDateFormats() {
  const locale = getLocale();

  if (locale.startsWith('ja')) {
    return [
      { id: 'standard', name: '標準形式', format: 'yyyy年MM月dd日(E) HH:mm:ss', isStandard: true },
      { id: 'short', name: '短縮形式', format: 'yyyy/MM/dd HH:mm', isStandard: true },
      { id: 'date_only', name: '日付のみ', format: 'yyyy年MM月dd日', isStandard: true },
      { id: 'time_only', name: '時刻のみ', format: 'HH:mm:ss', isStandard: true },
      { id: 'iso', name: 'ISO形式', format: 'yyyy-MM-dd HH:mm:ss', isStandard: true }
    ];
  } else {
    return [
      {
        id: 'standard',
        name: 'Standard format',
        format: 'EEEE, MMMM do, yyyy HH:mm:ss',
        isStandard: true
      },
      { id: 'short', name: 'Short format', format: 'MM/dd/yyyy HH:mm', isStandard: true },
      { id: 'date_only', name: 'Date only', format: 'MMMM do, yyyy', isStandard: true },
      { id: 'time_only', name: 'Time only', format: 'HH:mm:ss', isStandard: true },
      { id: 'iso', name: 'ISO format', format: 'yyyy-MM-dd HH:mm:ss', isStandard: true }
    ];
  }
}

// 全フォーマット（標準 + カスタム + ユーザー定義）を取得
export function getAllDateFormats() {
  const locale = getLocale();
  const standardFormats = getStandardDateFormats();
  const customFormats = settingsStore.customDateFormats.map((f) => ({ ...f, isStandard: false }));

  const customLabel = locale.startsWith('ja') ? 'カスタム' : 'Custom';
  const customFormat = { id: 'custom', name: customLabel, format: '', isStandard: false };

  return [...standardFormats, ...customFormats, customFormat];
}
