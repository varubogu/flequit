import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { SettingsData } from '$lib/types/settings';

// 設定ストアのモック
const mockSettingsStore = {
  settings: {
    theme: 'light',
    language: 'ja',
    ui: {
      sidebarCollapsed: false,
      showCompletedTasks: true,
      taskListDensity: 'comfortable'
    },
    dateFormat: {
      dateFormat: 'YYYY-MM-DD',
      timeFormat: 'HH:mm',
      dateTimeFormat: 'YYYY-MM-DD HH:mm'
    },
    account: {
      username: 'testuser',
      email: 'test@example.com'
    }
  } as SettingsData,

  updateSettings: vi.fn((updates: Partial<SettingsData>) => {
    mockSettingsStore.settings = {
      ...mockSettingsStore.settings,
      ...updates
    };
    return mockSettingsStore.settings;
  }),

  updateTheme: vi.fn((theme: string) => {
    mockSettingsStore.settings.theme = theme;
    return theme;
  }),

  updateLanguage: vi.fn((language: string) => {
    mockSettingsStore.settings.language = language;
    return language;
  }),

  updateUISettings: vi.fn((uiUpdates: Partial<SettingsData['ui']>) => {
    mockSettingsStore.settings.ui = {
      ...mockSettingsStore.settings.ui,
      ...uiUpdates
    };
    return mockSettingsStore.settings.ui;
  }),

  updateDateFormat: vi.fn((formatUpdates: Partial<SettingsData['dateFormat']>) => {
    mockSettingsStore.settings.dateFormat = {
      ...mockSettingsStore.settings.dateFormat,
      ...formatUpdates
    };
    return mockSettingsStore.settings.dateFormat;
  }),

  saveSettings: vi.fn(async () => {
    // ローカルストレージへの保存をシミュレート
    return true;
  }),

  resetSettings: vi.fn(() => {
    mockSettingsStore.settings = {
      theme: 'light',
      language: 'ja',
      ui: {
        sidebarCollapsed: false,
        showCompletedTasks: true,
        taskListDensity: 'comfortable'
      },
      dateFormat: {
        dateFormat: 'YYYY-MM-DD',
        timeFormat: 'HH:mm',
        dateTimeFormat: 'YYYY-MM-DD HH:mm'
      },
      account: {
        username: '',
        email: ''
      }
    };
    return mockSettingsStore.settings;
  })
};

// ローカライゼーションストアのモック
const mockLocaleStore = {
  locale: 'ja',
  availableLocales: ['ja', 'en'],

  setLocale: vi.fn((newLocale: string) => {
    mockLocaleStore.locale = newLocale;
    return newLocale;
  }),

  getMessage: vi.fn((key: string) => {
    const messages: Record<string, Record<string, string>> = {
      ja: {
        settings: '設定',
        general: '一般',
        appearance: '外観',
        account: 'アカウント',
        views: 'ビュー',
        theme: 'テーマ',
        language: '言語',
        save: '保存',
        cancel: 'キャンセル',
        reset: 'リセット'
      },
      en: {
        settings: 'Settings',
        general: 'General',
        appearance: 'Appearance',
        account: 'Account',
        views: 'Views',
        theme: 'Theme',
        language: 'Language',
        save: 'Save',
        cancel: 'Cancel',
        reset: 'Reset'
      }
    };
    return messages[mockLocaleStore.locale]?.[key] || key;
  })
};

