import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import type { Settings } from '$lib/types/settings';
import { errorHandler } from '$lib/stores/error-handler.svelte';
import { buildSettings } from '../../factories/domain';

const createMockBackend = () => ({
  settingsManagement: {
    loadSettings: vi.fn(),
    saveSettings: vi.fn(),
    settingsFileExists: vi.fn(),
    initializeSettingsWithDefaults: vi.fn(),
    getSettingsFilePath: vi.fn(),
    updateSettingsPartially: vi.fn(),
    addCustomDueDay: vi.fn()
  }
});

describe('SettingsService', () => {
  let SettingsService: typeof import('$lib/services/domain/settings').SettingsService;
  let mockBackend: ReturnType<typeof createMockBackend>;
  let sampleSettings: Settings;
  let resolveBackendSpy: ReturnType<typeof vi.spyOn>;
  let backendClientModule: typeof import('$lib/infrastructure/backend-client');
  type AddSyncErrorSpy = ReturnType<typeof vi.spyOn> & {
    mockImplementation: (
      fn: (
        operation: string,
        resourceType: string,
        resourceId: string,
        originalError: unknown
      ) => string
    ) => AddSyncErrorSpy;
  };
  let addSyncErrorSpy: AddSyncErrorSpy;

  beforeAll(async () => {
    backendClientModule = await import('$lib/infrastructure/backend-client');
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    backendClientModule.resetBackendCache();
    mockBackend = createMockBackend();
    sampleSettings = buildSettings();
    resolveBackendSpy = vi
      .spyOn(backendClientModule, 'resolveBackend')
      .mockResolvedValue(mockBackend as any);
    addSyncErrorSpy = vi.spyOn(errorHandler, 'addSyncError') as unknown as AddSyncErrorSpy;
    addSyncErrorSpy.mockImplementation(() => '');
    vi.doUnmock('$lib/services/domain/settings');
    ({ SettingsService } = await import('$lib/services/domain/settings'));
  });

  afterEach(() => {
    resolveBackendSpy.mockRestore();
    addSyncErrorSpy.mockRestore();
    vi.clearAllMocks();
  });

  describe('loadSettings', () => {
    it('バックエンドから設定を取得する', async () => {
      mockBackend.settingsManagement.loadSettings.mockResolvedValue(sampleSettings);

      const result = await SettingsService.loadSettings();

      expect(mockBackend.settingsManagement.loadSettings).toHaveBeenCalledTimes(1);
      expect(result).toEqual(sampleSettings);
    });

    it('失敗時にerrorHandlerを呼び出す', async () => {
      const error = new Error('load failed');
      mockBackend.settingsManagement.loadSettings.mockRejectedValue(error);

      await expect(SettingsService.loadSettings()).rejects.toThrow('load failed');
      expect(errorHandler.addSyncError).toHaveBeenCalledWith('設定読込', 'settings', 'load', error);
    });
  });

  describe('saveSettings', () => {
    it('設定を保存してtrueを返す', async () => {
      mockBackend.settingsManagement.saveSettings.mockResolvedValue(true);

      const result = await SettingsService.saveSettings(sampleSettings);

      expect(mockBackend.settingsManagement.saveSettings).toHaveBeenCalledWith(sampleSettings);
      expect(result).toBe(true);
    });

    it('保存に失敗した場合はerrorHandlerを呼び出す', async () => {
      const error = new Error('save failed');
      mockBackend.settingsManagement.saveSettings.mockRejectedValue(error);

      await expect(SettingsService.saveSettings(sampleSettings)).rejects.toThrow('save failed');
      expect(errorHandler.addSyncError).toHaveBeenCalledWith('設定保存', 'settings', 'save', error);
    });

    it('バックエンドがfalseを返した場合はfalseを返す', async () => {
      mockBackend.settingsManagement.saveSettings.mockResolvedValue(false);

      const result = await SettingsService.saveSettings(sampleSettings);

      expect(result).toBe(false);
    });
  });

  describe('settingsFileExists', () => {
    it('設定ファイルの存在をチェックする', async () => {
      mockBackend.settingsManagement.settingsFileExists.mockResolvedValue(true);

      const result = await SettingsService.settingsFileExists();

      expect(result).toBe(true);
    });

    it('チェック失敗時はerrorHandlerを呼び出す', async () => {
      const error = new Error('exists failed');
      mockBackend.settingsManagement.settingsFileExists.mockRejectedValue(error);

      await expect(SettingsService.settingsFileExists()).rejects.toThrow('exists failed');
      expect(errorHandler.addSyncError).toHaveBeenCalledWith(
        '設定ファイル確認',
        'settings',
        'exists',
        error
      );
    });
  });

  describe('initializeSettingsWithDefaults', () => {
    it('初期化成功時はtrueを返す', async () => {
      mockBackend.settingsManagement.initializeSettingsWithDefaults.mockResolvedValue(true);

      const result = await SettingsService.initializeSettingsWithDefaults();

      expect(result).toBe(true);
    });

    it('初期化失敗時はerrorHandlerを呼び出す', async () => {
      const error = new Error('init failed');
      mockBackend.settingsManagement.initializeSettingsWithDefaults.mockRejectedValue(error);

      await expect(SettingsService.initializeSettingsWithDefaults()).rejects.toThrow('init failed');
      expect(errorHandler.addSyncError).toHaveBeenCalledWith(
        '設定初期化',
        'settings',
        'initialize',
        error
      );
    });
  });

  describe('getSettingsFilePath', () => {
    it('設定ファイルパスを返す', async () => {
      mockBackend.settingsManagement.getSettingsFilePath.mockResolvedValue('/path/settings.json');

      const result = await SettingsService.getSettingsFilePath();

      expect(result).toBe('/path/settings.json');
    });

    it('取得失敗時はerrorHandlerを呼び出す', async () => {
      const error = new Error('path failed');
      mockBackend.settingsManagement.getSettingsFilePath.mockRejectedValue(error);

      await expect(SettingsService.getSettingsFilePath()).rejects.toThrow('path failed');
      expect(errorHandler.addSyncError).toHaveBeenCalledWith(
        '設定ファイル取得',
        'settings',
        'path',
        error
      );
    });
  });

  describe('updateSettingsPartially', () => {
    it('部分更新結果を返す', async () => {
      const partial = { theme: 'dark' as const };
      const updated = { ...sampleSettings, ...partial };
      mockBackend.settingsManagement.updateSettingsPartially.mockResolvedValue(updated);

      const result = await SettingsService.updateSettingsPartially(partial);

      expect(mockBackend.settingsManagement.updateSettingsPartially).toHaveBeenCalledWith(partial);
      expect(result).toEqual(updated);
    });

    it('失敗時はerrorHandlerを呼び出す', async () => {
      const error = new Error('partial failed');
      mockBackend.settingsManagement.updateSettingsPartially.mockRejectedValue(error);

      await expect(SettingsService.updateSettingsPartially({})).rejects.toThrow('partial failed');
      expect(errorHandler.addSyncError).toHaveBeenCalledWith(
        '設定部分更新',
        'settings',
        'partial',
        error
      );
    });
  });

  describe('addCustomDueDay', () => {
    it('正の値を追加する', async () => {
      mockBackend.settingsManagement.addCustomDueDay.mockResolvedValue(true);

      const result = await SettingsService.addCustomDueDay(7);

      expect(mockBackend.settingsManagement.addCustomDueDay).toHaveBeenCalledWith(7);
      expect(result).toBe(true);
    });

    it('負の値でもバックエンドに委譲する', async () => {
      mockBackend.settingsManagement.addCustomDueDay.mockResolvedValue(true);

      const result = await SettingsService.addCustomDueDay(-3);

      expect(mockBackend.settingsManagement.addCustomDueDay).toHaveBeenCalledWith(-3);
      expect(result).toBe(true);
    });

    it('追加失敗時はerrorHandlerを呼び出す', async () => {
      const error = new Error('add failed');
      mockBackend.settingsManagement.addCustomDueDay.mockRejectedValue(error);

      await expect(SettingsService.addCustomDueDay(5)).rejects.toThrow('add failed');
      expect(errorHandler.addSyncError).toHaveBeenCalledWith(
        '設定期日追加',
        'settings',
        'custom_due_day',
        error
      );
    });
  });
});
