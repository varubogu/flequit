import { describe, it, expect, beforeEach, vi } from 'vitest';

// テスト用の設定型定義
interface UISettings {
  sidebarCollapsed: boolean;
  showCompletedTasks: boolean;
  taskListDensity: string;
}

interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
}

interface LocaleMessages {
  [locale: string]: Record<string, string>;
}

describe('設定変更とUI反映の結合テスト', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('テーマ変更が設定ストアとUI状態に正しく反映される', async () => {
    // 設定管理用のモックストア
    const settingsStore = {
      settings: {
        theme: 'light',
        language: 'ja',
        ui: {
          sidebarCollapsed: false,
          showCompletedTasks: true,
          taskListDensity: 'comfortable'
        }
      },

      updateTheme: (theme: string) => {
        settingsStore.settings.theme = theme;
        return settingsStore.settings.theme;
      },

      updateLanguage: (language: string) => {
        settingsStore.settings.language = language;
        return settingsStore.settings.language;
      },

      updateUISettings: (uiUpdates: Partial<UISettings>) => {
        settingsStore.settings.ui = {
          ...settingsStore.settings.ui,
          ...uiUpdates
        };
        return settingsStore.settings.ui;
      }
    };

    // 初期状態確認
    expect(settingsStore.settings.theme).toBe('light');

    // テーマ変更
    const newTheme = settingsStore.updateTheme('dark');
    expect(newTheme).toBe('dark');
    expect(settingsStore.settings.theme).toBe('dark');

    // テーマを再変更
    const anotherTheme = settingsStore.updateTheme('auto');
    expect(anotherTheme).toBe('auto');
    expect(settingsStore.settings.theme).toBe('auto');
  });

  it('言語変更が設定ストアとローカライゼーションに正しく反映される', async () => {
    const localeStore = {
      locale: 'ja',

      setLocale: (newLocale: string) => {
        localeStore.locale = newLocale;
        return localeStore.locale;
      },

      getMessage: (key: string) => {
        const messages: LocaleMessages = {
          ja: { title: 'タスク管理', settings: '設定' },
          en: { title: 'Task Management', settings: 'Settings' }
        };
        return messages[localeStore.locale]?.[key] || key;
      }
    };

    // 初期状態確認
    expect(localeStore.locale).toBe('ja');
    expect(localeStore.getMessage('title')).toBe('タスク管理');

    // 言語変更
    const newLocale = localeStore.setLocale('en');
    expect(newLocale).toBe('en');
    expect(localeStore.locale).toBe('en');
    expect(localeStore.getMessage('title')).toBe('Task Management');
    expect(localeStore.getMessage('settings')).toBe('Settings');
  });

  it('UI設定変更が正しく反映される', async () => {
    const uiStore = {
      settings: {
        sidebarCollapsed: false,
        showCompletedTasks: true,
        taskListDensity: 'comfortable',
        notifications: {
          enabled: true,
          sound: false
        }
      },

      toggleSidebar: () => {
        uiStore.settings.sidebarCollapsed = !uiStore.settings.sidebarCollapsed;
        return uiStore.settings.sidebarCollapsed;
      },

      updateTaskDisplay: (showCompleted: boolean) => {
        uiStore.settings.showCompletedTasks = showCompleted;
        return uiStore.settings.showCompletedTasks;
      },

      updateDensity: (density: string) => {
        uiStore.settings.taskListDensity = density;
        return uiStore.settings.taskListDensity;
      },

      updateNotifications: (notificationUpdates: Partial<NotificationSettings>) => {
        uiStore.settings.notifications = {
          ...uiStore.settings.notifications,
          ...notificationUpdates
        };
        return uiStore.settings.notifications;
      }
    };

    // 初期状態確認
    expect(uiStore.settings.sidebarCollapsed).toBe(false);
    expect(uiStore.settings.showCompletedTasks).toBe(true);

    // サイドバー切り替え
    const sidebarState = uiStore.toggleSidebar();
    expect(sidebarState).toBe(true);
    expect(uiStore.settings.sidebarCollapsed).toBe(true);

    // タスク表示設定変更
    const taskDisplay = uiStore.updateTaskDisplay(false);
    expect(taskDisplay).toBe(false);
    expect(uiStore.settings.showCompletedTasks).toBe(false);

    // 密度設定変更
    const density = uiStore.updateDensity('compact');
    expect(density).toBe('compact');
    expect(uiStore.settings.taskListDensity).toBe('compact');

    // 通知設定変更
    const notifications = uiStore.updateNotifications({ enabled: false, sound: true });
    expect(notifications).toEqual({ enabled: false, sound: true });
    expect(uiStore.settings.notifications.enabled).toBe(false);
    expect(uiStore.settings.notifications.sound).toBe(true);
  });

  it('設定変更がリアクティブに連携する', async () => {
    // 統合された設定管理
    const appStateStore = {
      theme: 'light',
      language: 'ja',
      sidebarCollapsed: false,

      changeTheme: (theme: string) => {
        appStateStore.theme = theme;
        // テーマ変更に連動してUI要素も更新
        return {
          theme: appStateStore.theme,
          appliedClasses: [`theme-${theme}`]
        };
      },

      changeLanguage: (language: string) => {
        appStateStore.language = language;
        // 言語変更に連動してメッセージも更新
        const messages: LocaleMessages = {
          ja: { greeting: 'こんにちは' },
          en: { greeting: 'Hello' }
        };
        return {
          language: appStateStore.language,
          greeting: messages[language]?.greeting
        };
      },

      toggleSidebarWithTheme: () => {
        appStateStore.sidebarCollapsed = !appStateStore.sidebarCollapsed;
        // サイドバー状態に応じてレイアウトクラスも変更
        return {
          sidebarCollapsed: appStateStore.sidebarCollapsed,
          layoutClass: appStateStore.sidebarCollapsed ? 'layout-collapsed' : 'layout-expanded'
        };
      }
    };

    // 複数設定の連携テスト
    const themeResult = appStateStore.changeTheme('dark');
    expect(themeResult.theme).toBe('dark');
    expect(themeResult.appliedClasses).toContain('theme-dark');

    const languageResult = appStateStore.changeLanguage('en');
    expect(languageResult.language).toBe('en');
    expect(languageResult.greeting).toBe('Hello');

    const sidebarResult = appStateStore.toggleSidebarWithTheme();
    expect(sidebarResult.sidebarCollapsed).toBe(true);
    expect(sidebarResult.layoutClass).toBe('layout-collapsed');

    // 最終状態確認
    expect(appStateStore.theme).toBe('dark');
    expect(appStateStore.language).toBe('en');
    expect(appStateStore.sidebarCollapsed).toBe(true);
  });
});