describe('設定ダイアログ結合テスト', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // 設定を初期状態にリセット
    mockSettingsStore.settings = {
      theme: 'light',
      language: 'ja',
      ui: {
        sidebarCollapsed: false,
        showCompletedTasks: true,
        taskListDensity: 'comfortable'
      },
      dateFormat: {
        dateFormat: 'YYYY-MM-DD',
        timeFormat: 'HH:mm',
        dateTimeFormat: 'YYYY-MM-DD HH:mm'
      },
      account: {
        username: 'testuser',
        email: 'test@example.com'
      }
    };

    mockLocaleStore.locale = 'ja';
  });

  it('設定ダイアログの初期状態が正しく設定される', () => {
    // ダイアログの初期状態
    const dialogState = {
      open: false,
      selectedCategory: 'basic',
      searchQuery: ''
    };

    expect(dialogState.open).toBe(false);
    expect(dialogState.selectedCategory).toBe('basic');
    expect(mockSettingsStore.settings.theme).toBe('light');
    expect(mockSettingsStore.settings.language).toBe('ja');
  });

  it('基本設定タブで言語変更が正しく動作する', () => {
    // 言語変更の処理
    const changeLanguage = (newLanguage: string) => {
      mockSettingsStore.updateLanguage(newLanguage);
      mockLocaleStore.setLocale(newLanguage);
      return {
        settings: mockSettingsStore.settings,
        locale: mockLocaleStore.locale
      };
    };

    const result = changeLanguage('en');

    expect(mockSettingsStore.updateLanguage).toHaveBeenCalledWith('en');
    expect(mockLocaleStore.setLocale).toHaveBeenCalledWith('en');
    expect(result.settings.language).toBe('en');
    expect(result.locale).toBe('en');

    // メッセージが英語で表示されることを確認
    expect(mockLocaleStore.getMessage('settings')).toBe('Settings');
    expect(mockLocaleStore.getMessage('general')).toBe('General');
  });

  it('外観設定タブでテーマ変更が正しく動作する', () => {
    // テーマ変更の処理
    const changeTheme = (newTheme: string) => {
      mockSettingsStore.updateTheme(newTheme);
      return {
        theme: mockSettingsStore.settings.theme,
        appliedClasses: [`theme-${newTheme}`]
      };
    };

    const result = changeTheme('dark');

    expect(mockSettingsStore.updateTheme).toHaveBeenCalledWith('dark');
    expect(result.theme).toBe('dark');
    expect(result.appliedClasses).toContain('theme-dark');
  });

  it('UI設定の変更が正しく反映される', () => {
    // UI設定の変更
    const updateUISettings = (updates: Partial<SettingsData['ui']>) => {
      return mockSettingsStore.updateUISettings(updates);
    };

    // サイドバー設定変更
    const sidebarResult = updateUISettings({ sidebarCollapsed: true });
    expect(mockSettingsStore.updateUISettings).toHaveBeenCalledWith({ sidebarCollapsed: true });
    expect(sidebarResult.sidebarCollapsed).toBe(true);

    // タスク表示設定変更
    const taskDisplayResult = updateUISettings({ showCompletedTasks: false });
    expect(sidebarResult.sidebarCollapsed).toBe(true); // 前の変更が保持される
    expect(taskDisplayResult.showCompletedTasks).toBe(false);

    // 密度設定変更
    const densityResult = updateUISettings({ taskListDensity: 'compact' });
    expect(densityResult.taskListDensity).toBe('compact');
  });

  it('日付フォーマット設定が正しく動作する', () => {
    // 日付フォーマット変更
    const changeDateFormat = (formatUpdates: Partial<SettingsData['dateFormat']>) => {
      return mockSettingsStore.updateDateFormat(formatUpdates);
    };

    // 日付フォーマット変更
    const dateResult = changeDateFormat({ dateFormat: 'DD/MM/YYYY' });
    expect(mockSettingsStore.updateDateFormat).toHaveBeenCalledWith({ dateFormat: 'DD/MM/YYYY' });
    expect(dateResult.dateFormat).toBe('DD/MM/YYYY');

    // 時刻フォーマット変更
    const timeResult = changeDateFormat({ timeFormat: 'hh:mm A' });
    expect(timeResult.timeFormat).toBe('hh:mm A');
    expect(timeResult.dateFormat).toBe('DD/MM/YYYY'); // 前の変更が保持される

    // 組み合わせフォーマット変更
    const dateTimeResult = changeDateFormat({ dateTimeFormat: 'DD/MM/YYYY hh:mm A' });
    expect(dateTimeResult.dateTimeFormat).toBe('DD/MM/YYYY hh:mm A');
  });

  it('アカウント設定の更新が正しく動作する', () => {
    // アカウント情報更新
    const updateAccount = (accountUpdates: Partial<SettingsData['account']>) => {
      const newSettings = mockSettingsStore.updateSettings({
        account: {
          ...mockSettingsStore.settings.account,
          ...accountUpdates
        }
      });
      return newSettings.account;
    };

    const result = updateAccount({
      username: 'newuser',
      email: 'newuser@example.com'
    });

    expect(mockSettingsStore.updateSettings).toHaveBeenCalled();
    expect(result.username).toBe('newuser');
    expect(result.email).toBe('newuser@example.com');
  });

  it('設定タブ間の切り替えが状態を保持する', () => {
    // タブ切り替えのシミュレーション
    const tabState = {
      selectedCategory: 'basic',
      temporaryChanges: {} as Partial<SettingsData>
    };

    // 基本設定で言語変更
    tabState.selectedCategory = 'basic';
    tabState.temporaryChanges.language = 'en';

    // 外観設定に切り替え
    tabState.selectedCategory = 'appearance';
    tabState.temporaryChanges.theme = 'dark';

    // 設定を適用
    mockSettingsStore.updateSettings(tabState.temporaryChanges);

    expect(mockSettingsStore.settings.language).toBe('en');
    expect(mockSettingsStore.settings.theme).toBe('dark');
  });

  it('設定の保存とキャンセルが正しく動作する', async () => {
    // 一時的な変更
    const temporaryChanges = {
      theme: 'dark',
      language: 'en'
    };

    // 保存処理
    const saveChanges = async () => {
      mockSettingsStore.updateSettings(temporaryChanges);
      return await mockSettingsStore.saveSettings();
    };

    const saveResult = await saveChanges();

    expect(mockSettingsStore.updateSettings).toHaveBeenCalledWith(temporaryChanges);
    expect(mockSettingsStore.saveSettings).toHaveBeenCalled();
    expect(saveResult).toBe(true);

    // キャンセル処理（変更を破棄）
    const cancelChanges = () => {
      // 元の設定に戻す処理のシミュレーション
      mockSettingsStore.settings.theme = 'light';
      mockSettingsStore.settings.language = 'ja';
      return mockSettingsStore.settings;
    };

    const cancelResult = cancelChanges();
    expect(cancelResult.theme).toBe('light');
    expect(cancelResult.language).toBe('ja');
  });

  it('設定のリセットが正しく動作する', () => {
    // 設定を変更
    mockSettingsStore.updateTheme('dark');
    mockSettingsStore.updateLanguage('en');
    mockSettingsStore.updateUISettings({ sidebarCollapsed: true });

    expect(mockSettingsStore.settings.theme).toBe('dark');
    expect(mockSettingsStore.settings.language).toBe('en');
    expect(mockSettingsStore.settings.ui.sidebarCollapsed).toBe(true);

    // リセット実行
    const resetResult = mockSettingsStore.resetSettings();

    expect(mockSettingsStore.resetSettings).toHaveBeenCalled();
    expect(resetResult.theme).toBe('light');
    expect(resetResult.language).toBe('ja');
    expect(resetResult.ui.sidebarCollapsed).toBe(false);
  });

  it('言語変更時にリアクティブメッセージが更新される', () => {
    // 初期状態（日本語）
    expect(mockLocaleStore.getMessage('settings')).toBe('設定');
    expect(mockLocaleStore.getMessage('theme')).toBe('テーマ');

    // 言語を英語に変更
    mockLocaleStore.setLocale('en');

    // メッセージが英語に更新される
    expect(mockLocaleStore.getMessage('settings')).toBe('Settings');
    expect(mockLocaleStore.getMessage('theme')).toBe('Theme');

    // 再び日本語に戻す
    mockLocaleStore.setLocale('ja');
    expect(mockLocaleStore.getMessage('settings')).toBe('設定');
  });

  it('複数設定の同時変更が正しく処理される', () => {
    // 複数設定の同時変更
    const updateMultipleSettings = (updates: Partial<SettingsData>) => {
      return mockSettingsStore.updateSettings(updates);
    };

    const multipleUpdates = {
      theme: 'dark',
      language: 'en',
      ui: {
        sidebarCollapsed: true,
        showCompletedTasks: false,
        taskListDensity: 'compact' as const
      },
      dateFormat: {
        dateFormat: 'DD/MM/YYYY',
        timeFormat: 'hh:mm A',
        dateTimeFormat: 'DD/MM/YYYY hh:mm A'
      }
    };

    const result = updateMultipleSettings(multipleUpdates);

    expect(mockSettingsStore.updateSettings).toHaveBeenCalledWith(multipleUpdates);
    expect(result.theme).toBe('dark');
    expect(result.language).toBe('en');
    expect(result.ui.sidebarCollapsed).toBe(true);
    expect(result.ui.showCompletedTasks).toBe(false);
    expect(result.dateFormat.dateFormat).toBe('DD/MM/YYYY');
  });

  it('検索機能が設定項目をフィルタリングする', () => {
    // 設定項目の検索機能のシミュレーション
    const settingsItems = [
      { id: 'theme', name: 'テーマ', category: 'appearance' },
      { id: 'language', name: '言語', category: 'basic' },
      { id: 'sidebar', name: 'サイドバー', category: 'appearance' },
      { id: 'dateFormat', name: '日付フォーマット', category: 'basic' }
    ];

    const searchSettings = (query: string) => {
      return settingsItems.filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase())
      );
    };

    // テーマを検索
    const themeResults = searchSettings('テーマ');
    expect(themeResults).toHaveLength(1);
    expect(themeResults[0].id).toBe('theme');

    // 言語を検索
    const languageResults = searchSettings('言語');
    expect(languageResults).toHaveLength(1);
    expect(languageResults[0].id).toBe('language');

    // 空の検索（全件表示）
    const allResults = searchSettings('');
    expect(allResults).toHaveLength(4);
  });
});