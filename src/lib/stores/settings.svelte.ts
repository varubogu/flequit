import { getTranslationService } from '$lib/stores/locale.svelte';

const translationService = getTranslationService();
import { getLocale } from '$paraglide/runtime';

interface Settings {
  timezone: string; // 'system' または IANA timezone identifier
  dateFormat: string; // date-fns format string
  customDateFormats: CustomDateFormat[]; // ユーザー定義フォーマット
}

export interface CustomDateFormat {
  id: string;
  name: string;
  format: string;
}

class SettingsStore {
  private settings = $state<Settings>({
    timezone: 'system',
    dateFormat: 'yyyy年MM月dd日(E) HH:mm:ss', // デフォルトは日本式
    customDateFormats: []
  });

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

  setTimezone(timezone: string) {
    this.settings.timezone = timezone;
    this.saveSettings();
  }

  setDateFormat(format: string) {
    this.settings.dateFormat = format;
    this.saveSettings();
  }

  resetDateFormatToDefault() {
    const locale = getLocale();
    this.settings.dateFormat = getDefaultDateFormat(locale);
    this.saveSettings();
  }

  addCustomDateFormat(name: string, format: string): string {
    const id = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.settings.customDateFormats.push({ id, name, format });
    this.saveSettings();
    return id;
  }

  updateCustomDateFormat(id: string, updates: Partial<Omit<CustomDateFormat, 'id'>>) {
    const index = this.settings.customDateFormats.findIndex((f) => f.id === id);
    if (index !== -1) {
      this.settings.customDateFormats[index] = {
        ...this.settings.customDateFormats[index],
        ...updates
      };
      this.saveSettings();
    }
  }

  removeCustomDateFormat(id: string) {
    this.settings.customDateFormats = this.settings.customDateFormats.filter((f) => f.id !== id);
    this.saveSettings();
  }

  private saveSettings() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('flequit-settings', JSON.stringify(this.settings));
    }
  }

  private loadSettings() {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('flequit-settings');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          this.settings = { ...this.settings, ...parsed };
        } catch (error) {
          console.error('Failed to parse settings:', error);
        }
      }
    }
  }

  constructor() {
    this.loadSettings();
  }
}

export const settingsStore = new SettingsStore();

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
