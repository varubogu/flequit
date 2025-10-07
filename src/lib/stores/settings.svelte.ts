import { settingsInitService } from '$lib/services/domain/settings';
import type {
  Setting,
  Settings,
  Theme,
  WeekStart,
  CustomDateFormat,
  TimeLabel,
  ViewItem
} from '$lib/types/settings';
import { getLocale } from '$paraglide/runtime';
import { getTranslationService } from '$lib/stores/locale.svelte';

const translationService = getTranslationService();

/**
 * デフォルト設定値
 */
const DEFAULT_SETTINGS: Settings = {
  // テーマ・外観設定
  theme: 'system' as Theme,
  language: 'ja',
  font: 'default',
  fontSize: 13,
  fontColor: 'default',
  backgroundColor: 'default',

  // 基本設定
  weekStart: 'sunday' as WeekStart,
  timezone: 'system',
  dateFormat: 'yyyy年MM月dd日(E) HH:mm:ss',
  customDueDays: [],
  customDateFormats: [],
  timeLabels: [],

  // 表示設定
  dueDateButtons: {
    overdue: true,
    today: true,
    tomorrow: true,
    threeDays: false,
    thisWeek: true,
    thisMonth: true,
    thisQuarter: false,
    thisYear: false,
    thisYearEnd: false
  },
  viewItems: [
    { id: 'allTasks', label: 'All Tasks', icon: '📝', visible: true, order: 0 },
    { id: 'overdue', label: 'Overdue', icon: '🚨', visible: true, order: 1 },
    { id: 'today', label: 'Today', icon: '📅', visible: true, order: 2 },
    { id: 'tomorrow', label: 'Tomorrow', icon: '📆', visible: true, order: 3 },
    { id: 'completed', label: 'Completed', icon: '✅', visible: true, order: 4 },
    { id: 'next3days', label: 'Next 3 Days', icon: '📋', visible: false, order: 5 },
    { id: 'nextweek', label: 'Next Week', icon: '📊', visible: false, order: 6 },
    { id: 'thismonth', label: 'This Month', icon: '📅', visible: false, order: 7 }
  ],

  // アカウント設定
  lastSelectedAccount: ''
};

/**
 * メイン設定ストア
 */
class MainSettingsStore {
  private _settings = $state<Settings>({ ...DEFAULT_SETTINGS });
  private isInitialized = false;

  /**
   * 全設定を取得
   */
  get settings(): Settings {
    return this._settings;
  }

  /**
   * テーマ設定
   */
  get theme(): Theme {
    return this._settings.theme;
  }

  setTheme(theme: Theme): void {
    this._settings.theme = theme;
    this.saveSingleSetting('theme', theme, 'string');
  }

  /**
   * 言語設定
   */
  get language(): string {
    return this._settings.language;
  }

  setLanguage(language: string): void {
    this._settings.language = language;
    this.saveSingleSetting('language', language, 'string');
  }

  /**
   * フォント設定
   */
  get font(): string {
    return this._settings.font;
  }

  setFont(font: string): void {
    this._settings.font = font;
    this.saveSingleSetting('font', font, 'string');
  }

  get fontSize(): number {
    return this._settings.fontSize;
  }

  setFontSize(fontSize: number): void {
    this._settings.fontSize = fontSize;
    this.saveSingleSetting('fontSize', fontSize.toString(), 'string');
  }

  get fontColor(): string {
    return this._settings.fontColor;
  }

  setFontColor(fontColor: string): void {
    this._settings.fontColor = fontColor;
    this.saveSingleSetting('fontColor', fontColor, 'string');
  }

  get backgroundColor(): string {
    return this._settings.backgroundColor;
  }

  setBackgroundColor(backgroundColor: string): void {
    this._settings.backgroundColor = backgroundColor;
    this.saveSingleSetting('backgroundColor', backgroundColor, 'string');
  }

  /**
   * 基本設定
   */
  get weekStart(): WeekStart {
    return this._settings.weekStart;
  }

