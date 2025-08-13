import { getBackendService } from '$lib/services/backend';
import { settingsInitService } from '$lib/services/settings-init-service';
import type { Setting, Settings, Theme, WeekStart, CustomDateFormat, TimeLabel, ViewItem } from '$lib/types/settings';
import { getLocale } from '$paraglide/runtime';

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
    thisYearEnd: false,
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
  selectedAccount: '',
  accountIcon: null,
  accountName: '',
  email: '',
  password: '',
  serverUrl: ''
};

/**
 * メイン設定ストア
 */
class MainSettingsStore {
  private _settings = $state<Settings>({ ...DEFAULT_SETTINGS });
  private backendService: Awaited<ReturnType<typeof getBackendService>> | null = null;
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
    const id = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this._settings.customDateFormats.push({ id, name, format });
    this.saveSingleSetting('customDateFormats', JSON.stringify(this._settings.customDateFormats), 'json');
    return id;
  }

  updateCustomDateFormat(id: string, updates: Partial<Omit<CustomDateFormat, 'id'>>): void {
    const index = this._settings.customDateFormats.findIndex((f) => f.id === id);
    if (index !== -1) {
      this._settings.customDateFormats[index] = {
        ...this._settings.customDateFormats[index],
        ...updates
      };
      this.saveSingleSetting('customDateFormats', JSON.stringify(this._settings.customDateFormats), 'json');
    }
  }

  removeCustomDateFormat(id: string): void {
    this._settings.customDateFormats = this._settings.customDateFormats.filter((f) => f.id !== id);
    this.saveSingleSetting('customDateFormats', JSON.stringify(this._settings.customDateFormats), 'json');
  }

  get timeLabels(): TimeLabel[] {
    return this._settings.timeLabels;
  }

  addTimeLabel(name: string, time: string): string {
    const id = `time_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
  get selectedAccount(): string {
    return this._settings.selectedAccount;
  }

  setSelectedAccount(selectedAccount: string): void {
    this._settings.selectedAccount = selectedAccount;
    this.saveSingleSetting('selectedAccount', selectedAccount, 'string');
  }

  get accountIcon(): string | null {
    return this._settings.accountIcon;
  }

  setAccountIcon(accountIcon: string | null): void {
    this._settings.accountIcon = accountIcon;
    this.saveSingleSetting('accountIcon', accountIcon || '', 'string');
  }

  get accountName(): string {
    return this._settings.accountName;
  }

  setAccountName(accountName: string): void {
    this._settings.accountName = accountName;
    this.saveSingleSetting('accountName', accountName, 'string');
  }

  get email(): string {
    return this._settings.email;
  }

  setEmail(email: string): void {
    this._settings.email = email;
    this.saveSingleSetting('email', email, 'string');
  }

  get password(): string {
    return this._settings.password;
  }

  setPassword(password: string): void {
    this._settings.password = password;
    this.saveSingleSetting('password', password, 'string');
  }

  get serverUrl(): string {
    return this._settings.serverUrl;
  }

  setServerUrl(serverUrl: string): void {
    this._settings.serverUrl = serverUrl;
    this.saveSingleSetting('serverUrl', serverUrl, 'string');
  }

  /**
   * 内部メソッド
   */
  private async initBackendService() {
    if (!this.backendService) {
      this.backendService = await getBackendService();
    }
    return this.backendService;
  }

  private async saveSingleSetting(key: string, value: string, dataType: Setting['data_type']) {
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
          case 'appearance_fontSize':
            const fontSize = parseInt(setting.value, 10);
            if (!isNaN(fontSize)) {
              this._settings.fontSize = fontSize;
              loadedCount++;
            }
            break;
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
            if (setting.data_type === 'json') {
              try {
                this._settings.customDateFormats = JSON.parse(setting.value);
                loadedCount++;
              } catch (error) {
                console.error('Failed to parse customDateFormats:', error);
              }
            }
            break;
          case 'timeLabels':
            if (setting.data_type === 'json') {
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
            if (setting.data_type === 'json') {
              try {
                this._settings.dueDateButtons = { ...this._settings.dueDateButtons, ...JSON.parse(setting.value) };
                loadedCount++;
              } catch (error) {
                console.error('Failed to parse dueDateButtons:', error);
              }
            }
            break;
          case 'viewItems':
          case 'views_visibility':
            if (setting.data_type === 'json') {
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
          case 'selectedAccount':
            this._settings.selectedAccount = setting.value;
            loadedCount++;
            break;
          case 'accountIcon':
            this._settings.accountIcon = setting.value || null;
            loadedCount++;
            break;
          case 'accountName':
            this._settings.accountName = setting.value;
            loadedCount++;
            break;
          case 'email':
            this._settings.email = setting.value;
            loadedCount++;
            break;
          case 'password':
            this._settings.password = setting.value;
            loadedCount++;
            break;
          case 'serverUrl':
            this._settings.serverUrl = setting.value;
            loadedCount++;
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

// 初期化の実行
mainSettingsStore.init().catch(error => {
  console.error('Failed to initialize main settings store:', error);
});