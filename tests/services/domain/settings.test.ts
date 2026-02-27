import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildSettings, buildSetting } from '../../factories/domain';
import type { Setting } from '$lib/types/settings';
import * as backendClient from '$lib/infrastructure/backend-client';

// ---------- モック ----------

// グローバルモック (mock-domain.ts) を実際の実装で上書き
vi.mock('$lib/services/domain/settings', async () => {
  const actual = await vi.importActual<typeof import('$lib/services/domain/settings')>(
    '$lib/services/domain/settings'
  );
  return actual;
});

vi.mock('$lib/infrastructure/backend-client');

vi.mock('$lib/stores/error-handler.svelte', () => ({
  errorHandler: {
    addSyncError: vi.fn()
  }
}));

// ---------- テスト ----------

import { settingsInitService, SettingsService } from '$lib/services/domain/settings';
import { errorHandler } from '$lib/stores/error-handler.svelte';

describe('settingsInitService', () => {
  const backendMock = {
    setting: {
      getAll: vi.fn(),
      update: vi.fn()
    },
    settingsManagement: {
      updateSettingsPartially: vi.fn()
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(backendClient.resolveBackend).mockResolvedValue(backendMock as any);
    settingsInitService.clearCache();
  });

  describe('getAllSettings', () => {
    it('バックエンドから設定一覧を取得する', async () => {
      const settings = [buildSetting({ key: 'app.theme', value: 'dark' })];
      backendMock.setting.getAll.mockResolvedValue(settings);

      const result = await settingsInitService.getAllSettings();

      expect(backendMock.setting.getAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(settings);
    });

    it('2回目の呼び出しはキャッシュを返す', async () => {
      const settings = [buildSetting({ key: 'app.theme', value: 'dark' })];
      backendMock.setting.getAll.mockResolvedValue(settings);

      await settingsInitService.getAllSettings();
      const result = await settingsInitService.getAllSettings();

      expect(backendMock.setting.getAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(settings);
    });

    it('バックエンドがエラーを返した場合は空配列を返す', async () => {
      backendMock.setting.getAll.mockRejectedValue(new Error('Unavailable'));

      const result = await settingsInitService.getAllSettings();

      expect(result).toEqual([]);
    });

    it('clearCacheするとキャッシュをリセットする', async () => {
      const settings = [buildSetting()];
      backendMock.setting.getAll.mockResolvedValue(settings);

      await settingsInitService.getAllSettings();
      settingsInitService.clearCache();
      await settingsInitService.getAllSettings();

      expect(backendMock.setting.getAll).toHaveBeenCalledTimes(2);
    });
  });

  describe('getSettingByKey', () => {
    it('キーに一致する設定を返す', () => {
      const settings: Setting[] = [
        buildSetting({ key: 'app.theme', value: 'dark' }),
        buildSetting({ key: 'app.language', value: 'ja' })
      ];

      const result = settingsInitService.getSettingByKey(settings, 'app.theme');

      expect(result?.key).toBe('app.theme');
      expect(result?.value).toBe('dark');
    });

    it('存在しないキーはundefinedを返す', () => {
      const settings: Setting[] = [buildSetting({ key: 'app.theme' })];

      const result = settingsInitService.getSettingByKey(settings, 'non.existent');

      expect(result).toBeUndefined();
    });
  });

  describe('getSettingsByKeyPattern', () => {
    it('パターンに一致する設定一覧を返す', () => {
      const settings: Setting[] = [
        buildSetting({ key: 'app.theme' }),
        buildSetting({ key: 'app.language' }),
        buildSetting({ key: 'other.setting' })
      ];

      const result = settingsInitService.getSettingsByKeyPattern(settings, 'app.');

      expect(result).toHaveLength(2);
      expect(result.every((s) => s.key.startsWith('app.'))).toBe(true);
    });

    it('一致しない場合は空配列を返す', () => {
      const settings: Setting[] = [buildSetting({ key: 'app.theme' })];

      const result = settingsInitService.getSettingsByKeyPattern(settings, 'other.');

      expect(result).toHaveLength(0);
    });
  });

  describe('updateSettingsPartially', () => {
    it('バックエンドに設定を部分更新する', async () => {
      backendMock.settingsManagement.updateSettingsPartially.mockResolvedValue(undefined);

      await settingsInitService.updateSettingsPartially({ theme: 'dark' });

      expect(backendMock.settingsManagement.updateSettingsPartially).toHaveBeenCalledWith({
        theme: 'dark'
      });
    });
  });

  describe('updateSetting', () => {
    it('バックエンドに設定を更新する', async () => {
      const setting = buildSetting({ key: 'app.theme', value: 'light' });
      backendMock.setting.update.mockResolvedValue(undefined);

      await settingsInitService.updateSetting(setting);

      expect(backendMock.setting.update).toHaveBeenCalledWith(setting);
    });
  });
});

describe('SettingsService', () => {
  const backendMock = {
    settingsManagement: {
      loadSettings: vi.fn(),
      saveSettings: vi.fn(),
      settingsFileExists: vi.fn(),
      initializeSettingsWithDefaults: vi.fn(),
      getSettingsFilePath: vi.fn(),
      updateSettingsPartially: vi.fn(),
      addCustomDueDay: vi.fn()
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(backendClient.resolveBackend).mockResolvedValue(backendMock as any);
  });

  describe('loadSettings', () => {
    it('バックエンドから設定を読み込む', async () => {
      const settings = buildSettings({ theme: 'dark' });
      backendMock.settingsManagement.loadSettings.mockResolvedValue(settings);

      const result = await SettingsService.loadSettings();

      expect(result).toEqual(settings);
    });

    it('バックエンドエラー時はエラーを記録して再スローする', async () => {
      const error = new Error('Load failed');
      backendMock.settingsManagement.loadSettings.mockRejectedValue(error);

      await expect(SettingsService.loadSettings()).rejects.toThrow('Load failed');
      expect(errorHandler.addSyncError).toHaveBeenCalledWith(
        '設定読込',
        'settings',
        'load',
        error
      );
    });
  });

  describe('saveSettings', () => {
    it('バックエンドに設定を保存する', async () => {
      const settings = buildSettings();
      backendMock.settingsManagement.saveSettings.mockResolvedValue(true);

      const result = await SettingsService.saveSettings(settings);

      expect(backendMock.settingsManagement.saveSettings).toHaveBeenCalledWith(settings);
      expect(result).toBe(true);
    });

    it('バックエンドエラー時はエラーを記録して再スローする', async () => {
      const error = new Error('Save failed');
      backendMock.settingsManagement.saveSettings.mockRejectedValue(error);

      await expect(SettingsService.saveSettings(buildSettings())).rejects.toThrow('Save failed');
      expect(errorHandler.addSyncError).toHaveBeenCalledWith(
        '設定保存',
        'settings',
        'save',
        error
      );
    });
  });

  describe('settingsFileExists', () => {
    it('設定ファイルの存在確認結果を返す', async () => {
      backendMock.settingsManagement.settingsFileExists.mockResolvedValue(true);

      const result = await SettingsService.settingsFileExists();

      expect(result).toBe(true);
    });
  });

  describe('initializeSettingsWithDefaults', () => {
    it('デフォルト設定で初期化する', async () => {
      backendMock.settingsManagement.initializeSettingsWithDefaults.mockResolvedValue(true);

      const result = await SettingsService.initializeSettingsWithDefaults();

      expect(result).toBe(true);
    });
  });

  describe('getSettingsFilePath', () => {
    it('設定ファイルのパスを取得する', async () => {
      backendMock.settingsManagement.getSettingsFilePath.mockResolvedValue(
        '/path/to/settings.json'
      );

      const result = await SettingsService.getSettingsFilePath();

      expect(result).toBe('/path/to/settings.json');
    });
  });

  describe('updateSettingsPartially', () => {
    it('設定を部分更新する', async () => {
      const updated = buildSettings({ theme: 'dark' });
      backendMock.settingsManagement.updateSettingsPartially.mockResolvedValue(updated);

      const result = await SettingsService.updateSettingsPartially({ theme: 'dark' });

      expect(result).toEqual(updated);
    });
  });

  describe('addCustomDueDay', () => {
    it('カスタム期日日数を追加する', async () => {
      backendMock.settingsManagement.addCustomDueDay.mockResolvedValue(true);

      const result = await SettingsService.addCustomDueDay(14);

      expect(backendMock.settingsManagement.addCustomDueDay).toHaveBeenCalledWith(14);
      expect(result).toBe(true);
    });

    it('バックエンドエラー時はエラーを記録して再スローする', async () => {
      const error = new Error('Add failed');
      backendMock.settingsManagement.addCustomDueDay.mockRejectedValue(error);

      await expect(SettingsService.addCustomDueDay(14)).rejects.toThrow('Add failed');
      expect(errorHandler.addSyncError).toHaveBeenCalledWith(
        '設定期日追加',
        'settings',
        'custom_due_day',
        error
      );
    });
  });
});