  setWeekStart(weekStart: WeekStart): void {
    this._settings.weekStart = weekStart;
    this.saveSingleSetting('weekStart', weekStart, 'string');
  }

  get timezone(): string {
    return this._settings.timezone;
  }

  get effectiveTimezone(): string {
    if (this._settings.timezone === 'system') {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
    return this._settings.timezone;
  }

  setTimezone(timezone: string): void {
    this._settings.timezone = timezone;
    this.saveSingleSetting('timezone', timezone, 'string');
  }

  get dateFormat(): string {
    return this._settings.dateFormat;
  }

  setDateFormat(dateFormat: string): void {
    this._settings.dateFormat = dateFormat;
    this.saveSingleSetting('dateFormat', dateFormat, 'string');
  }

  resetDateFormatToDefault(): void {
    const locale = getLocale();
    const defaultFormat = locale.startsWith('ja')
      ? 'yyyy年MM月dd日(E) HH:mm:ss'
      : 'EEEE, MMMM do, yyyy HH:mm:ss';
    this.setDateFormat(defaultFormat);
  }

  get customDateFormats(): CustomDateFormat[] {
    return this._settings.customDateFormats;
  }

  addCustomDateFormat(name: string, format: string): string {
    const id = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    this._settings.customDateFormats.push({ id, name, format });
    this.saveSingleSetting(
      'customDateFormats',
      JSON.stringify(this._settings.customDateFormats),
      'json'
    );
    return id;
  }

  updateCustomDateFormat(id: string, updates: Partial<Omit<CustomDateFormat, 'id'>>): void {
    const index = this._settings.customDateFormats.findIndex((f) => f.id === id);
    if (index !== -1) {
      this._settings.customDateFormats[index] = {
        ...this._settings.customDateFormats[index],
        ...updates
      };
      this.saveSingleSetting(
        'customDateFormats',
        JSON.stringify(this._settings.customDateFormats),
        'json'
      );
    }
  }

  removeCustomDateFormat(id: string): void {
    this._settings.customDateFormats = this._settings.customDateFormats.filter((f) => f.id !== id);
    this.saveSingleSetting(
      'customDateFormats',
      JSON.stringify(this._settings.customDateFormats),
      'json'
    );
  }

  get timeLabels(): TimeLabel[] {
    return this._settings.timeLabels;
  }

  addTimeLabel(name: string, time: string): string {
    const id = `time_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    this._settings.timeLabels.push({ id, name, time });
    this.saveSingleSetting('timeLabels', JSON.stringify(this._settings.timeLabels), 'json');
    return id;
  }

  updateTimeLabel(id: string, updates: Partial<Omit<TimeLabel, 'id'>>): void {
    const index = this._settings.timeLabels.findIndex((t) => t.id === id);
    if (index !== -1) {
      this._settings.timeLabels[index] = {
        ...this._settings.timeLabels[index],
        ...updates
      };
      this.saveSingleSetting('timeLabels', JSON.stringify(this._settings.timeLabels), 'json');
    }
  }

  removeTimeLabel(id: string): void {
    this._settings.timeLabels = this._settings.timeLabels.filter((t) => t.id !== id);
    this.saveSingleSetting('timeLabels', JSON.stringify(this._settings.timeLabels), 'json');
  }

  getTimeLabelsByTime(time: string): TimeLabel[] {
    return this._settings.timeLabels.filter((t) => t.time === time);
  }

  /**
   * 表示設定
   */
  get dueDateButtons() {
    return this._settings.dueDateButtons;
  }

  setDueDateButtonVisibility(buttonKey: keyof Settings['dueDateButtons'], visible: boolean): void {
    this._settings.dueDateButtons[buttonKey] = visible;
    this.saveSingleSetting('dueDateButtons', JSON.stringify(this._settings.dueDateButtons), 'json');
  }

  get viewItems(): ViewItem[] {
    return this._settings.viewItems;
  }

  get visibleViews(): ViewItem[] {
    return this._settings.viewItems
      .filter((item) => item.visible)
      .sort((a, b) => a.order - b.order);
  }

  get hiddenViews(): ViewItem[] {
    return this._settings.viewItems
      .filter((item) => !item.visible)
      .sort((a, b) => a.order - b.order);
  }

  setViewItemsConfiguration(visible: ViewItem[], hidden: ViewItem[]): void {
    const allItemsFromUI = [
      ...visible.map((item, index) => ({ ...item, visible: true, order: index })),
      ...hidden.map((item, index) => ({ ...item, visible: false, order: visible.length + index }))
    ];
    const itemMap = new Map(allItemsFromUI.map((i) => [i.id, i]));

    const newViewItems = this._settings.viewItems
      .map((originalItem) => {
        const updatedItem = itemMap.get(originalItem.id);
        if (updatedItem) {
          return { ...originalItem, visible: updatedItem.visible, order: updatedItem.order };
        }
        return originalItem;
      })
      .sort((a, b) => a.order - b.order);

    this._settings.viewItems = newViewItems;
    this.saveSingleSetting('viewItems', JSON.stringify(this._settings.viewItems), 'json');
  }

  resetViewItemsToDefaults(): void {
    this._settings.viewItems = [...DEFAULT_SETTINGS.viewItems];
    this.saveSingleSetting('viewItems', JSON.stringify(this._settings.viewItems), 'json');
  }

  /**
   * アカウント設定
   */
  get lastSelectedAccount(): string {
    return this._settings.lastSelectedAccount;
  }

  setLastSelectedAccount(lastSelectedAccount: string): void {
    this._settings.lastSelectedAccount = lastSelectedAccount;
    this.saveSingleSetting('lastSelectedAccount', lastSelectedAccount, 'string');
  }

  /**
   * 内部メソッド
   */
  private async saveSingleSetting(key: string, value: string, dataType: Setting['dataType']) {
    if (!this.isInitialized) {
      return;
    }

    try {
      await this.saveSetting(key, value, dataType);
      console.log(`Setting '${key}' saved successfully`);
    } catch (error) {
      console.error(`Failed to save setting '${key}':`, error);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('flequit-settings', JSON.stringify(this._settings));
      }
    }
  }

  private async saveSetting(key: string, value: string, dataType: Setting['dataType']) {
    // 新しい部分更新システムを使用するためのマッピング
    const partialSettings = this.convertKeyValueToPartialSettings(key, value);
    if (partialSettings) {
      await settingsInitService.updateSettingsPartially(partialSettings);
    } else {
      // 新しいSettingsに含まれない個別設定は従来のsetting serviceを使用
      const setting: Setting = {
        id: `setting_${key}`,
        key,
        value,
        dataType: dataType,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await settingsInitService.updateSetting(setting);
    }
  }

  private convertKeyValueToPartialSettings(key: string, value: string): Partial<Settings> | null {
    try {
      switch (key) {
        case 'theme':
          return { theme: value as 'system' | 'light' | 'dark' };
        case 'language':
          return { language: value };
        case 'font':
          return { font: value };
        case 'fontSize':
          return { fontSize: parseInt(value, 10) };
        case 'fontColor':
          return { fontColor: value };
        case 'backgroundColor':
          return { backgroundColor: value };
        case 'weekStart':
          return { weekStart: value as 'sunday' | 'monday' };
        case 'timezone':
          return { timezone: value };
        case 'dateFormat':
          return { dateFormat: value };
        case 'customDueDays':
          return { customDueDays: JSON.parse(value) };
        case 'customDateFormats':
          return { customDateFormats: JSON.parse(value) };
        case 'timeLabels':
          return { timeLabels: JSON.parse(value) };
        case 'dueDateButtons':
          return { dueDateButtons: JSON.parse(value) };
        case 'viewItems':
          return { viewItems: JSON.parse(value) };
        case 'lastSelectedAccount':
          return { lastSelectedAccount: value };
        default:
          // 新しいSettingsに含まれないキーの場合はnullを返す
          return null;
      }
    } catch (error) {
      console.error(`Failed to convert key '${key}' with value '${value}':`, error);
      return null;
    }
  }

  private async loadSettings() {
    try {
      const allSettings = await settingsInitService.getAllSettings();
      let loadedCount = 0;

      // 各設定項目をマッピング
      for (const setting of allSettings) {
        switch (setting.key) {
          // テーマ・外観設定
          case 'theme':
            if (['system', 'light', 'dark'].includes(setting.value)) {
              this._settings.theme = setting.value as Theme;
              loadedCount++;
            }
            break;
          case 'language':
            this._settings.language = setting.value;
            loadedCount++;
            break;
          case 'font':
          case 'appearance_font':
            this._settings.font = setting.value;
            loadedCount++;
            break;
          case 'fontSize':
          case 'appearance_fontSize': {
            const fontSize = parseInt(setting.value, 10);
            if (!isNaN(fontSize)) {
              this._settings.fontSize = fontSize;
              loadedCount++;
            }
            break;
          }
          case 'fontColor':
          case 'appearance_fontColor':
            this._settings.fontColor = setting.value;
            loadedCount++;
            break;
          case 'backgroundColor':
          case 'appearance_backgroundColor':
            this._settings.backgroundColor = setting.value;
            loadedCount++;
            break;

          // 基本設定
          case 'weekStart':
            if (['sunday', 'monday'].includes(setting.value)) {
              this._settings.weekStart = setting.value as WeekStart;
              loadedCount++;
            }
            break;
          case 'timezone':
            this._settings.timezone = setting.value;
            loadedCount++;
            break;
          case 'dateFormat':
            this._settings.dateFormat = setting.value;
            loadedCount++;
            break;
          case 'customDateFormats':
            if (setting.dataType === 'json') {
              try {
                this._settings.customDateFormats = JSON.parse(setting.value);
                loadedCount++;
              } catch (error) {
                console.error('Failed to parse customDateFormats:', error);
              }
            }
            break;
          case 'timeLabels':
            if (setting.dataType === 'json') {
              try {
                this._settings.timeLabels = JSON.parse(setting.value);
                loadedCount++;
              } catch (error) {
                console.error('Failed to parse timeLabels:', error);
              }
            }
            break;

          // 表示設定
          case 'dueDateButtons':
            if (setting.dataType === 'json') {
              try {
                this._settings.dueDateButtons = {
                  ...this._settings.dueDateButtons,
                  ...JSON.parse(setting.value)
                };
                loadedCount++;
              } catch (error) {
                console.error('Failed to parse dueDateButtons:', error);
              }
            }
            break;
          case 'viewItems':
          case 'views_visibility':
            if (setting.dataType === 'json') {
              try {
                const parsedData = JSON.parse(setting.value);
                // views_visibilityの場合は viewItems プロパティから取得
                const viewItems = parsedData.viewItems || parsedData;
                if (Array.isArray(viewItems)) {
                  this._settings.viewItems = viewItems;
                  loadedCount++;
                }
              } catch (error) {
                console.error('Failed to parse viewItems:', error);
              }
            }
            break;

          // アカウント設定
          case 'lastSelectedAccount':
            this._settings.lastSelectedAccount = setting.value;
            loadedCount++;
            break;
        }
      }

      if (loadedCount > 0) {
        console.log(`Settings loaded successfully from backend (${loadedCount} settings)`);
      } else {
        console.log('No settings found in backends, using defaults');
      }
    } catch (error) {
      console.error('Failed to load settings from backends:', error);

      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('flequit-settings');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            this._settings = { ...this._settings, ...parsed };
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
  }
}

export const mainSettingsStore = new MainSettingsStore();

// 旧settingsStoreとの互換性のためのエクスポート
export const settingsStore = mainSettingsStore;

// 初期化の実行
mainSettingsStore.init().catch((error) => {
  console.error('Failed to initialize main settings store:', error);
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
  const customFormats = mainSettingsStore.customDateFormats.map((f) => ({
    ...f,
    isStandard: false
  }));

  const customLabel = locale.startsWith('ja') ? 'カスタム' : 'Custom';
  const customFormat = { id: 'custom', name: customLabel, format: '', isStandard: false };

  return [...standardFormats, ...customFormats, customFormat];
}
